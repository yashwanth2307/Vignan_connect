import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollegeGalleryService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title?: string; imageUrl: string; category?: string; createdById: string }) {
    return this.prisma.collegeGallery.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        category: data.category || 'General',
        createdById: data.createdById,
      },
    });
  }

  async findAll() {
    return this.prisma.collegeGallery.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.collegeGallery.delete({ where: { id } });
  }
}
