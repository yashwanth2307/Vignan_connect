import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicCalendarService {
  constructor(private prisma: PrismaService) {}

  async createEvent(data: {
    title: string;
    eventType: string;
    startDate: string;
    endDate?: string;
    academicYear: string;
    semester?: number;
    departmentId?: string;
    description?: string;
    createdById?: string;
  }) {
    return this.prisma.academicCalendar.create({
      data: {
        title: data.title,
        eventType: data.eventType,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        academicYear: data.academicYear,
        semester: data.semester,
        departmentId: data.departmentId,
        description: data.description,
        createdById: data.createdById,
      },
    });
  }

  async getEvents(filters?: {
    academicYear?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters?.academicYear) where.academicYear = filters.academicYear;
    if (filters?.departmentId) {
      where.OR = [
        { departmentId: filters.departmentId },
        { departmentId: null },
      ];
    }

    if (filters?.startDate && filters?.endDate) {
      where.startDate = {
        gte: new Date(filters.startDate),
      };
      where.endDate = {
        lte: new Date(filters.endDate),
      };
    }

    return this.prisma.academicCalendar.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async togglePublish(id: string) {
    const event = await this.prisma.academicCalendar.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.prisma.academicCalendar.update({
      where: { id },
      data: { isPublished: !event.isPublished },
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.academicCalendar.delete({ where: { id } });
  }
}
