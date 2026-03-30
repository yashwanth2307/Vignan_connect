import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private service: SubjectsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create subject' })
  create(@Body() dto: CreateSubjectDto) {
    return this.service.create(dto);
  }

  @Post('bulk-upload')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk upload subjects' })
  bulkCreate(@Body() body: { subjects: any[] }) {
    return this.service.bulkCreate(body.subjects);
  }

  @Get()
  @ApiOperation({ summary: 'List subjects' })
  findAll(
    @Query('departmentId') deptId?: string,
    @Query('regulationId') regId?: string,
  ) {
    return this.service.findAll(deptId, regId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
