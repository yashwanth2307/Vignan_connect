import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CollegeMagazineService } from './college-magazine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('college-magazines')
export class CollegeMagazineController {
  constructor(private readonly magazineService: CollegeMagazineService) {}

  @Get()
  findAll() {
    return this.magazineService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  create(@Body() body: { title: string; description?: string; fileUrl: string; thumbnailUrl?: string }, @Req() req: any) {
    return this.magazineService.create({ ...body, createdById: req.user.sub });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.magazineService.remove(id);
  }
}
