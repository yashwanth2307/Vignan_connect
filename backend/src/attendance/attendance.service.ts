import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // ── Get students by section + semester + department filters ──
  async getStudentsByFilters(
    sectionId?: string,
    semesterId?: string,
    departmentId?: string,
  ) {
    const where: any = {};
    if (sectionId) where.sectionId = sectionId;
    if (departmentId) where.departmentId = departmentId;
    if (semesterId) where.currentSemester = parseInt(semesterId);

    const students = await this.prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        section: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
        attendanceRecords: {
          include: {
            attendanceSession: true,
          },
        },
      },
      orderBy: { rollNo: 'asc' },
    });

    // Calculate attendance percentage for each student
    return students.map((student) => {
      // We could optionally filter sessions by the requested semesterId
      // Here we just look at all records the student has historically
      const records = student.attendanceRecords;
      const totalSessions = records.length;
      const presentCount = records.filter((r) => r.status === 'PRESENT').length;

      const attendancePercentage =
        totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      // Remove the raw records from the payload so we don't send mega-data,
      // but append our calculated values.
      const { attendanceRecords, ...rest } = student;
      return {
        ...rest,
        attendanceStats: {
          totalSessions,
          presentCount,
          attendancePercentage,
        },
      };
    });
  }

  // ── Faculty: Start Attendance Session (Manual, no QR) ──
  async startSession(
    courseOfferingId: string,
    hourIndex: number,
    userId: string,
  ) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new ForbiddenException('Not a faculty member');

    const co = await this.prisma.courseOffering.findFirst({
      where: { id: courseOfferingId, facultyId: faculty.id },
    });
    if (!co)
      throw new ForbiddenException(
        'You are not assigned to this course offering',
      );

    // Check for existing active session
    const existingActive = await this.prisma.attendanceSession.findFirst({
      where: { courseOfferingId, status: 'ACTIVE' },
    });
    if (existingActive)
      throw new BadRequestException('An active session already exists');

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
  async markAttendance(
    sessionId: string,
    records: {
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' | 'ML';
      remarks?: string;
    }[],
    userId: string,
  ) {
    const userRoleInfo = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!userRoleInfo) throw new ForbiddenException('User not found');
    const isAdmin = userRoleInfo.role === 'ADMIN';

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { courseOffering: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    if (!isAdmin) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Not a faculty member');
        if (session.courseOffering.facultyId !== faculty.id) {
            throw new ForbiddenException('Not your session');
        }
    }

    if (session.isLocked && !isAdmin) {
      throw new BadRequestException('Session is locked and cannot be modified');
    }

    // Get all students of the section to validate
    const sectionStudents = await this.prisma.student.findMany({
      where: { sectionId: session.courseOffering.sectionId },
      select: { id: true },
    });
    const sectionStudentIds = new Set(sectionStudents.map((s) => s.id));

    for (const record of records) {
      if (!sectionStudentIds.has(record.studentId)) {
        throw new BadRequestException(
          `Student ${record.studentId} is not in this section`,
        );
      }
    }

    // Delete existing records for this session and create new ones
    await this.prisma.attendanceRecord.deleteMany({
      where: { attendanceSessionId: sessionId },
    });

    // Map status
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'OD', 'ML'];

    await this.prisma.attendanceRecord.createMany({
      data: records.map((r) => ({
        attendanceSessionId: sessionId,
        studentId: r.studentId,
        status: validStatuses.includes(r.status) ? (r.status as any) : 'ABSENT',
        remarks: r.remarks,
      })),
    });

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
    if (session.courseOffering.facultyId !== faculty.id)
      throw new ForbiddenException('Not your session');

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

      const summary = courseOfferings.map((co) => {
        const totalSessions = co.attendanceSessions.length;
        const attended = records.filter(
          (r) =>
            r.attendanceSession.courseOfferingId === co.id &&
            r.status === 'PRESENT',
        ).length;
        return {
          courseOfferingId: co.id,
          subjectCode: co.subject.code,
          subjectTitle: co.subject.title,
          totalSessions,
          attended,
          percentage:
            totalSessions > 0
              ? Math.round((attended / totalSessions) * 100)
              : 0,
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
          include: {
            student: { include: { user: { select: { name: true } } } },
          },
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
          include: {
            student: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ── Admin: Reset attendance for a session (delete all records) ──
  async resetSessionAttendance(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const deleted = await this.prisma.attendanceRecord.deleteMany({
      where: { attendanceSessionId: sessionId },
    });

    // Reopen the session so faculty can re-mark
    await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE', isLocked: false },
    });

    return {
      message: "Reset " + deleted.count + " attendance records. Session is now active again.",
      deletedCount: deleted.count,
    };
  }

  // ── Admin: Delete a session entirely ──
  async deleteSession(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    // Delete records first
    await this.prisma.attendanceRecord.deleteMany({
      where: { attendanceSessionId: sessionId },
    });

    await this.prisma.attendanceSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Session and all attendance records deleted.' };
  }

  // ── Admin: Bulk reset all attendance for a section (fresh start) ──
  async resetSectionAttendance(sectionId: string) {
    // Find all sessions for this section's course offerings
    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        courseOffering: { sectionId },
      },
      select: { id: true },
    });

    if (sessions.length === 0) {
      return { message: 'No attendance sessions found for this section.', deletedSessions: 0, deletedRecords: 0 };
    }

    const sessionIds = sessions.map((s) => s.id);

    // Delete all records
    const deletedRecords = await this.prisma.attendanceRecord.deleteMany({
      where: { attendanceSessionId: { in: sessionIds } },
    });

    // Delete all sessions
    const deletedSessions = await this.prisma.attendanceSession.deleteMany({
      where: { id: { in: sessionIds } },
    });

    return {
      message: "Reset complete. Deleted " + deletedSessions.count + " sessions and " + deletedRecords.count + " records.",
      deletedSessions: deletedSessions.count,
      deletedRecords: deletedRecords.count,
    };
  }
}

