import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';

@Injectable()
export class SectionsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateSectionDto) {
        const existing = await this.prisma.section.findFirst({
            where: { name: dto.name, departmentId: dto.departmentId },
        });
        if (existing) throw new ConflictException('Section already exists in this department');
        return this.prisma.section.create({
            data: dto,
            include: { department: true },
        });
    }

    async findAll(departmentId?: string) {
        const where = departmentId ? { departmentId } : {};
        return this.prisma.section.findMany({
            where,
            include: { department: true, _count: { select: { students: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const section = await this.prisma.section.findUnique({
            where: { id },
            include: { department: true, _count: { select: { students: true } } },
        });
        if (!section) throw new NotFoundException('Section not found');
        return section;
    }

    async update(id: string, dto: Partial<CreateSectionDto>) {
        await this.findOne(id);
        return this.prisma.section.update({ where: { id }, data: dto, include: { department: true } });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.section.delete({ where: { id } });
    }
}
