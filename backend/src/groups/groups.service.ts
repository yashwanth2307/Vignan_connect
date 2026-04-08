import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private webhooks: WebhookService,
  ) {}

  // ── Group CRUD ──

  async createGroup(
    dto: {
      name: string;
      description?: string;
      courseOfferingId?: string;
    },
    userId: string,
  ) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty)
      throw new ForbiddenException('Only faculty can create groups');

    return this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        facultyId: faculty.id,
        courseOfferingId: dto.courseOfferingId,
      },
      include: {
        faculty: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { members: true } },
      },
    });
  }

  async getMyGroups(userId: string, role: string) {
    if (role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId },
      });
      if (!student) throw new NotFoundException('Student profile not found');

      return this.prisma.group.findMany({
        where: {
          isActive: true,
          members: { some: { studentId: student.id } },
        },
        include: {
          faculty: { include: { user: { select: { name: true } } } },
          courseOffering: { include: { subject: true } },
          _count: {
            select: { members: true, messages: true, assignments: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // Faculty / HOD
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty profile not found');

    return this.prisma.group.findMany({
      where: { facultyId: faculty.id },
      include: {
        courseOffering: { include: { subject: true, section: true } },
        _count: {
          select: { members: true, messages: true, assignments: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getGroupById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        faculty: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        courseOffering: { include: { subject: true, section: true } },
        members: {
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        _count: { select: { messages: true, assignments: true } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async updateGroup(
    groupId: string,
    dto: { name?: string; description?: string; isActive?: boolean },
    userId: string,
  ) {
    await this.verifyGroupOwner(groupId, userId);
    return this.prisma.group.update({
      where: { id: groupId },
      data: dto,
    });
  }

  async deleteGroup(groupId: string, userId: string) {
    await this.verifyGroupOwner(groupId, userId);
    return this.prisma.group.delete({ where: { id: groupId } });
  }

  // ── Members ──

  async addMembers(groupId: string, studentIds: string[], userId: string) {
    await this.verifyGroupOwner(groupId, userId);

    const results: any[] = [];
    const errors: any[] = [];

    for (const studentId of studentIds) {
      try {
        const student = await this.prisma.student.findUnique({
          where: { id: studentId },
        });
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }
        await this.prisma.groupMember.create({
          data: { groupId, studentId },
        });
        results.push({ studentId, status: 'added' });
      } catch (err: any) {
        if (err.code === 'P2002') {
          errors.push({ studentId, error: 'Already a member' });
        } else {
          errors.push({ studentId, error: err.message });
        }
      }
    }

    return { added: results.length, failed: errors.length, results, errors };
  }

  async addSectionToGroup(groupId: string, sectionId: string, userId: string) {
    await this.verifyGroupOwner(groupId, userId);

    const students = await this.prisma.student.findMany({
      where: { sectionId },
      select: { id: true },
    });

    const studentIds = students.map((s) => s.id);
    return this.addMembers(groupId, studentIds, userId);
  }

  async removeMember(groupId: string, studentId: string, userId: string) {
    await this.verifyGroupOwner(groupId, userId);
    return this.prisma.groupMember.delete({
      where: { groupId_studentId: { groupId, studentId } },
    });
  }

  // ── Messages ──

  async sendMessage(groupId: string, content: string, userId: string) {
    // Verify user is a member or the group's faculty
    await this.verifyGroupAccess(groupId, userId);

    return this.prisma.groupMessage.create({
      data: { groupId, senderId: userId, content },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getMessages(
    groupId: string,
    userId: string,
    cursor?: string,
    limit = 50,
  ) {
    await this.verifyGroupAccess(groupId, userId);

    return this.prisma.groupMessage.findMany({
      where: { groupId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  // ── Assignments ──

  async createAssignment(
    groupId: string,
    dto: {
      title: string;
      description: string;
      dueAt: string;
      maxPoints?: number;
    },
    userId: string,
  ) {
    await this.verifyGroupOwner(groupId, userId);

    const assignment = await this.prisma.groupAssignment.create({
      data: {
        groupId,
        title: dto.title,
        description: dto.description,
        dueAt: new Date(dto.dueAt),
        maxPoints: dto.maxPoints || 10,
      },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    // Get group + faculty name for notification
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { faculty: { include: { user: { select: { name: true } } } } },
    });
    // Fire-and-forget notification
    this.webhooks.assignmentPosted(
      assignment, group, group?.faculty?.user?.name || 'Faculty',
    ).catch(e => console.error('Assignment notification error:', e));

    return assignment;
  }

  async getGroupAssignments(groupId: string, userId: string) {
    await this.verifyGroupAccess(groupId, userId);

    return this.prisma.groupAssignment.findMany({
      where: { groupId },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignmentDetail(assignmentId: string, userId: string) {
    const assignment = await this.prisma.groupAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        group: {
          include: {
            faculty: true,
            _count: { select: { members: true } },
          },
        },
        submissions: {
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.verifyGroupAccess(assignment.groupId, userId);
    return assignment;
  }

  // ── Submissions ──

  async submitAssignment(
    assignmentId: string,
    dto: {
      content: string;
      fileUrl?: string;
    },
    userId: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new ForbiddenException('Only students can submit');

    const assignment = await this.prisma.groupAssignment.findUnique({
      where: { id: assignmentId },
      include: { group: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Check if student is a group member
    const isMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_studentId: {
          groupId: assignment.groupId,
          studentId: student.id,
        },
      },
    });
    if (!isMember)
      throw new ForbiddenException('You are not a member of this group');

    // Check due date
    if (new Date() > assignment.dueAt) {
      throw new BadRequestException(
        'Assignment submission deadline has passed',
      );
    }

    // Create or update submission
    const existing = await this.prisma.groupSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId, studentId: student.id },
      },
    });

    if (existing) {
      // Update existing submission
      return this.prisma.groupSubmission.update({
        where: { id: existing.id },
        data: {
          content: dto.content,
          fileUrl: dto.fileUrl,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          similarityScore: null,
          similarToId: null,
        },
      });
    }

    return this.prisma.groupSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        content: dto.content,
        fileUrl: dto.fileUrl,
      },
    });
  }

  async getMySubmission(assignmentId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.groupSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId, studentId: student.id },
      },
      include: {
        assignment: true,
      },
    });
  }

  // ── AI Plagiarism Detection ──

  async runPlagiarismCheck(assignmentId: string, userId: string) {
    const assignment = await this.prisma.groupAssignment.findUnique({
      where: { id: assignmentId },
      include: { group: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Verify faculty ownership
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty || assignment.group.facultyId !== faculty.id) {
      throw new ForbiddenException(
        'Only the group faculty can run plagiarism checks',
      );
    }

    const submissions = await this.prisma.groupSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    });

    if (submissions.length < 2) {
      return {
        message: 'Need at least 2 submissions to run plagiarism check',
        results: [],
      };
    }

    const results: Array<{
      submissionId: string;
      studentName: string;
      similarityScore: number;
      similarToId: string | null;
      similarToName: string | null;
      status: string;
    }> = [];

    // Compare each submission against all others using Jaccard n-gram similarity
    for (let i = 0; i < submissions.length; i++) {
      let maxSimilarity = 0;
      let mostSimilarId: string | null = null;
      let mostSimilarName: string | null = null;

      for (let j = 0; j < submissions.length; j++) {
        if (i === j) continue;

        const similarity = this.calculateSimilarity(
          submissions[i].content,
          submissions[j].content,
        );

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilarId = submissions[j].id;
          mostSimilarName = submissions[j].student.user.name;
        }
      }

      const similarityPercent = Math.round(maxSimilarity * 100);
      const status = similarityPercent >= 70 ? 'FLAGGED' : 'REVIEWED';

      // Update the submission with plagiarism results
      await this.prisma.groupSubmission.update({
        where: { id: submissions[i].id },
        data: {
          similarityScore: similarityPercent,
          similarToId: similarityPercent >= 40 ? mostSimilarId : null,
          status,
        },
      });

      results.push({
        submissionId: submissions[i].id,
        studentName: submissions[i].student.user.name,
        similarityScore: similarityPercent,
        similarToId: similarityPercent >= 40 ? mostSimilarId : null,
        similarToName: similarityPercent >= 40 ? mostSimilarName : null,
        status,
      });
    }

    return {
      totalSubmissions: submissions.length,
      flagged: results.filter((r) => r.status === 'FLAGGED').length,
      clean: results.filter((r) => r.status === 'REVIEWED').length,
      results: results.sort((a, b) => b.similarityScore - a.similarityScore),
    };
  }

  /**
   * AI Plagiarism Detection — Jaccard n-gram similarity
   * Breaks text into overlapping n-grams (shingles) and computes
   * the Jaccard coefficient: |A ∩ B| / |A ∪ B|
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const getNGrams = (text: string, n: number = 3): Set<string> => {
      const words = text.split(' ');
      const ngrams = new Set<string>();
      for (let i = 0; i <= words.length - n; i++) {
        ngrams.add(words.slice(i, i + n).join(' '));
      }
      return ngrams;
    };

    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    if (!norm1 || !norm2) return 0;

    // Use multiple n-gram sizes for better accuracy
    let totalSimilarity = 0;

    for (const n of [2, 3, 4]) {
      const grams1 = getNGrams(norm1, n);
      const grams2 = getNGrams(norm2, n);

      if (grams1.size === 0 || grams2.size === 0) continue;

      let intersection = 0;
      for (const gram of grams1) {
        if (grams2.has(gram)) intersection++;
      }

      const union = grams1.size + grams2.size - intersection;
      totalSimilarity += union > 0 ? intersection / union : 0;
    }

    // Also compare character-level trigrams for shorter texts
    const charGrams1 = new Set<string>();
    const charGrams2 = new Set<string>();
    for (let i = 0; i <= norm1.length - 3; i++)
      charGrams1.add(norm1.slice(i, i + 3));
    for (let i = 0; i <= norm2.length - 3; i++)
      charGrams2.add(norm2.slice(i, i + 3));

    let charIntersection = 0;
    for (const gram of charGrams1) {
      if (charGrams2.has(gram)) charIntersection++;
    }
    const charUnion = charGrams1.size + charGrams2.size - charIntersection;
    const charSimilarity = charUnion > 0 ? charIntersection / charUnion : 0;

    // Weighted average: word n-grams (60%) + char trigrams (40%)
    return (totalSimilarity / 3) * 0.6 + charSimilarity * 0.4;
  }

  // ── Faculty Review & V-Points ──

  async reviewSubmission(
    submissionId: string,
    dto: {
      status: 'VERIFIED' | 'FLAGGED';
      vPointsAwarded?: number;
      facultyRemarks?: string;
    },
    userId: string,
  ) {
    const submission = await this.prisma.groupSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { group: true } },
        student: true,
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty || submission.assignment.group.facultyId !== faculty.id) {
      throw new ForbiddenException(
        'Only the group faculty can review submissions',
      );
    }

    const vPoints =
      dto.status === 'VERIFIED'
        ? dto.vPointsAwarded || submission.assignment.maxPoints
        : 0;

    // Update submission
    const updated = await this.prisma.groupSubmission.update({
      where: { id: submissionId },
      data: {
        status: dto.status,
        vPointsAwarded: vPoints,
        facultyRemarks: dto.facultyRemarks,
        reviewedAt: new Date(),
      },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Award V-Points to student's points ledger if verified
    if (dto.status === 'VERIFIED' && vPoints > 0) {
      await this.prisma.pointsLedger.create({
        data: {
          studentId: submission.studentId,
          points: vPoints,
          reason: `Assignment verified: ${submission.assignment.title}`,
        },
      });
    }

    // Fire-and-forget review notification
    this.webhooks.assignmentReviewed({
      studentName: updated.student.user.name,
      studentEmail: updated.student.user.email,
      assignmentTitle: submission.assignment.title,
      status: dto.status,
      vPointsAwarded: vPoints,
      facultyRemarks: dto.facultyRemarks,
    }).catch(e => console.error('Review notification error:', e));

    return updated;
  }

  async getSubmissionStats(assignmentId: string) {
    const submissions = await this.prisma.groupSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    });

    const totalMembers = await this.prisma.groupAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        group: { include: { _count: { select: { members: true } } } },
      },
    });

    return {
      totalMembers: totalMembers?.group._count.members || 0,
      submitted: submissions.length,
      pending: (totalMembers?.group._count.members || 0) - submissions.length,
      verified: submissions.filter((s) => s.status === 'VERIFIED').length,
      flagged: submissions.filter((s) => s.status === 'FLAGGED').length,
      reviewed: submissions.filter((s) => s.status === 'REVIEWED').length,
      totalVPointsAwarded: submissions.reduce(
        (sum, s) => sum + s.vPointsAwarded,
        0,
      ),
    };
  }

  // ── Helpers ──

  private async verifyGroupOwner(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Group not found');

    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty || group.facultyId !== faculty.id) {
      throw new ForbiddenException(
        'Only the group owner can perform this action',
      );
    }

    return group;
  }

  private async verifyGroupAccess(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { faculty: true },
    });
    if (!group) throw new NotFoundException('Group not found');

    // Faculty who owns the group
    if (group.faculty.userId === userId) return group;

    // Student who is a member
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (student) {
      const membership = await this.prisma.groupMember.findUnique({
        where: { groupId_studentId: { groupId, studentId: student.id } },
      });
      if (membership) return group;
    }

    // Admin can access any group
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'ADMIN') return group;

    throw new ForbiddenException('You do not have access to this group');
  }
}
