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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AcademicCalendarService } from './academic-calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Academic Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-calendar')
export class AcademicCalendarController {
  constructor(private readonly service: AcademicCalendarService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Create a new calendar event' })
  create(@Body() body: any, @Req() req: any) {
    return this.service.createEvent({ ...body, createdById: req.user.sub });
  }

  @Get()
  @ApiOperation({ summary: 'Get calendar events' })
  findAll(
    @Query('academicYear') academicYear?: string,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getEvents({
      academicYear,
      departmentId,
      startDate,
      endDate,
    });
  }

  @Put(':id/toggle-publish')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Toggle publish status of an event' })
  togglePublish(@Param('id') id: string) {
    return this.service.togglePublish(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Delete calendar event' })
  remove(@Param('id') id: string) {
    return this.service.deleteEvent(id);
  }
}
