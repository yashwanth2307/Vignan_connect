import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseOfferingDto } from './dto/create-course-offering.dto';

@Injectable()
export class CourseOfferingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseOfferingDto) {
    // Auto-resolve semesterId from subject if not provided
    let semesterId = dto.semesterId;
    if (!semesterId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: dto.subjectId },
        include: { department: true, regulation: true },
      });
      if (!subject) throw new NotFoundException('Subject not found');

      // Find section to get departmentId
      const section = await this.prisma.section.findUnique({
        where: { id: dto.sectionId },
      });
      if (!section) throw new NotFoundException('Section not found');

      // Find matching semester or auto-create lazily
      let semester = await this.prisma.semester.findFirst({
        where: {
          number: subject.semesterNumber,
          regulationId: subject.regulationId,
          departmentId: section.departmentId,
        },
      });

      if (!semester) {
        semester = await this.prisma.semester.create({
          data: {
            number: subject.semesterNumber,
            regulationId: subject.regulationId,
            departmentId: section.departmentId,
          },
        });
      }
      semesterId = semester.id;
    }

    const existing = await this.prisma.courseOffering.findFirst({
      where: { subjectId: dto.subjectId, sectionId: dto.sectionId, semesterId },
    });
    if (existing)
      throw new ConflictException(
        'Course offering already exists for this subject+section+semester',
      );
    return this.prisma.courseOffering.create({
      data: {
        subjectId: dto.subjectId,
        sectionId: dto.sectionId,
        facultyId: dto.facultyId,
        semesterId,
      },
      include: {
        subject: true,
        section: { include: { department: true } },
        faculty: { include: { user: true } },
        semester: true,
      },
    });
  }

  async findAll(facultyId?: string, sectionId?: string) {
    const where: any = {};
    if (facultyId) where.facultyId = facultyId;
    if (sectionId) where.sectionId = sectionId;
    return this.prisma.courseOffering.findMany({
      where,
      include: {
        subject: true,
        section: { include: { department: true } },
        faculty: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByFacultyUserId(userId: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty not found');
    return this.findAll(faculty.id);
  }

  async findOne(id: string) {
    const co = await this.prisma.courseOffering.findUnique({
      where: { id },
      include: {
        subject: true,
        section: { include: { department: true } },
        faculty: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        semester: true,
      },
    });
    if (!co) throw new NotFoundException('Course offering not found');
    return co;
  }

  async update(id: string, dto: Partial<CreateCourseOfferingDto>) {
    await this.findOne(id);
    return this.prisma.courseOffering.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Delete relational references to avoid foreign key constraint errors
    await this.prisma.$transaction([
      this.prisma.timetableSlot.deleteMany({ where: { courseOfferingId: id } }),
      this.prisma.attendanceRecord.deleteMany({ where: { attendanceSession: { courseOfferingId: id } } }),
      this.prisma.attendanceSession.deleteMany({ where: { courseOfferingId: id } }),
      // Remove the offering itself
      this.prisma.courseOffering.delete({ where: { id } }),
    ]);
    return { success: true, message: 'Course offering and associated data removed' };
  }
}
