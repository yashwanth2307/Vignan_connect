import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sections')
export class SectionsController {
    constructor(private service: SectionsService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create section' })
    create(@Body() dto: CreateSectionDto) { return this.service.create(dto); }

    @Get()
    @ApiOperation({ summary: 'List sections' })
    findAll(@Query('departmentId') departmentId?: string) { return this.service.findAll(departmentId); }

    @Get(':id')
    @ApiOperation({ summary: 'Get section by ID' })
    findOne(@Param('id') id: string) { return this.service.findOne(id); }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() dto: Partial<CreateSectionDto>) { return this.service.update(id, dto); }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) { return this.service.remove(id); }
}
