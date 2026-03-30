import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';

@Injectable()
export class OnlineClassesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOnlineClassDto, userId: string) {
    // Verify the faculty owns this course offering (only if courseOfferingId is provided)
    if (dto.courseOfferingId) {
      const faculty = await this.prisma.faculty.findUnique({
        where: { userId },
      });
      if (faculty) {
        const co = await this.prisma.courseOffering.findFirst({
          where: { id: dto.courseOfferingId, facultyId: faculty.id },
        });
        if (!co)
          throw new ForbiddenException(
            'You are not assigned to this course offering',
          );
      }
    }

    const isApp = dto.platform === 'In-App';
    const roomName = isApp
      ? `vconnect-room-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      : null;
    const meetingLink = isApp ? `/live/${roomName}` : dto.meetingLink || '';

    return this.prisma.onlineClass.create({
      data: {
        title: dto.title,
        description: dto.description,
        meetingLink: meetingLink,
        roomName: roomName,
        platform: dto.platform || 'In-App',
        courseOfferingId: dto.courseOfferingId || undefined,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes || 60,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.onlineClass.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
  }

  // Find classes for a student (only their section)
  async findForStudent(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.onlineClass.findMany({
      where: {
        courseOffering: { sectionId: student.sectionId },
        scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // include last 24h
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
  }

  // Find classes for a faculty (only their offerings)
  async findForFaculty(userId: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty not found');

    return this.prisma.onlineClass.findMany({
      where: {
        courseOffering: { facultyId: faculty.id },
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
  }

  async findUpcoming() {
    return this.prisma.onlineClass.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.onlineClass.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });
    if (!cls) throw new NotFoundException('Online class not found');
    return cls;
  }

  async update(
    id: string,
    dto: Partial<CreateOnlineClassDto> & { status?: string },
  ) {
    await this.findOne(id);
    const data: any = {};
    if (dto.title) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.meetingLink) data.meetingLink = dto.meetingLink;
    if (dto.platform) data.platform = dto.platform;
    if (dto.courseOfferingId) data.courseOfferingId = dto.courseOfferingId;
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes) data.durationMinutes = dto.durationMinutes;
    if (dto.status) data.status = dto.status;
    return this.prisma.onlineClass.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.onlineClass.delete({ where: { id } });
  }
}
