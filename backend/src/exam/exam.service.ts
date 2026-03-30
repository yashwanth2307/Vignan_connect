import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  // ── Semesters ──
  async listSemesters(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    return this.prisma.semester.findMany({
      where,
      include: { regulation: true, department: true },
      orderBy: [{ departmentId: 'asc' }, { number: 'asc' }],
    });
  }

  // ── Create Exam Session ──
  async createExamSession(data: {
    subjectId: string;
    date: string;
    slot: string;
    semesterId: string;
  }) {
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

    const courseOfferings = await this.prisma.courseOffering.findMany({
      where: {
        subjectId: examSession.subjectId,
        semesterId: examSession.semesterId,
      },
      include: { section: { include: { students: true } } },
    });

    const students = courseOfferings.flatMap((co) => co.section.students);
    const scripts: any[] = [];

    for (const student of students) {
      const existing = await this.prisma.answerScript.findFirst({
        where: { examSessionId, studentId: student.id },
      });
      if (!existing) {
        const barcode = `AS-${uuidv4().substring(0, 8).toUpperCase()}`;
        const script = await this.prisma.answerScript.create({
          data: { examSessionId, studentId: student.id, barcodeValue: barcode },
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

    if (scripts.length === 0)
      throw new BadRequestException('No scripts to distribute');

    const examSession = await this.prisma.examSession.findUnique({
      where: { id: examSessionId },
    });

    const faculty = await this.prisma.faculty.findMany({
      include: {
        courseOfferings: { where: { subjectId: examSession!.subjectId } },
      },
    });

    if (faculty.length === 0)
      throw new BadRequestException('No faculty available for evaluation');

    const tasks: any[] = [];
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      let assignedFaculty = faculty[i % faculty.length];
      const studentSection = script.student.sectionId;
      const alternativeFaculty = faculty.find(
        (f) => !f.courseOfferings.some((co) => co.sectionId === studentSection),
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

  // ── Submit individual marks ──
  async submitMarks(data: {
    studentId: string;
    subjectId: string;
    semesterId: string;
    mid1?: number;
    mid2?: number;
    external?: number;
    internal?: number;
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

  // ── Bulk Upload Marks (Faculty) ──
  async bulkUploadMarks(
    entries: Array<{
      studentId: string;
      subjectId: string;
      semesterId: string;
      mid1?: number;
      mid2?: number;
      external?: number;
      internal?: number;
    }>,
  ) {
    let created = 0,
      updated = 0,
      failed = 0;
    const errors: any[] = [];

    for (const entry of entries) {
      try {
        await this.prisma.marks.upsert({
          where: {
            studentId_subjectId_semesterId: {
              studentId: entry.studentId,
              subjectId: entry.subjectId,
              semesterId: entry.semesterId,
            },
          },
          update: {
            mid1: entry.mid1,
            mid2: entry.mid2,
            external: entry.external,
            internal: entry.internal,
            status: 'SUBMITTED',
          },
          create: {
            studentId: entry.studentId,
            subjectId: entry.subjectId,
            semesterId: entry.semesterId,
            mid1: entry.mid1,
            mid2: entry.mid2,
            external: entry.external,
            internal: entry.internal,
            status: 'SUBMITTED',
          },
        });
        created++;
      } catch (e: any) {
        failed++;
        errors.push({ studentId: entry.studentId, error: e.message });
      }
    }
    return { total: entries.length, created, failed, errors };
  }

  // ── Hall Ticket Generation (Exam Cell) ──
  async generateHallTickets(semesterId: string, sectionId?: string) {
    const where: any = {};
    if (sectionId) where.sectionId = sectionId;

    // Find all students in this semester
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
      include: { department: true },
    });
    if (!semester) throw new NotFoundException('Semester not found');

    const students = await this.prisma.student.findMany({
      where: {
        currentSemester: semester.number,
        departmentId: semester.departmentId,
        ...(sectionId ? { sectionId } : {}),
      },
      include: { user: true, section: true, department: true },
    });

    let generated = 0;
    const tickets: any[] = [];

    for (const student of students) {
      const existing = await this.prisma.hallTicket.findFirst({
        where: { studentId: student.id, semesterId },
      });
      if (!existing) {
        const ticket = await this.prisma.hallTicket.create({
          data: {
            studentId: student.id,
            semesterId,
            fileUrl: `/hall-tickets/${student.rollNo}-sem${semester.number}.pdf`,
          },
        });
        tickets.push(ticket);
        generated++;
      }
    }

    return {
      message: `Generated ${generated} hall tickets for Semester ${semester.number}`,
      generated,
      total: students.length,
    };
  }

  // ── Get Hall Tickets (Student) ──
  async getStudentHallTickets(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) return [];
    return this.prisma.hallTicket.findMany({
      where: { studentId: student.id },
      include: { semester: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Verify & Lock Marks ──
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
        student: {
          include: { user: { select: { name: true } }, section: true },
        },
        subject: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Download Marks Report (CSV format data) ──
  async getMarksReport(filters: {
    semesterId?: string;
    sectionId?: string;
    departmentId?: string;
    batchStartYear?: number;
    batchEndYear?: number;
  }) {
    const where: any = {};
    if (filters.semesterId) where.semesterId = filters.semesterId;

    const studentWhere: any = {};
    if (filters.sectionId) studentWhere.sectionId = filters.sectionId;
    if (filters.departmentId) studentWhere.departmentId = filters.departmentId;
    if (filters.batchStartYear)
      studentWhere.batchStartYear = filters.batchStartYear;
    if (filters.batchEndYear) studentWhere.batchEndYear = filters.batchEndYear;

    if (Object.keys(studentWhere).length > 0) where.student = studentWhere;

    const marks = await this.prisma.marks.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            section: true,
            department: true,
          },
        },
        subject: true,
        semester: true,
      },
      orderBy: [{ student: { rollNo: 'asc' } }, { subject: { code: 'asc' } }],
    });

    return marks.map((m) => ({
      rollNo: m.student.rollNo,
      name: m.student.user.name,
      section: m.student.section.name,
      department: m.student.department.code,
      subject: m.subject.code,
      subjectTitle: m.subject.title,
      semester: m.semester.number,
      mid1: m.mid1,
      mid2: m.mid2,
      internal: m.internal,
      external: m.external,
      final: m.final,
      status: m.status,
    }));
  }

  // ── Attendance Report (CSV format data) ──
  async getAttendanceReport(filters: {
    semesterId?: string;
    sectionId?: string;
    departmentId?: string;
    batchStartYear?: number;
    batchEndYear?: number;
  }) {
    const studentWhere: any = {};
    if (filters.sectionId) studentWhere.sectionId = filters.sectionId;
    if (filters.departmentId) studentWhere.departmentId = filters.departmentId;
    if (filters.batchStartYear)
      studentWhere.batchStartYear = filters.batchStartYear;
    if (filters.batchEndYear) studentWhere.batchEndYear = filters.batchEndYear;

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        user: { select: { name: true } },
        section: true,
        department: true,
        attendanceRecords: {
          include: {
            attendanceSession: {
              include: {
                courseOffering: { include: { subject: true, semester: true } },
              },
            },
          },
        },
      },
      orderBy: { rollNo: 'asc' },
    });

    const report: any[] = [];
    for (const student of students) {
      // Group by subject
      const subjectMap = new Map<
        string,
        {
          total: number;
          present: number;
          absent: number;
          late: number;
          od: number;
          ml: number;
        }
      >();

      for (const rec of (student as any).attendanceRecords) {
        const sub = rec.attendanceSession?.courseOffering?.subject;
        const sem = rec.attendanceSession?.courseOffering?.semester;
        if (!sub) continue;
        if (filters.semesterId && sem?.id !== filters.semesterId) continue;

        const key = sub.code;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            od: 0,
            ml: 0,
          });
        }
        const entry = subjectMap.get(key)!;
        entry.total++;
        if (rec.status === 'PRESENT') entry.present++;
        else if (rec.status === 'ABSENT') entry.absent++;
        else if (rec.status === 'LATE') entry.late++;
        else if (rec.status === 'OD') entry.od++;
        else if (rec.status === 'ML') entry.ml++;
      }

      const s = student as any;
      for (const [subCode, data] of subjectMap.entries()) {
        const percentage =
          data.total > 0
            ? Math.round(
                ((data.present + data.late + data.od) / data.total) * 100,
              )
            : 0;
        report.push({
          rollNo: s.rollNo,
          name: s.user?.name,
          section: s.section?.name,
          department: s.department?.code,
          subject: subCode,
          totalClasses: data.total,
          present: data.present,
          absent: data.absent,
          late: data.late,
          od: data.od,
          ml: data.ml,
          percentage,
        });
      }
    }

    return report;
  }
}
