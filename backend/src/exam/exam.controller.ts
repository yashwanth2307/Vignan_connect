import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Exam')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam')
export class ExamController {
    constructor(private service: ExamService) { }

    @Post('sessions')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Create exam session' })
    createSession(@Body() data: { subjectId: string; date: string; slot: string; semesterId: string }) {
        return this.service.createExamSession(data);
    }

    @Get('sessions')
    @ApiOperation({ summary: 'List exam sessions' })
    listSessions(@Query('semesterId') semesterId?: string) {
        return this.service.listExamSessions(semesterId);
    }

    @Post('sessions/:id/generate-scripts')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Generate barcoded answer scripts' })
    generateScripts(@Param('id') id: string) {
        return this.service.generateAnswerScripts(id);
    }

    @Post('sessions/:id/distribute')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Distribute scripts for evaluation' })
    distribute(@Param('id') id: string) {
        return this.service.distributeScripts(id);
    }

    @Get('evaluations/my')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Get my evaluation tasks' })
    getMyEvaluations(@Req() req: any) {
        return this.service.getMyEvaluationTasks(req.user.sub);
    }

    @Post('marks')
    @Roles(UserRole.FACULTY, UserRole.HOD, UserRole.EXAM_CELL)
    @ApiOperation({ summary: 'Submit marks' })
    submitMarks(@Body() data: any) {
        return this.service.submitMarks(data);
    }

    @Patch('marks/:id/verify')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Verify marks' })
    verifyMarks(@Param('id') id: string, @Req() req: any) {
        return this.service.verifyMarks(id, req.user.sub);
    }

    @Patch('marks/:id/lock')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Lock marks' })
    lockMarks(@Param('id') id: string) {
        return this.service.lockMarks(id);
    }

    @Post('results/release/:semesterId')
    @Roles(UserRole.EXAM_CELL, UserRole.ADMIN)
    @ApiOperation({ summary: 'Release results for semester' })
    release(@Param('semesterId') semesterId: string) {
        return this.service.releaseResults(semesterId);
    }

    @Get('marks/student')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Get my marks (student)' })
    getMyMarks(@Req() req: any) {
        return this.service.getStudentMarks(req.user.sub);
    }

    @Get('marks')
    @Roles(UserRole.ADMIN, UserRole.EXAM_CELL)
    @ApiOperation({ summary: 'Get all marks' })
    getAllMarks(@Query('semesterId') semesterId?: string, @Query('status') status?: string) {
        return this.service.getAllMarks(semesterId, status);
    }
}
