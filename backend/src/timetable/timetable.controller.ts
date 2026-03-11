import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TimetableService } from './timetable.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
    constructor(private service: TimetableService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create timetable slot' })
    create(@Body() dto: CreateTimetableSlotDto) { return this.service.create(dto); }

    @Get('section/:sectionId')
    @ApiOperation({ summary: 'Get timetable by section' })
    findBySection(@Param('sectionId') sectionId: string) { return this.service.findBySection(sectionId); }

    @Get('faculty/my')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Get my timetable (faculty)' })
    getMyTimetable(@Req() req: any) { return this.service.findByFacultyUserId(req.user.sub); }

    @Get('today/section/:sectionId')
    @ApiOperation({ summary: 'Get today timetable for section' })
    findTodayBySection(@Param('sectionId') sectionId: string) { return this.service.findTodayBySection(sectionId); }

    @Get('today/faculty')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Get today timetable for logged-in faculty' })
    findTodayByFaculty(@Req() req: any) { return this.service.findTodayByFacultyUserId(req.user.sub); }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
