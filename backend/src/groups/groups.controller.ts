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
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private service: GroupsService) {}

  // ── Group CRUD ──

  @Post()
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Create a new group' })
  create(
    @Body()
    dto: { name: string; description?: string; courseOfferingId?: string },
    @Req() req: any,
  ) {
    return this.service.createGroup(dto, req.user.sub);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my groups (faculty: owned, student: joined)' })
  getMyGroups(@Req() req: any) {
    return this.service.getMyGroups(req.user.sub, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details with members' })
  getGroup(@Param('id') id: string) {
    return this.service.getGroupById(id);
  }

  @Put(':id')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Update group' })
  updateGroup(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    return this.service.updateGroup(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Delete group' })
  deleteGroup(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteGroup(id, req.user.sub);
  }

  // ── Members ──

  @Post(':id/members')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Add students to group' })
  addMembers(
    @Param('id') id: string,
    @Body() body: { studentIds: string[] },
    @Req() req: any,
  ) {
    return this.service.addMembers(id, body.studentIds, req.user.sub);
  }

  @Post(':id/members/section/:sectionId')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Add entire section to group' })
  addSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Req() req: any,
  ) {
    return this.service.addSectionToGroup(id, sectionId, req.user.sub);
  }

  @Delete(':id/members/:studentId')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Remove student from group' })
  removeMember(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Req() req: any,
  ) {
    return this.service.removeMember(id, studentId, req.user.sub);
  }

  // ── Messages ──

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in the group' })
  sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: any,
  ) {
    return this.service.sendMessage(id, body.content, req.user.sub);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get group messages (paginated)' })
  getMessages(
    @Param('id') id: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Req() req: any,
  ) {
    return this.service.getMessages(
      id,
      req.user.sub,
      cursor,
      limit ? parseInt(limit) : 50,
    );
  }

  // ── Assignments ──

  @Post(':id/assignments')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Create assignment in group' })
  createAssignment(
    @Param('id') id: string,
    @Body()
    dto: {
      title: string;
      description: string;
      dueAt: string;
      maxPoints?: number;
    },
    @Req() req: any,
  ) {
    return this.service.createAssignment(id, dto, req.user.sub);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get all assignments in group' })
  getAssignments(@Param('id') id: string, @Req() req: any) {
    return this.service.getGroupAssignments(id, req.user.sub);
  }

  @Get('assignments/:assignmentId')
  @ApiOperation({ summary: 'Get assignment details with submissions' })
  getAssignmentDetail(
    @Param('assignmentId') assignmentId: string,
    @Req() req: any,
  ) {
    return this.service.getAssignmentDetail(assignmentId, req.user.sub);
  }

  @Get('assignments/:assignmentId/stats')
  @ApiOperation({ summary: 'Get assignment submission stats' })
  getAssignmentStats(@Param('assignmentId') assignmentId: string) {
    return this.service.getSubmissionStats(assignmentId);
  }

  // ── Submissions ──

  @Post('assignments/:assignmentId/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit assignment (student)' })
  submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: { content: string; fileUrl?: string },
    @Req() req: any,
  ) {
    return this.service.submitAssignment(assignmentId, dto, req.user.sub);
  }

  @Get('assignments/:assignmentId/my-submission')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my submission for an assignment' })
  getMySubmission(
    @Param('assignmentId') assignmentId: string,
    @Req() req: any,
  ) {
    return this.service.getMySubmission(assignmentId, req.user.sub);
  }

  // ── Plagiarism Check ──

  @Post('assignments/:assignmentId/plagiarism-check')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({ summary: 'Run AI plagiarism detection on all submissions' })
  runPlagiarismCheck(
    @Param('assignmentId') assignmentId: string,
    @Req() req: any,
  ) {
    return this.service.runPlagiarismCheck(assignmentId, req.user.sub);
  }

  // ── Review & V-Points ──

  @Post('submissions/:submissionId/review')
  @Roles(UserRole.FACULTY, UserRole.HOD)
  @ApiOperation({
    summary: 'Review submission — verify or flag, award V-Points',
  })
  reviewSubmission(
    @Param('submissionId') submissionId: string,
    @Body()
    dto: {
      status: 'VERIFIED' | 'FLAGGED';
      vPointsAwarded?: number;
      facultyRemarks?: string;
    },
    @Req() req: any,
  ) {
    return this.service.reviewSubmission(submissionId, dto, req.user.sub);
  }
}
