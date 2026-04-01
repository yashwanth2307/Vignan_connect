import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CollegeGalleryService } from './college-gallery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('college-gallery')
export class CollegeGalleryController {
  constructor(private readonly galleryService: CollegeGalleryService) {}

  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  create(@Body() body: { title?: string; imageUrl: string; category?: string }, @Req() req: any) {
    return this.galleryService.create({ ...body, createdById: req.user.sub });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
