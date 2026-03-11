import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CodeArenaService } from './code-arena.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Code Arena')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('code-arena')
export class CodeArenaController {
    constructor(private service: CodeArenaService) { }

    // ── Problems ──
    @Post('problems')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Create a coding problem' })
    createProblem(@Body() dto: any, @Req() req: any) {
        return this.service.createProblem(dto, req.user.sub);
    }

    @Get('problems')
    @ApiOperation({ summary: 'List all problems' })
    getProblems(@Query('difficulty') difficulty?: string, @Query('tag') tag?: string) {
        return this.service.getProblems(difficulty, tag);
    }

    @Get('problems/:id')
    @ApiOperation({ summary: 'Get problem details' })
    getProblem(@Param('id') id: string) {
        return this.service.getProblem(id);
    }

    @Put('problems/:id')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Update a problem' })
    updateProblem(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        return this.service.updateProblem(id, dto, req.user.sub);
    }

    @Get('problems/:id/submissions')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Get problem submissions (Faculty view)' })
    getProblemSubmissions(@Param('id') id: string) {
        return this.service.getProblemSubmissions(id);
    }

    // ── Submissions ──
    @Post('problems/:problemId/submit')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Submit code for a problem' })
    submitCode(@Param('problemId') problemId: string, @Body() dto: { language: string; code: string }, @Req() req: any) {
        return this.service.submitCode(problemId, dto, req.user.sub);
    }

    @Get('submissions/my')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Get my submissions' })
    getMySubmissions(@Req() req: any, @Query('problemId') problemId?: string) {
        return this.service.getMySubmissions(req.user.sub, problemId);
    }

    // ── Streaks ──
    @Get('streaks/my')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Get my coding streak' })
    getMyStreak(@Req() req: any) {
        return this.service.getMyStreak(req.user.sub);
    }

    // ── Notes ──
    @Post('notes')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Create a note' })
    createNote(@Body() dto: { title: string; content: string; tags?: string; isPublic?: boolean }, @Req() req: any) {
        return this.service.createNote(dto, req.user.sub);
    }

    @Get('notes/my')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Get my notes' })
    getMyNotes(@Req() req: any) {
        return this.service.getMyNotes(req.user.sub);
    }

    @Put('notes/:id')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Update a note' })
    updateNote(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        return this.service.updateNote(id, dto, req.user.sub);
    }

    @Delete('notes/:id')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Delete a note' })
    deleteNote(@Param('id') id: string, @Req() req: any) {
        return this.service.deleteNote(id, req.user.sub);
    }

    // ── Contests ──
    @Post('contests')
    @Roles(UserRole.FACULTY, UserRole.HOD)
    @ApiOperation({ summary: 'Create a weekly contest' })
    createContest(@Body() dto: any, @Req() req: any) {
        return this.service.createContest(dto, req.user.sub);
    }

    @Get('contests')
    @ApiOperation({ summary: 'List all contests' })
    getContests() {
        return this.service.getContests();
    }

    @Get('contests/:id')
    @ApiOperation({ summary: 'Get contest details' })
    getContest(@Param('id') id: string) {
        return this.service.getContest(id);
    }

    @Post('contests/:id/join')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Join a contest' })
    joinContest(@Param('id') id: string, @Req() req: any) {
        return this.service.joinContest(id, req.user.sub);
    }

    // ── Leaderboards ──
    @Get('leaderboard/section/:sectionId')
    @ApiOperation({ summary: 'Get section leaderboard' })
    getSectionLeaderboard(@Param('sectionId') sectionId: string) {
        return this.service.getSectionLeaderboard(sectionId);
    }

    @Get('leaderboard/campus')
    @ApiOperation({ summary: 'Get campus-wide leaderboard' })
    getCampusLeaderboard(@Query('limit') limit?: string) {
        return this.service.getCampusLeaderboard(limit ? parseInt(limit) : 50);
    }

    // ── Stats ──
    @Get('stats/my')
    @Roles(UserRole.STUDENT)
    @ApiOperation({ summary: 'Get my coding stats' })
    getMyStats(@Req() req: any) {
        return this.service.getMyStats(req.user.sub);
    }
}
