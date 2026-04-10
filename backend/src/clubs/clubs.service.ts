import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async createClub(data: {
    name: string;
    description?: string;
    category?: string;
    coordinatorId: string;
  }) {
    const existing = await this.prisma.club.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException('Club already exists');
    return this.prisma.club.create({ data });
  }

  async findAll() {
    return this.prisma.club.findMany({
      include: {
        coordinator: { select: { name: true, email: true } },
        members: { select: { student: { select: { userId: true } } } },
        _count: { select: { members: true, events: true } },
      },
    });
  }

  async getClub(id: string) {
    return this.prisma.club.findUnique({
      where: { id },
      include: {
        coordinator: true,
        members: { include: { student: { include: { user: true } } } },
        events: true,
      },
    });
  }

  async joinClub(clubId: string, studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    const existing = await this.prisma.clubMember.findUnique({
      where: { clubId_studentId: { clubId, studentId: student.id } },
    });
    if (existing) throw new ConflictException('Already a member of this club');
    return this.prisma.clubMember.create({
      data: {
        clubId,
        studentId: student.id,
        joinedAt: new Date(),
        role: 'MEMBER',
      },
    });
  }

  async leaveClub(clubId: string, studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.prisma.clubMember.delete({
      where: { clubId_studentId: { clubId, studentId: student.id } },
    });
  }

  async deleteClub(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundException('Club not found');
    // Delete members and events first to avoid FK errors
    await this.prisma.clubMember.deleteMany({ where: { clubId: id } });
    await this.prisma.clubEvent.deleteMany({ where: { clubId: id } });
    return this.prisma.club.delete({ where: { id } });
  }

  async createEvent(
    clubId: string,
    data: { title: string; description?: string; date: string; venue?: string },
  ) {
    return this.prisma.clubEvent.create({
      data: {
        clubId,
        title: data.title,
        description: data.description,
        eventDate: new Date(data.date),
        venue: data.venue,
      },
    });
  }
}
