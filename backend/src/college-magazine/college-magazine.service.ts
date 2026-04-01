import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollegeMagazineService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string; fileUrl: string; thumbnailUrl?: string; createdById: string }) {
    return this.prisma.collegeMagazine.create({
      data: {
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl,
        createdById: data.createdById,
      },
    });
  }

  async findAll() {
    return this.prisma.collegeMagazine.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.collegeMagazine.delete({ where: { id } });
  }
}
