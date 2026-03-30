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
    return this.prisma.subject.delete({ where: { id } });
  }
}
