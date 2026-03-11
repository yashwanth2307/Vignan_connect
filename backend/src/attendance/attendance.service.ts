import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
    constructor(private prisma: PrismaService) { }

    // ── Get students by section + semester + department filters ──
    async getStudentsByFilters(sectionId?: string, semesterId?: string, departmentId?: string) {
        const where: any = {};
        if (sectionId) where.sectionId = sectionId;
        if (departmentId) where.departmentId = departmentId;

        const students = await this.prisma.student.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                section: { select: { id: true, name: true } },
                department: { select: { id: true, name: true, code: true } },
            },
            orderBy: { rollNo: 'asc' },
        });

        return students;
    }

    // ── Faculty: Start Attendance Session (Manual, no QR) ──
    async startSession(courseOfferingId: string, hourIndex: number, userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Not a faculty member');

        const co = await this.prisma.courseOffering.findFirst({
            where: { id: courseOfferingId, facultyId: faculty.id },
        });
        if (!co) throw new ForbiddenException('You are not assigned to this course offering');

        // Check for existing active session
        const existingActive = await this.prisma.attendanceSession.findFirst({
            where: { courseOfferingId, status: 'ACTIVE' },
        });
        if (existingActive) throw new BadRequestException('An active session already exists');

        const now = new Date();

        const session = await this.prisma.attendanceSession.create({
            data: {
                courseOfferingId,
                date: new Date(now.toISOString().split('T')[0]),
                hourIndex,
                status: 'ACTIVE',
            },
            include: {
                courseOffering: {
                    include: {
                        subject: true,
                        section: { include: { department: true } },
                    },
                },
            },
        });

        // Pre-fetch student names for this section
        const students = await this.prisma.student.findMany({
            where: { sectionId: session.courseOffering.sectionId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { rollNo: 'asc' },
        });

        return { session, students };
    }

    // ── Faculty: Mark Attendance for Students (Manual Bulk) ──
    async markAttendance(sessionId: string, studentIds: string[], userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Not a faculty member');

        const session = await this.prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: { courseOffering: true },
        });
        if (!session) throw new NotFoundException('Session not found');
        if (session.courseOffering.facultyId !== faculty.id) {
            throw new ForbiddenException('Not your session');
        }

        // Get all students of the section
        const sectionStudents = await this.prisma.student.findMany({
            where: { sectionId: session.courseOffering.sectionId },
            select: { id: true, rollNo: true },
        });
        const sectionStudentIds = new Set(sectionStudents.map(s => s.id));

        // Validate all student IDs belong to section
        for (const sid of studentIds) {
            if (!sectionStudentIds.has(sid)) {
                throw new BadRequestException(`Student ${sid} is not in this section`);
            }
        }

        // Delete existing records for this session and create new ones
        await this.prisma.attendanceRecord.deleteMany({
            where: { attendanceSessionId: sessionId },
        });

        // Create PRESENT records for marked students
        const presentRecords = studentIds.map(studentId => ({
            attendanceSessionId: sessionId,
            studentId,
            status: 'PRESENT' as const,
        }));

        if (presentRecords.length > 0) {
            await this.prisma.attendanceRecord.createMany({ data: presentRecords });
        }

        // Create ABSENT records for unmarked students
        const absentStudentIds = sectionStudents
            .filter(s => !studentIds.includes(s.id))
            .map(s => s.id);

        if (absentStudentIds.length > 0) {
            await this.prisma.attendanceRecord.createMany({
                data: absentStudentIds.map(studentId => ({
                    attendanceSessionId: sessionId,
                    studentId,
                    status: 'ABSENT' as const,
                })),
            });
        }

        return this.getSessionRecords(sessionId);
    }

    // ── Stop Session ──
    async stopSession(sessionId: string, userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Not a faculty');

        const session = await this.prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: { courseOffering: true },
        });
        if (!session) throw new NotFoundException('Session not found');
        if (session.courseOffering.facultyId !== faculty.id) throw new ForbiddenException('Not your session');

        return this.prisma.attendanceSession.update({
            where: { id: sessionId },
            data: { status: 'CLOSED' },
        });
    }

    // ── Get Session Records ──
    async getSessionRecords(sessionId: string) {
        return this.prisma.attendanceRecord.findMany({
            where: { attendanceSessionId: sessionId },
            include: {
                student: {
                    include: {
                        user: { select: { name: true, email: true } },
                        section: { select: { name: true } },
                        department: { select: { code: true } },
                    },
                },
            },
            orderBy: { markedAt: 'asc' },
        });
    }

    // ── Get Student Attendance Summary ──
    async getStudentAttendance(userId: string, courseOfferingId?: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        const where: any = { studentId: student.id };
        if (courseOfferingId) {
            where.attendanceSession = { courseOfferingId };
        }

        const records = await this.prisma.attendanceRecord.findMany({
            where,
            include: {
                attendanceSession: {
                    include: { courseOffering: { include: { subject: true } } },
                },
            },
            orderBy: { markedAt: 'desc' },
        });

        // Calculate percentages per subject
        if (!courseOfferingId) {
            const courseOfferings = await this.prisma.courseOffering.findMany({
                where: { sectionId: student.sectionId },
                include: { subject: true, attendanceSessions: true },
            });

            const summary = courseOfferings.map(co => {
                const totalSessions = co.attendanceSessions.length;
                const attended = records.filter(r =>
                    r.attendanceSession.courseOfferingId === co.id && r.status === 'PRESENT'
                ).length;
                return {
                    courseOfferingId: co.id,
                    subjectCode: co.subject.code,
                    subjectTitle: co.subject.title,
                    totalSessions,
                    attended,
                    percentage: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
                };
            });

            return { records, summary };
        }

        return { records };
    }

    // ── Get Active Session for Course Offering ──
    async getActiveSession(courseOfferingId: string) {
        return this.prisma.attendanceSession.findFirst({
            where: { courseOfferingId, status: 'ACTIVE' },
            include: {
                courseOffering: { include: { subject: true, section: true } },
                records: {
                    include: { student: { include: { user: { select: { name: true } } } } },
                },
            },
        });
    }

    // ── Get all sessions for a course offering ──
    async getSessions(courseOfferingId: string) {
        return this.prisma.attendanceSession.findMany({
            where: { courseOfferingId },
            include: {
                courseOffering: { include: { subject: true, section: true } },
                records: {
                    include: { student: { include: { user: { select: { name: true } } } } },
                },
            },
            orderBy: { date: 'desc' },
        });
    }
}
