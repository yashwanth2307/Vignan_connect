import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            cb(null, './uploads/magazines');
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  create(
    @UploadedFiles() files: { file?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
    @Body() body: { title: string; description?: string; fileUrl?: string; thumbnailUrl?: string },
    @Req() req: any,
  ) {
    const file = files?.file?.[0];
    const thumbnail = files?.thumbnail?.[0];

    const finalFileUrl = file ? `/uploads/magazines/${file.filename}` : body.fileUrl;
    const finalThumbnailUrl = thumbnail ? `/uploads/magazines/${thumbnail.filename}` : body.thumbnailUrl;

    if (!finalFileUrl) {
      throw new BadRequestException('A magazine file or fileUrl must be provided');
    }

    return this.magazineService.create({
      ...body,
      fileUrl: finalFileUrl,
      thumbnailUrl: finalThumbnailUrl,
      createdById: req.user.sub,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.magazineService.remove(id);
  }
}
