import { Controller, Post, Get, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
    constructor(private service: AnnouncementsService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'HOD')
    @ApiOperation({ summary: 'Create announcement (Admin/HOD)' })
    async create(@Req() req: any, @Body() dto: CreateAnnouncementDto) {
        return this.service.create(req.user.sub, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all announcements for current user role' })
    async findAll(@Req() req: any, @Query('role') role?: string) {
        return this.service.findAll(role || req.user.role);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete/deactivate announcement' })
    async delete(@Param('id') id: string) {
        return this.service.delete(id);
    }
}
