import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CourseOfferingsService } from './course-offerings.service';
import { CreateCourseOfferingDto } from './dto/create-course-offering.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Course Offerings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('course-offerings')
export class CourseOfferingsController {
    constructor(private service: CourseOfferingsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create course offering' })
    create(@Body() dto: CreateCourseOfferingDto) { return this.service.create(dto); }

    @Get()
    @ApiOperation({ summary: 'List course offerings' })
    findAll(@Query('facultyId') facultyId?: string, @Query('sectionId') sectionId?: string) {
        return this.service.findAll(facultyId, sectionId);
    }

    @Get('my')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Get my course offerings (faculty)' })
    getMyOfferings(@Req() req: any) {
        return this.service.findByFacultyUserId(req.user.sub);
    }

    @Get(':id')
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: Partial<CreateCourseOfferingDto>) { return this.service.update(id, dto); }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
