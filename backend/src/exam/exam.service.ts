import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExamService {
    constructor(private prisma: PrismaService) { }

    // ── Create Exam Session ──
    async createExamSession(data: { subjectId: string; date: string; slot: string; semesterId: string }) {
        return this.prisma.examSession.create({
            data: {
                subjectId: data.subjectId,
                date: new Date(data.date),
                slot: data.slot,
                semesterId: data.semesterId,
            },
            include: { subject: true, semester: true },
        });
    }

    async listExamSessions(semesterId?: string) {
        const where = semesterId ? { semesterId } : {};
        return this.prisma.examSession.findMany({
            where,
            include: { subject: true, semester: true },
            orderBy: { date: 'asc' },
        });
    }

    // ── Generate Barcodes for Answer Scripts ──
    async generateAnswerScripts(examSessionId: string) {
        const examSession = await this.prisma.examSession.findUnique({
            where: { id: examSessionId },
            include: { subject: true, semester: true },
        });
        if (!examSession) throw new NotFoundException('Exam session not found');

        // Find students enrolled in this subject's course offerings
        const courseOfferings = await this.prisma.courseOffering.findMany({
            where: { subjectId: examSession.subjectId, semesterId: examSession.semesterId },
            include: { section: { include: { students: true } } },
        });

        const students = courseOfferings.flatMap(co => co.section.students);
        const scripts: any[] = [];

        for (const student of students) {
            const existing = await this.prisma.answerScript.findFirst({
                where: { examSessionId, studentId: student.id },
            });
            if (!existing) {
                const barcode = `AS-${uuidv4().substring(0, 8).toUpperCase()}`;
                const script = await this.prisma.answerScript.create({
                    data: {
                        examSessionId,
                        studentId: student.id,
                        barcodeValue: barcode,
                    },
                });
                scripts.push(script);
            }
        }

        return { generated: scripts.length, scripts };
    }

    // ── Distribute Scripts to Faculty for Evaluation ──
    async distributeScripts(examSessionId: string) {
        const scripts = await this.prisma.answerScript.findMany({
            where: { examSessionId, evaluationTask: null },
            include: { student: true },
        });

        if (scripts.length === 0) throw new BadRequestException('No scripts to distribute');

        // Get faculty who teach this subject
        const examSession = await this.prisma.examSession.findUnique({
            where: { id: examSessionId },
        });

        const faculty = await this.prisma.faculty.findMany({
            include: { courseOfferings: { where: { subjectId: examSession!.subjectId } } },
        });

        if (faculty.length === 0) throw new BadRequestException('No faculty available for evaluation');

        const tasks: any[] = [];
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            // Round-robin assignment, avoiding faculty from student's own section when possible
            let assignedFaculty = faculty[i % faculty.length];

            // Try to avoid assigning to faculty who teaches student's section
            const studentSection = script.student.sectionId;
            const alternativeFaculty = faculty.find(f =>
                !f.courseOfferings.some(co => co.sectionId === studentSection)
            );
            if (alternativeFaculty) assignedFaculty = alternativeFaculty;

            const task = await this.prisma.evaluationTask.create({
                data: {
                    answerScriptId: script.id,
                    assignedFacultyId: assignedFaculty.id,
                    status: 'ASSIGNED',
                },
            });
            tasks.push(task);
        }

        return { distributed: tasks.length, tasks };
    }

    // ── Faculty: Get My Evaluation Tasks ──
    async getMyEvaluationTasks(userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) return [];
        return this.prisma.evaluationTask.findMany({
            where: { assignedFacultyId: faculty.id },
            include: {
                answerScript: {
                    include: {
                        examSession: { include: { subject: true } },
                        student: { include: { user: { select: { name: true } } } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ── Submit Marks ──
    async submitMarks(data: {
        studentId: string; subjectId: string; semesterId: string;
        mid1?: number; mid2?: number; external?: number; internal?: number;
    }) {
        return this.prisma.marks.upsert({
            where: {
                studentId_subjectId_semesterId: {
                    studentId: data.studentId,
                    subjectId: data.subjectId,
                    semesterId: data.semesterId,
                },
            },
            update: {
                mid1: data.mid1,
                mid2: data.mid2,
                external: data.external,
                internal: data.internal,
                status: 'SUBMITTED',
            },
            create: {
                studentId: data.studentId,
                subjectId: data.subjectId,
                semesterId: data.semesterId,
                mid1: data.mid1,
                mid2: data.mid2,
                external: data.external,
                internal: data.internal,
                status: 'SUBMITTED',
            },
        });
    }

    // ── Exam Cell: Verify & Lock Marks ──
    async verifyMarks(marksId: string, examCellUserId: string) {
        return this.prisma.marks.update({
            where: { id: marksId },
            data: { status: 'VERIFIED', verifiedByExamCellId: examCellUserId },
        });
    }

    async lockMarks(marksId: string) {
        return this.prisma.marks.update({
            where: { id: marksId },
            data: { status: 'LOCKED' },
        });
    }

    async releaseResults(semesterId: string) {
        return this.prisma.marks.updateMany({
            where: { semesterId, status: 'LOCKED' },
            data: { status: 'RELEASED' },
        });
    }

    // ── Student: Get My Marks ──
    async getStudentMarks(userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) return [];
        return this.prisma.marks.findMany({
            where: { studentId: student.id, status: 'RELEASED' },
            include: { subject: true, semester: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAllMarks(semesterId?: string, status?: string) {
        const where: any = {};
        if (semesterId) where.semesterId = semesterId;
        if (status) where.status = status;
        return this.prisma.marks.findMany({
            where,
            include: {
                student: { include: { user: { select: { name: true } } } },
                subject: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
