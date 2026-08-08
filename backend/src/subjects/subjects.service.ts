import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('Subject code already exists');
    return this.prisma.subject.create({
      data: {
        ...dto,
        weeklyHours: dto.weeklyHours || 3,
        subjectType: dto.subjectType || 'THEORY',
        isLab: dto.isLab || false,
        isElective: dto.isElective || false,
      },
      include: { regulation: true, department: true },
    });
  }

  // ── Bulk Upload Subjects ──
  async bulkCreate(subjects: any[]) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const sub of subjects) {
      try {
        const existing = await this.prisma.subject.findUnique({
          where: { code: sub.code },
        });
        if (existing) {
          errors.push({ code: sub.code, error: 'Subject code already exists' });
          continue;
        }

        const result = await this.prisma.subject.create({
          data: {
            code: sub.code,
            title: sub.title,
            credits: sub.credits,
            semesterNumber: sub.semesterNumber,
            weeklyHours: sub.weeklyHours || 3,
            subjectType: sub.subjectType || 'THEORY',
            isLab: sub.isLab || false,
            isElective: sub.isElective || false,
            regulationId: sub.regulationId,
            departmentId: sub.departmentId,
          },
        });
        results.push({ code: sub.code, status: 'created' });
      } catch (err: any) {
        errors.push({ code: sub.code, error: err.message });
      }
    }

    return {
      totalProcessed: subjects.length,
      created: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async findAll(departmentId?: string, regulationId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (regulationId) where.regulationId = regulationId;
    return this.prisma.subject.findMany({
      where,
      include: { regulation: true, department: true },
      orderBy: [{ semesterNumber: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: { regulation: true, department: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(id: string, dto: Partial<CreateSubjectDto>) {
    await this.findOne(id);
    return this.prisma.subject.update({
      where: { id },
      data: dto,
      include: { regulation: true, department: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Cascade delete all related records to avoid FK constraint errors
    // 1. Delete attendance records via attendance sessions via course offerings
    const courseOfferings = await this.prisma.courseOffering.findMany({
      where: { subjectId: id },
      select: { id: true },
    });
    const coIds = courseOfferings.map((co) => co.id);

    if (coIds.length > 0) {
      // Delete attendance records for these course offerings' sessions
      const sessions = await this.prisma.attendanceSession.findMany({
        where: { courseOfferingId: { in: coIds } },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);

      if (sessionIds.length > 0) {
        await this.prisma.attendanceRecord.deleteMany({
          where: { attendanceSessionId: { in: sessionIds } },
        });
        await this.prisma.attendanceSession.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      // Delete timetable slots, topics, materials, assignments (submissions first), quizzes (attempts first), online classes, groups
      await this.prisma.timetableSlot.deleteMany({ where: { courseOfferingId: { in: coIds } } });
      await this.prisma.topicsTaught.deleteMany({ where: { courseOfferingId: { in: coIds } } });
      await this.prisma.material.deleteMany({ where: { courseOfferingId: { in: coIds } } });

      // Assignments -> Submissions
      const assignments = await this.prisma.assignment.findMany({ where: { courseOfferingId: { in: coIds } }, select: { id: true } });
      if (assignments.length > 0) {
        await this.prisma.submission.deleteMany({ where: { assignmentId: { in: assignments.map(a => a.id) } } });
        await this.prisma.assignment.deleteMany({ where: { courseOfferingId: { in: coIds } } });
      }

      // Quizzes -> Attempts
      const quizzes = await this.prisma.quiz.findMany({ where: { courseOfferingId: { in: coIds } }, select: { id: true } });
      if (quizzes.length > 0) {
        await this.prisma.quizAttempt.deleteMany({ where: { quizId: { in: quizzes.map(q => q.id) } } });
        await this.prisma.quiz.deleteMany({ where: { courseOfferingId: { in: coIds } } });
      }

      await this.prisma.onlineClass.deleteMany({ where: { courseOfferingId: { in: coIds } } });

      // Groups -> Members, Messages, GroupAssignments -> GroupSubmissions
      const groups = await this.prisma.group.findMany({ where: { courseOfferingId: { in: coIds } }, select: { id: true } });
      if (groups.length > 0) {
        const gIds = groups.map(g => g.id);
        await this.prisma.groupMember.deleteMany({ where: { groupId: { in: gIds } } });
        await this.prisma.groupMessage.deleteMany({ where: { groupId: { in: gIds } } });
        const gAssignments = await this.prisma.groupAssignment.findMany({ where: { groupId: { in: gIds } }, select: { id: true } });
        if (gAssignments.length > 0) {
          await this.prisma.groupSubmission.deleteMany({ where: { assignmentId: { in: gAssignments.map(ga => ga.id) } } });
          await this.prisma.groupAssignment.deleteMany({ where: { groupId: { in: gIds } } });
        }
        await this.prisma.group.deleteMany({ where: { courseOfferingId: { in: coIds } } });
      }

      // Finally delete course offerings
      await this.prisma.courseOffering.deleteMany({ where: { subjectId: id } });
    }

    // 2. Delete exam sessions -> answer scripts -> evaluation tasks
    const examSessions = await this.prisma.examSession.findMany({
      where: { subjectId: id },
      select: { id: true },
    });
    if (examSessions.length > 0) {
      const esIds = examSessions.map((es) => es.id);
      const scripts = await this.prisma.answerScript.findMany({
        where: { examSessionId: { in: esIds } },
        select: { id: true },
      });
      if (scripts.length > 0) {
        await this.prisma.evaluationTask.deleteMany({ where: { answerScriptId: { in: scripts.map(s => s.id) } } });
        await this.prisma.answerScript.deleteMany({ where: { examSessionId: { in: esIds } } });
      }
      await this.prisma.examSession.deleteMany({ where: { subjectId: id } });
    }

    // 3. Delete marks
    await this.prisma.marks.deleteMany({ where: { subjectId: id } });

    // 4. Finally delete the subject
    return this.prisma.subject.delete({ where: { id } });
  }
}
