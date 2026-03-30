import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { StartSessionDto } from './dto/start-session.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Get students by section, semester, department' })
  getStudentsByFilters(
    @Query('sectionId') sectionId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.service.getStudentsByFilters(
      sectionId,
      semesterId,
      departmentId,
    );
  }

  @Post('sessions/start')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Start manual attendance session' })
  async startSession(@Body() dto: StartSessionDto, @Req() req: any) {
    return this.service.startSession(
      dto.courseOfferingId,
      dto.hourIndex,
      req.user.sub,
    );
  }

  @Post('sessions/:sessionId/stop')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Stop attendance session' })
  async stopSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.service.stopSession(sessionId, req.user.sub);
  }

  @Post('sessions/:sessionId/mark')
  @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mark attendance for students (manual bulk select)',
  })
  async markAttendance(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      records?: {
        studentId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' | 'ML';
        remarks?: string;
      }[];
      studentIds?: string[];
    },
    @Req() req: any,
  ) {
    let records = body.records;
    if (!records && body.studentIds) {
      records = body.studentIds.map((id) => ({
        studentId: id,
        status: 'PRESENT' as const,
      }));
    }

    return this.service.markAttendance(sessionId, records || [], req.user.sub);
  }

  @Get('sessions/:sessionId/records')
  @ApiOperation({ summary: 'Get attendance records for session' })
  getRecords(@Param('sessionId') sessionId: string) {
    return this.service.getSessionRecords(sessionId);
  }

  @Get('sessions/active/:courseOfferingId')
  @ApiOperation({ summary: 'Get active session for course offering' })
  getActiveSession(@Param('courseOfferingId') courseOfferingId: string) {
    return this.service.getActiveSession(courseOfferingId);
  }

  @Get('sessions/list/:courseOfferingId')
  @ApiOperation({ summary: 'Get all sessions for course offering' })
  getSessions(@Param('courseOfferingId') courseOfferingId: string) {
    return this.service.getSessions(courseOfferingId);
  }

  @Get('student/my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my attendance summary' })
  getMyAttendance(@Req() req: any, @Query('courseOfferingId') coId?: string) {
    return this.service.getStudentAttendance(req.user.sub, coId);
  }

  // ── Admin: Reset attendance records for a session ──
  @Post('sessions/:sessionId/reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reset attendance for a session (deletes records, reopens session)' })
  resetSession(@Param('sessionId') sessionId: string) {
    return this.service.resetSessionAttendance(sessionId);
  }

  // ── Admin: Delete a session entirely ──
  @Delete('sessions/:sessionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete an attendance session and all its records' })
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.service.deleteSession(sessionId);
  }

  // ── Admin: Reset all attendance for an entire section ──
  @Post('section/:sectionId/reset')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Reset all attendance for a section (fresh start)' })
  resetSectionAttendance(@Param('sectionId') sectionId: string) {
    return this.service.resetSectionAttendance(sectionId);
  }
}
