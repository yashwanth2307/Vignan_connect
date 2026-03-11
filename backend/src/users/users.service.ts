import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
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
    ) { }

    async createStudent(dto: CreateStudentDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already registered');

        const existingRoll = await this.prisma.student.findUnique({ where: { rollNo: dto.rollNo } });
        if (existingRoll) throw new ConflictException('Roll number already exists');

        // Default password: student@{rollNo}
        const password = dto.password || `student@${dto.rollNo}`;
        const passwordHash = await this.authService.hashPassword(password);

        const result = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
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
                    },
                },
            },
            include: { student: { include: { section: true, department: true } } },
        });

        // Fire n8n webhook
        await this.webhooks.studentCreated(result);

        return result;
    }

    async createFaculty(dto: CreateFacultyDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already registered');

        const existingEmp = await this.prisma.faculty.findUnique({ where: { empId: dto.empId } });
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
        await this.webhooks.facultyCreated(result);

        return result;
    }

    // ── Bulk Upload Students from Excel Data ──
    async bulkCreateStudents(students: Array<{
        name: string;
        email: string;
        phone?: string;
        rollNo: string;
        sectionId: string;
        departmentId: string;
        regulationId: string;
        batchStartYear: number;
        batchEndYear: number;
    }>) {
        const results: any[] = [];
        const errors: any[] = [];

        for (const student of students) {
            try {
                const existing = await this.prisma.user.findUnique({ where: { email: student.email } });
                if (existing) {
                    errors.push({ rollNo: student.rollNo, error: 'Email already exists' });
                    continue;
                }

                const existingRoll = await this.prisma.student.findUnique({ where: { rollNo: student.rollNo } });
                if (existingRoll) {
                    errors.push({ rollNo: student.rollNo, error: 'Roll number already exists' });
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
                    include: { student: { include: { section: true, department: true } } },
                });

                results.push({ rollNo: student.rollNo, name: student.name, status: 'created' });
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
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
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
                id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
            },
        });
    }

    async findAll(role?: UserRole) {
        const where = role ? { role } : {};
        return this.prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
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
                id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
                student: { include: { section: true, department: true, regulation: true } },
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

    async getStudentsBySection(sectionId: string) {
        return this.prisma.student.findMany({
            where: { sectionId },
            include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } } },
            orderBy: { rollNo: 'asc' },
        });
    }
}
