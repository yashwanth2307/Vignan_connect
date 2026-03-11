import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SkillCoursesService } from './skill-courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Skill Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('skill-courses')
export class SkillCoursesController {
    constructor(private readonly skillCoursesService: SkillCoursesService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.FACULTY)
    @ApiOperation({ summary: 'Create a new skill course' })
    createCourse(@Body() dto: any, @Request() req: any) {
        return this.skillCoursesService.createCourse({ ...dto, createdById: req.user.sub });
    }

    @Get()
    @ApiOperation({ summary: 'List all skill courses' })
    findAll() {
        return this.skillCoursesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get course details with modules and lessons' })
    findOne(@Param('id') id: string) {
        return this.skillCoursesService.findOne(id);
    }

    @Post(':id/modules')
    @Roles(UserRole.ADMIN, UserRole.FACULTY)
    @ApiOperation({ summary: 'Add a module to a course' })
    addModule(@Param('id') courseId: string, @Body() dto: any) {
        return this.skillCoursesService.createModule(courseId, dto);
    }

    @Post('modules/:moduleId/lessons')
    @Roles(UserRole.ADMIN, UserRole.FACULTY)
    @ApiOperation({ summary: 'Add a lesson to a module' })
    addLesson(@Param('moduleId') moduleId: string, @Body() dto: any) {
        return this.skillCoursesService.createLesson(moduleId, dto);
    }

    @Post(':id/enroll')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Enroll in a course' })
    enroll(@Param('id') courseId: string, @Request() req: any) {
        return this.skillCoursesService.enroll(courseId, req.user.sub);
    }
}
