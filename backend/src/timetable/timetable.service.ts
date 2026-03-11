import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTimetableSlotDto) {
        const existing = await this.prisma.timetableSlot.findFirst({
            where: { sectionId: dto.sectionId, dayOfWeek: dto.dayOfWeek as DayOfWeek, hourIndex: dto.hourIndex },
        });
        if (existing) throw new ConflictException('Slot already occupied for this section/day/hour');
        return this.prisma.timetableSlot.create({
            data: {
                sectionId: dto.sectionId,
                dayOfWeek: dto.dayOfWeek as DayOfWeek,
                hourIndex: dto.hourIndex,
                courseOfferingId: dto.courseOfferingId,
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
            include: {
                courseOffering: {
                    include: { subject: true, faculty: { include: { user: { select: { name: true } } } } },
                },
                section: true,
            },
        });
    }

    async findBySection(sectionId: string) {
        return this.prisma.timetableSlot.findMany({
            where: { sectionId },
            include: {
                courseOffering: {
                    include: { subject: true, faculty: { include: { user: { select: { name: true } } } } },
                },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }],
        });
    }

    async findByFacultyUserId(userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new NotFoundException('Faculty not found');
        return this.prisma.timetableSlot.findMany({
            where: { courseOffering: { facultyId: faculty.id } },
            include: {
                courseOffering: { include: { subject: true, section: { include: { department: true } } } },
                section: true,
            },
            orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }],
        });
    }

    async findTodayBySection(sectionId: string) {
        const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const today = days[new Date().getDay() - 1] || 'MONDAY';
        return this.prisma.timetableSlot.findMany({
            where: { sectionId, dayOfWeek: today },
            include: {
                courseOffering: {
                    include: { subject: true, faculty: { include: { user: { select: { name: true } } } } },
                },
            },
            orderBy: { hourIndex: 'asc' },
        });
    }

    async findTodayByFacultyUserId(userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new NotFoundException('Faculty not found');
        const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const today = days[new Date().getDay() - 1] || 'MONDAY';
        return this.prisma.timetableSlot.findMany({
            where: { courseOffering: { facultyId: faculty.id }, dayOfWeek: today },
            include: {
                courseOffering: { include: { subject: true, section: { include: { department: true } } } },
                section: true,
            },
            orderBy: { hourIndex: 'asc' },
        });
    }

    async remove(id: string) {
        return this.prisma.timetableSlot.delete({ where: { id } });
    }
}
