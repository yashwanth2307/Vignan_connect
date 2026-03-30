import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SemesterPromotionService {
  constructor(private prisma: PrismaService) {}

  // ── Pre-flight check: who will be promoted ──
  async getPromotionCandidates(filters: {
    departmentId: string;
    batchStartYear: number;
    batchEndYear: number;
    currentSemester: number;
  }) {
    const students = await this.prisma.student.findMany({
      where: {
        departmentId: filters.departmentId,
        batchStartYear: filters.batchStartYear,
        batchEndYear: filters.batchEndYear,
        currentSemester: filters.currentSemester,
      },
      include: {
        user: { select: { name: true, email: true } },
        section: { select: { name: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    return {
      eligibleCount: students.length,
      fromSemester: filters.currentSemester,
      toSemester: filters.currentSemester + 1,
      students,
    };
  }

  // ── Execute Promotion (with transaction to ensure old records are untouched) ──
  async executePromotion(data: {
    departmentId: string;
    batchStartYear: number;
    batchEndYear: number;
    currentSemester: number;
    academicYear: string;
    notes?: string;
    userId: string;
  }) {
    // Find exact candidates
    const candidates = await this.prisma.student.findMany({
      where: {
        departmentId: data.departmentId,
        batchStartYear: data.batchStartYear,
        batchEndYear: data.batchEndYear,
        currentSemester: data.currentSemester,
      },
    });

    if (candidates.length === 0) {
      throw new BadRequestException(
        'No eligible students found for promotion.',
      );
    }

    const fromSem = data.currentSemester;
    const toSem = fromSem + 1;
    const fromYear = Math.ceil(fromSem / 2);
    const toYear = Math.ceil(toSem / 2);

    // Run transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Promotion Session
      const promotion = await tx.semesterPromotion.create({
        data: {
          departmentId: data.departmentId,
          batchStartYear: data.batchStartYear,
          batchEndYear: data.batchEndYear,
          fromSemester: fromSem,
          toSemester: toSem,
          fromYear: fromYear,
          toYear: toYear,
          academicYear: data.academicYear,
          promotedCount: candidates.length,
          promotedById: data.userId,
          notes: data.notes,
        },
      });

      // 2. Iterate and update each student + drop record
      const newRecords = candidates.map((c) => ({
        promotionId: promotion.id,
        studentId: c.id,
        fromSemester: fromSem,
        toSemester: toSem,
        fromYear: fromYear,
        toYear: toYear,
      }));

      await tx.semesterPromotionRecord.createMany({
        data: newRecords,
      });

      // 3. Update all eligible students currentSemester and Year
      await tx.student.updateMany({
        where: {
          departmentId: data.departmentId,
          batchStartYear: data.batchStartYear,
          batchEndYear: data.batchEndYear,
          currentSemester: fromSem,
        },
        data: {
          currentSemester: toSem,
          currentYear: toYear,
        },
      });

      if (toSem >= 9) {
        const userIds = candidates.map((c) => c.userId);
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: UserRole.ALUMNI }, // Promoted to Alumni
        });
      }

      return {
        message: `Successfully promoted ${candidates.length} students to semester ${toSem}`,
        promotionId: promotion.id,
      };
    });
  }

  // ── View Promotion History ──
  async getPromotionHistory(departmentId?: string) {
    return this.prisma.semesterPromotion.findMany({
      where: departmentId ? { departmentId } : {},
      orderBy: { promotedAt: 'desc' },
      include: {
        records: { select: { id: true } }, // just to know counts or further drills
      },
    });
  }
}
