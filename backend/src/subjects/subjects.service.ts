import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateSubjectDto) {
        const existing = await this.prisma.subject.findUnique({ where: { code: dto.code } });
        if (existing) throw new ConflictException('Subject code already exists');
        return this.prisma.subject.create({ data: dto, include: { regulation: true, department: true } });
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
        return this.prisma.subject.update({ where: { id }, data: dto, include: { regulation: true, department: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.subject.delete({ where: { id } });
    }
}
