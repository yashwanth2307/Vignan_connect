import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateDepartmentDto) {
        // Check for existing name
        const existingName = await this.prisma.department.findUnique({
            where: { name: dto.name },
        });
        if (existingName) throw new ConflictException('Department name already exists');

        // Check for existing code
        const existingCode = await this.prisma.department.findUnique({
            where: { code: dto.code },
        });
        if (existingCode) throw new ConflictException('Department code already exists');

        return this.prisma.department.create({
            data: {
                name: dto.name,
                code: dto.code,
            },
        });
    }

    async findAll() {
        return this.prisma.department.findMany({
            include: { _count: { select: { sections: true, students: true, faculty: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const dept = await this.prisma.department.findUnique({
            where: { id },
            include: { sections: true, _count: { select: { students: true, faculty: true } } },
        });
        if (!dept) throw new NotFoundException('Department not found');
        return dept;
    }

    async update(id: string, dto: Partial<CreateDepartmentDto>) {
        await this.findOne(id);
        return this.prisma.department.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.department.delete({ where: { id } });
    }
}
