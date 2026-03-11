import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhooks/webhook.service';
import { CreatePlacementDriveDto, UpdateApplicationStatusDto } from './dto/placement.dto';

@Injectable()
export class PlacementsService {
    constructor(
        private prisma: PrismaService,
        private webhooks: WebhookService,
    ) { }

    // ── Drives ──
    async createDrive(userId: string, dto: CreatePlacementDriveDto) {
        const drive = await this.prisma.placementDrive.create({
            data: {
                companyName: dto.companyName,
                role: dto.role,
                description: dto.description,
                packageLPA: dto.packageLPA,
                eligibleBranches: dto.eligibleBranches,
                minCGPA: dto.minCGPA,
                maxBacklogs: dto.maxBacklogs ?? 0,
                driveDate: new Date(dto.driveDate),
                deadline: new Date(dto.deadline),
                location: dto.location,
                createdById: userId,
            },
        });

        // Fire n8n webhook
        await this.webhooks.placementDriveCreated(drive);

        return drive;
    }

    async findAllDrives(activeOnly = true) {
        const where = activeOnly ? { isActive: true } : {};
        return this.prisma.placementDrive.findMany({
            where,
            include: {
                _count: { select: { applications: true } },
            },
            orderBy: { driveDate: 'desc' },
        });
    }

    async findDriveById(id: string) {
        const drive = await this.prisma.placementDrive.findUnique({
            where: { id },
            include: {
                applications: {
                    include: {
                        student: {
                            include: {
                                user: { select: { name: true, email: true, phone: true } },
                                department: { select: { name: true, code: true } },
                                section: { select: { name: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!drive) throw new NotFoundException('Placement drive not found');
        return drive;
    }

    async toggleDriveActive(id: string) {
        const drive = await this.prisma.placementDrive.findUnique({ where: { id } });
        if (!drive) throw new NotFoundException('Placement drive not found');
        return this.prisma.placementDrive.update({
            where: { id },
            data: { isActive: !drive.isActive },
        });
    }

    // ── Applications ──
    async applyToDrive(driveId: string, userId: string, resume?: string) {
        // Get student record
        const student = await this.prisma.student.findUnique({
            where: { userId },
            include: { department: true },
        });
        if (!student) throw new ForbiddenException('Only students can apply');

        // Check if drive exists and is active
        const drive = await this.prisma.placementDrive.findUnique({ where: { id: driveId } });
        if (!drive || !drive.isActive) throw new NotFoundException('Drive not found or closed');

        // Check deadline
        if (new Date() > drive.deadline) throw new ForbiddenException('Application deadline has passed');

        // Check branch eligibility
        const eligibleBranches = drive.eligibleBranches.split(',').map(b => b.trim().toUpperCase());
        if (!eligibleBranches.includes(student.department.code.toUpperCase()) && !eligibleBranches.includes('ALL')) {
            throw new ForbiddenException('Your branch is not eligible for this drive');
        }

        // Check if already applied
        const existing = await this.prisma.placementApplication.findUnique({
            where: { driveId_studentId: { driveId, studentId: student.id } },
        });
        if (existing) throw new ConflictException('Already applied to this drive');

        return this.prisma.placementApplication.create({
            data: {
                driveId,
                studentId: student.id,
                resume,
            },
        });
    }

    async updateApplicationStatus(applicationId: string, dto: UpdateApplicationStatusDto) {
        const app = await this.prisma.placementApplication.findUnique({ where: { id: applicationId } });
        if (!app) throw new NotFoundException('Application not found');

        return this.prisma.placementApplication.update({
            where: { id: applicationId },
            data: { status: dto.status },
        });
    }

    async getMyApplications(userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) return [];

        return this.prisma.placementApplication.findMany({
            where: { studentId: student.id },
            include: {
                drive: {
                    select: {
                        companyName: true, role: true, packageLPA: true,
                        driveDate: true, location: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getDriveStats() {
        const [totalDrives, activeDrives, totalApplications, selectedCount] = await Promise.all([
            this.prisma.placementDrive.count(),
            this.prisma.placementDrive.count({ where: { isActive: true } }),
            this.prisma.placementApplication.count(),
            this.prisma.placementApplication.count({ where: { status: 'SELECTED' } }),
        ]);

        return { totalDrives, activeDrives, totalApplications, selectedCount };
    }
}
