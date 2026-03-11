import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post('students')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Register a new student (password defaults to student@{rollNo})' })
    createStudent(@Body() dto: CreateStudentDto) {
        return this.usersService.createStudent(dto);
    }

    @Post('students/bulk')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Bulk upload students from parsed Excel data' })
    bulkCreateStudents(@Body() body: {
        students: Array<{
            name: string;
            email: string;
            phone?: string;
            rollNo: string;
            sectionId: string;
            departmentId: string;
            regulationId: string;
            batchStartYear: number;
            batchEndYear: number;
        }>
    }) {
        return this.usersService.bulkCreateStudents(body.students);
    }

    @Post('faculty')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Register a new faculty member (password defaults to faculty@{empId})' })
    createFaculty(@Body() dto: CreateFacultyDto) {
        return this.usersService.createFaculty(dto);
    }

    @Post('staff')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Register Exam Cell or TPO staff (password defaults to staff@{emailPrefix})' })
    createStaff(@Body() dto: { name: string; email: string; phone?: string; role: 'EXAM_CELL' | 'TPO'; password?: string }) {
        return this.usersService.createStaff(dto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all users, optionally filter by role' })
    findAll(@Query('role') role?: UserRole) {
        return this.usersService.findAll(role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id/toggle-active')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Toggle user active status' })
    toggleActive(@Param('id') id: string) {
        return this.usersService.toggleActive(id);
    }

    @Get('students/section/:sectionId')
    @Roles(UserRole.ADMIN, UserRole.FACULTY)
    @ApiOperation({ summary: 'Get students by section' })
    getStudentsBySection(@Param('sectionId') sectionId: string) {
        return this.usersService.getStudentsBySection(sectionId);
    }
}
