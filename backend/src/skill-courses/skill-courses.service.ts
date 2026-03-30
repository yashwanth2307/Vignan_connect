import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillCoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(data: {
    title: string;
    description: string;
    tags: string;
    thumbnail?: string;
    createdById: string;
  }) {
    return this.prisma.skillCourse.create({ data });
  }

  async findAll() {
    return this.prisma.skillCourse.findMany({
      include: {
        createdBy: { select: { name: true, role: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.skillCourse.findUnique({
      where: { id },
      include: {
        modules: {
          include: { lessons: { orderBy: { orderIndex: 'asc' } } },
          orderBy: { orderIndex: 'asc' },
        },
        createdBy: { select: { name: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async createModule(
    courseId: string,
    data: { title: string; orderIndex: number },
  ) {
    return this.prisma.skillModule.create({
      data: { ...data, courseId },
    });
  }

  async createLesson(
    moduleId: string,
    data: {
      title: string;
      content: string;
      videoUrl?: string;
      orderIndex: number;
    },
  ) {
    return this.prisma.skillLesson.create({
      data: { ...data, moduleId },
    });
  }

  async enroll(courseId: string, userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile required');

    return this.prisma.skillEnrollment.upsert({
      where: { courseId_studentId: { courseId, studentId: student.id } },
      update: {},
      create: { courseId, studentId: student.id },
    });
  }
}
