import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { WebhookService } from '../webhooks/webhook.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private webhooks: WebhookService,
  ) {}

  async createStudent(dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const existingRoll = await this.prisma.student.findUnique({
      where: { rollNo: dto.rollNo },
    });
    if (existingRoll) throw new ConflictException('Roll number already exists');

    // Default password: student@{rollNo}
    const password = dto.password || `student@${dto.rollNo}`;
    const passwordHash = await this.authService.hashPassword(password);

    const result = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || dto.studentPhone,
        passwordHash,
        role: UserRole.STUDENT,
        student: {
          create: {
            rollNo: dto.rollNo,
            sectionId: dto.sectionId,
            departmentId: dto.departmentId,
            regulationId: dto.regulationId,
            batchStartYear: dto.batchStartYear,
            batchEndYear: dto.batchEndYear,
            currentYear: dto.currentYear || 1,
            currentSemester: dto.currentSemester || 1,
            // Personal
            studentPhone: dto.studentPhone || dto.phone,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            gender: dto.gender,
            bloodGroup: dto.bloodGroup,
            aadharNumber: dto.aadharNumber,
            admissionType: dto.admissionType || 'REGULAR',
            category: dto.category,
            religion: dto.religion,
            nationality: dto.nationality || 'Indian',
            // Father
            fatherName: dto.fatherName,
            fatherPhone: dto.fatherPhone,
            fatherOccupation: dto.fatherOccupation,
            fatherEmail: dto.fatherEmail,
            // Mother
            motherName: dto.motherName,
            motherPhone: dto.motherPhone,
            motherOccupation: dto.motherOccupation,
            motherEmail: dto.motherEmail,
            // Guardian
            guardianName: dto.guardianName,
            guardianPhone: dto.guardianPhone,
            guardianRelation: dto.guardianRelation,
            // Address
            presentAddress: dto.presentAddress,
            permanentAddress: dto.permanentAddress,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
          },
        },
      },
      include: { student: { include: { section: true, department: true } } },
    });

    // Fire n8n webhook
    await this.webhooks.studentCreated(result, password);

    return result;
  }

  async createFaculty(dto: CreateFacultyDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const existingEmp = await this.prisma.faculty.findUnique({
      where: { empId: dto.empId },
    });
    if (existingEmp) throw new ConflictException('Employee ID already exists');

    // Default password: faculty@{empId}
    const password = dto.password || `faculty@${dto.empId}`;
    const passwordHash = await this.authService.hashPassword(password);

    const result = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role || UserRole.FACULTY,
        faculty: {
          create: {
            empId: dto.empId,
            departmentId: dto.departmentId,
            dateOfJoin: new Date(dto.dateOfJoin),
          },
        },
      },
      include: { faculty: { include: { department: true } } },
    });

    // Fire n8n webhook
    await this.webhooks.facultyCreated(result, password);

    return result;
  }

  // ── Bulk Upload Faculty from Excel Data ──
  async bulkCreateFaculty(
    faculties: Array<{
      name: string;
      email: string;
      phone?: string;
      empId: string;
      departmentId: string;
      dateOfJoin: string;
      role?: UserRole;
    }>,
  ) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const faculty of faculties) {
      try {
        const existing = await this.prisma.user.findUnique({
          where: { email: faculty.email },
        });
        if (existing) {
          errors.push({ empId: faculty.empId, error: 'Email already exists' });
          continue;
        }

        const existingEmp = await this.prisma.faculty.findUnique({
          where: { empId: faculty.empId },
        });
        if (existingEmp) {
          errors.push({
            empId: faculty.empId,
            error: 'Employee ID already exists',
          });
          continue;
        }

        // Default password: faculty@{empId}
        const password = `faculty@${faculty.empId}`;
        const passwordHash = await this.authService.hashPassword(password);

        const result = await this.prisma.user.create({
          data: {
            name: faculty.name,
            email: faculty.email,
            phone: faculty.phone,
            passwordHash,
            role: faculty.role || UserRole.FACULTY,
            faculty: {
              create: {
                empId: faculty.empId,
                departmentId: faculty.departmentId,
                dateOfJoin: new Date(faculty.dateOfJoin),
              },
            },
          },
          include: { faculty: { include: { department: true } } },
        });

        // Fire n8n webhook for bulk too
        await this.webhooks.facultyCreated(result, password);

        results.push({
          empId: faculty.empId,
          name: faculty.name,
          status: 'created',
        });
      } catch (err: any) {
        errors.push({ empId: faculty.empId, error: err.message });
      }
    }

    return {
      totalProcessed: faculties.length,
      created: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  // ── Bulk Upload Students from Excel Data ──
  async bulkCreateStudents(
    students: Array<{
      name: string;
      email: string;
      phone?: string;
      rollNo: string;
      sectionId: string;
      departmentId: string;
      regulationId: string;
      batchStartYear: number;
      batchEndYear: number;
    }>,
  ) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const student of students) {
      try {
        const existing = await this.prisma.user.findUnique({
          where: { email: student.email },
        });
        if (existing) {
          errors.push({
            rollNo: student.rollNo,
            error: 'Email already exists',
          });
          continue;
        }

        const existingRoll = await this.prisma.student.findUnique({
          where: { rollNo: student.rollNo },
        });
        if (existingRoll) {
          errors.push({
            rollNo: student.rollNo,
            error: 'Roll number already exists',
          });
          continue;
        }

        // Password: student@{rollNo}
        const password = `student@${student.rollNo}`;
        const passwordHash = await this.authService.hashPassword(password);

        const result = await this.prisma.user.create({
          data: {
            name: student.name,
            email: student.email,
            phone: student.phone,
            passwordHash,
            role: UserRole.STUDENT,
            student: {
              create: {
                rollNo: student.rollNo,
                sectionId: student.sectionId,
                departmentId: student.departmentId,
                regulationId: student.regulationId,
                batchStartYear: student.batchStartYear,
                batchEndYear: student.batchEndYear,
              },
            },
          },
          include: {
            student: { include: { section: true, department: true } },
          },
        });

        // Fire n8n webhook for bulk too
        await this.webhooks.studentCreated(result, password);

        results.push({
          rollNo: student.rollNo,
          name: student.name,
          status: 'created',
        });
      } catch (err: any) {
        errors.push({ rollNo: student.rollNo, error: err.message });
      }
    }

    return {
      totalProcessed: students.length,
      created: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  // ── Create Staff (Exam Cell / TPO) ──
  async createStaff(dto: {
    name: string;
    email: string;
    phone?: string;
    role: 'EXAM_CELL' | 'TPO';
    password?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const allowedRoles: string[] = ['EXAM_CELL', 'TPO'];
    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException('Role must be EXAM_CELL or TPO');
    }

    const password = dto.password || `staff@${dto.email.split('@')[0]}`;
    const passwordHash = await this.authService.hashPassword(password);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role as UserRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: { include: { section: true, department: true } },
        faculty: { include: { department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          include: { section: true, department: true, regulation: true },
        },
        faculty: { include: { department: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }

  async updateUser(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    // Simple top-level update: name, email, phone
    const userUpdate: any = {};
    if (dto.name) userUpdate.name = dto.name;
    if (dto.email) userUpdate.email = dto.email;
    if (dto.phone) userUpdate.phone = dto.phone;

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: userUpdate,
      });
    }

    if (user.role === 'STUDENT' && dto.rollNo) {
        const student = await this.prisma.student.findUnique({ where: { userId: id } });
        if (student) {
            await this.prisma.student.update({
                where: { id: student.id },
                data: { rollNo: dto.rollNo }
            });
        }
    } else if (user.role === 'FACULTY' && dto.empId) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId: id } });
        if (faculty) {
            await this.prisma.faculty.update({
                where: { id: faculty.id },
                data: { empId: dto.empId }
            });
        }
    }

    return { message: 'User updated successfully' };
  }

  async getStudentsBySection(sectionId: string) {
    return this.prisma.student.findMany({
      where: { sectionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
      orderBy: { rollNo: 'asc' },
    });
  }

  async updateStudentPhoto(userId: string, photoUrl: string) {
    const student = await this.prisma.student.findUnique({ where: { userId } });
    if (!student) throw new NotFoundException('Student not found');
    return this.prisma.student.update({
      where: { id: student.id },
      data: { photoUrl },
    });
  }

  async getStudentProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        section: true,
        department: true,
        regulation: true,
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { student: true, faculty: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN')
      throw new BadRequestException('Cannot delete admin users');

    // Delete related records first (cascade)
    if (user.student) {
      const sId = user.student.id;
      // Delete student's attendance, marks, submissions, etc.
      try {
        await this.prisma.attendanceRecord.deleteMany({
          where: { studentId: sId },
        });
      } catch {}
      try {
        await this.prisma.marks.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.hallTicket.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.codeSubmission.deleteMany({
          where: { studentId: sId },
        });
      } catch {}
      try {
        await this.prisma.codeStreak.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.contestParticipation.deleteMany({
          where: { studentId: sId },
        });
      } catch {}
      try {
        await this.prisma.codeNote.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.clubMember.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.semesterPromotionRecord.deleteMany({
          where: { studentId: sId },
        });
      } catch {}
      try {
        await this.prisma.placementApplication.deleteMany({
          where: { studentId: sId },
        });
      } catch {}
      try {
        await this.prisma.groupMember.deleteMany({ where: { studentId: sId } });
      } catch {}
      try {
        await this.prisma.groupSubmission.deleteMany({
          where: { studentId: sId },
        });
      } catch {}

      await this.prisma.student.delete({ where: { id: sId } });
    }
    if (user.faculty) {
      await this.prisma.faculty.delete({ where: { id: user.faculty.id } });
    }

    // Delete any service requests
    try {
      await this.prisma.serviceRequest.deleteMany({
        where: { fromUserId: id },
      });
    } catch {}
    try {
      await this.prisma.serviceRequest.deleteMany({ where: { toUserId: id } });
    } catch {}
    try {
      await this.prisma.groupMessage.deleteMany({ where: { senderId: id } });
    } catch {}

    // Delete the user
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully', id };
  }
}
