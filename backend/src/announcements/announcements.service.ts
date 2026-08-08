import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhooks/webhook.service';
import { PushService } from '../push/push.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private webhooks: WebhookService,
    private pushService: PushService,
  ) {}

  async create(userId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole || null,
        departmentId: dto.departmentId || null,
        isImportant: dto.isImportant ?? false,
        createdById: userId,
      },
      include: { createdBy: { select: { name: true, role: true } } },
    });

    // Fire n8n webhook
    await this.webhooks.announcementCreated({
      ...announcement,
      createdBy: announcement.createdBy.name,
    });

    // Trigger in-app Web Push notification to target users
    try {
      await this.pushService.sendToAll(
        {
          title: `📢 ${announcement.title}`,
          body: announcement.message,
          url: '/dashboard/student',
        },
        announcement.targetRole,
      );
    } catch (e) {
      console.error('Failed to dispatch web push notification:', e);
    }

    return announcement;
  }

  async findAll(role?: string) {
    const where: any = { isActive: true };
    if (role) {
      where.OR = [
        { targetRole: null }, // Announcements for all
        { targetRole: role }, // Announcements for this role
      ];
    }
    return this.prisma.announcement.findMany({
      where,
      include: { createdBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
