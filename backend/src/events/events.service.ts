import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhooks/webhook.service';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private webhooks: WebhookService,
    ) {}

    async createEvent(userId: string, data: any) {
        const event = await this.prisma.event.create({
            data: {
                title: data.title,
                description: data.description || null,
                imageUrl: data.imageUrl || null,
                formUrl: data.formUrl || null,
                isInternalRegistration: data.isInternalRegistration ?? false,
                startsAt: new Date(data.startsAt),
                expiresAt: new Date(data.expiresAt),
                status: 'PUBLISHED',
                createdById: userId,
            }
        });

        // Fire-and-forget notification
        this.webhooks.eventPublished(event)
            .catch(e => console.error('Event notification error:', e));

        return event;
    }

    async getEvents() {
        return this.prisma.event.findMany({
            orderBy: { startsAt: 'desc' },
            include: {
                _count: {
                    select: { registrations: true }
                }
            }
        });
    }

    async deleteEvent(id: string) {
        return this.prisma.event.delete({ where: { id } });
    }

    async registerForEvent(eventId: string, studentUserId: string) {
        const student = await this.prisma.student.findUnique({
            where: { userId: studentUserId }
        });
        if (!student) throw new NotFoundException('Student profile not found');
        return this.prisma.eventRegistration.create({
            data: { eventId, studentId: student.id }
        });
    }

    async getRegistrations(eventId: string) {
        return this.prisma.eventRegistration.findMany({
            where: { eventId },
            include: {
                student: {
                    include: { department: true }
                }
            }
        });
    }
}
