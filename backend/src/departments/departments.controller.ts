import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private service: DepartmentsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create department' })
    create(@Body() dto: CreateDepartmentDto) { return this.service.create(dto); }

    @Get()
    @ApiOperation({ summary: 'List all departments' })
    findAll() { return this.service.findAll(); }

    @Get(':id')
    @ApiOperation({ summary: 'Get department by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update department' })
    update(@Param('id') id: string, @Body() dto: Partial<CreateDepartmentDto>) { return this.service.update(id, dto); }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete department' })
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
