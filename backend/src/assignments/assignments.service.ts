import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  // Faculty: Create assignment
  async create(data: {
    courseOfferingId: string;
    title: string;
    description?: string;
    dueAt: string;
    createdById: string;
  }) {
    return this.prisma.assignment.create({
      data: {
        courseOfferingId: data.courseOfferingId,
        title: data.title,
        description: data.description,
        dueAt: new Date(data.dueAt),
        createdById: data.createdById,
      },
      include: { courseOffering: { include: { subject: true, section: true } } },
    });
  }

  // List assignments by course offering
  async findByCourseOffering(courseOfferingId: string) {
    return this.prisma.assignment.findMany({
      where: { courseOfferingId },
      include: {
        submissions: {
          include: { student: { include: { user: { select: { name: true, email: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Student: Get my assignments for current semester/section
  async getStudentAssignments(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException('Not a student');

    const assignments = await this.prisma.assignment.findMany({
      where: {
        courseOffering: {
          sectionId: student.sectionId,
          subject: { semesterNumber: student.currentSemester },
        },
      },
      include: {
        courseOffering: { include: { subject: true } },
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    return assignments.map((a) => {
      const mySubmission = a.submissions[0] || null;
      return {
        ...a,
        mySubmission,
      };
    });
  }

  // Student: Submit or Resubmit assignment (PDF format)
  async submitAssignment(
    assignmentId: string,
    fileUrl: string,
    userId: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException('Not a student');

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const existing = await this.prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
    });

    if (existing) {
      // If submission exists, update file and set status to RESUBMITTED
      return this.prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          submittedAt: new Date(),
          isFlagged: false,
          status: 'RESUBMITTED',
        },
      });
    }

    return this.prisma.submission.create({
      data: {
        assignmentId,
        studentId: student.id,
        fileUrl,
        status: 'SUBMITTED',
      },
    });
  }

  // Faculty: Flag submission for resubmission with remarks
  async flagSubmission(
    submissionId: string,
    remarks: string,
    userId: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        isFlagged: true,
        remarks,
        status: 'RESUBMISSION_REQUESTED',
      },
    });
  }

  // Faculty: Grade submission
  async gradeSubmission(
    submissionId: string,
    grade: string,
    userId: string,
  ) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade,
        status: 'GRADED',
        isFlagged: false,
      },
    });
  }
}
