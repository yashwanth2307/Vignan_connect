import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CodeArenaService {
    constructor(private prisma: PrismaService) { }

    // ══════════════ PROBLEMS ══════════════

    async createProblem(dto: any, userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Only faculty can create problems');

        return this.prisma.codeProblem.create({
            data: {
                title: dto.title,
                description: dto.description,
                difficulty: dto.difficulty || 'EASY',
                tags: dto.tags || '',
                inputFormat: dto.inputFormat || '',
                outputFormat: dto.outputFormat || '',
                constraints: dto.constraints || '',
                sampleInput: dto.sampleInput || '',
                sampleOutput: dto.sampleOutput || '',
                testCasesJson: dto.testCasesJson || '[]',
                points: dto.points || 10,
                createdByFacultyId: faculty.id,
            },
            include: { createdByFaculty: { include: { user: { select: { name: true } } } } },
        });
    }

    async getProblems(difficulty?: string, tag?: string) {
        const where: any = { isActive: true };
        if (difficulty) where.difficulty = difficulty;
        if (tag) where.tags = { contains: tag };

        return this.prisma.codeProblem.findMany({
            where,
            include: { createdByFaculty: { include: { user: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getProblem(id: string) {
        const problem = await this.prisma.codeProblem.findUnique({
            where: { id },
            include: {
                createdByFaculty: { include: { user: { select: { name: true } } } },
                submissions: {
                    select: { id: true, studentId: true, status: true, language: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        });
        if (!problem) throw new NotFoundException('Problem not found');
        return problem;
    }

    async updateProblem(id: string, dto: any, userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Only faculty can update problems');

        const problem = await this.prisma.codeProblem.findUnique({ where: { id } });
        if (!problem) throw new NotFoundException('Problem not found');

        return this.prisma.codeProblem.update({
            where: { id },
            data: dto,
        });
    }

    // ══════════════ SUBMISSIONS ══════════════

    async submitCode(problemId: string, dto: { language: string; code: string }, userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Only students can submit code');

        const problem = await this.prisma.codeProblem.findUnique({ where: { id: problemId } });
        if (!problem) throw new NotFoundException('Problem not found');

        // Parse test cases
        let testCases: Array<{ input: string; expectedOutput: string }> = [];
        try { testCases = JSON.parse(problem.testCasesJson); } catch { testCases = []; }

        const totalTests = testCases.length || 1;
        let testsPassed = 0;

        // Code Execution via Piston API
        try {
            const languageMap = { 'c': 'c', 'cpp': 'cpp', 'java': 'java', 'python': 'python', 'javascript': 'javascript' };
            const lang = languageMap[dto.language.toLowerCase()] || 'python';

            for (const t of testCases) {
                const res = await fetch('https://emkc.org/api/v2/piston/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        language: lang,
                        version: '*',
                        files: [{ content: dto.code }],
                        stdin: t.input || ''
                    })
                });
                const executionResult: any = await res.json();
                let actualOutput = executionResult?.run?.stdout || '';
                actualOutput = actualOutput.trim();
                const expected = (t.expectedOutput || '').trim();

                if (actualOutput === expected) {
                    testsPassed++;
                }
            }
        } catch (err) {
            console.error('Execution error', err);
        }

        const status = testsPassed === totalTests ? 'ACCEPTED' : 'WRONG_ANSWER';

        // Calculate V-Points
        let vPointsEarned = 0;
        if (status === 'ACCEPTED') {
            const existingSolved = await this.prisma.codeSubmission.findFirst({
                where: { problemId, studentId: student.id, status: 'ACCEPTED' },
            });
            if (!existingSolved) {
                vPointsEarned = problem.points;
                await this.prisma.pointsLedger.create({
                    data: {
                        studentId: student.id,
                        points: vPointsEarned,
                        reason: `Solved: ${problem.title}`,
                    },
                });
            }
        }

        const submission = await this.prisma.codeSubmission.create({
            data: {
                problemId,
                studentId: student.id,
                language: dto.language,
                code: dto.code,
                status,
                testsPassed,
                totalTests,
                vPointsEarned,
            },
        });

        await this.updateStreak(student.id);
        return submission;
    }

    async getProblemSubmissions(problemId: string) {
        return this.prisma.codeSubmission.findMany({
            where: { problemId },
            include: {
                student: {
                    select: {
                        rollNo: true,
                        user: { select: { name: true, email: true } },
                        section: { select: { name: true, department: { select: { code: true } } } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getMySubmissions(userId: string, problemId?: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        const where: any = { studentId: student.id };
        if (problemId) where.problemId = problemId;

        return this.prisma.codeSubmission.findMany({
            where,
            include: { problem: { select: { title: true, difficulty: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    // ══════════════ STREAKS ══════════════

    async updateStreak(studentId: string) {
        const today = new Date().toISOString().split('T')[0];

        let streak = await this.prisma.codeStreak.findUnique({
            where: { studentId },
        });

        if (!streak) {
            return this.prisma.codeStreak.create({
                data: {
                    studentId,
                    currentStreak: 1,
                    longestStreak: 1,
                    lastActiveDate: today,
                    totalActiveDays: 1,
                },
            });
        }

        if (streak.lastActiveDate === today) {
            return streak; // Already active today
        }

        const lastDate = new Date(streak.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = 1;
        if (diffDays === 1) {
            newStreak = streak.currentStreak + 1;
        }

        return this.prisma.codeStreak.update({
            where: { studentId },
            data: {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streak.longestStreak),
                lastActiveDate: today,
                totalActiveDays: streak.totalActiveDays + 1,
            },
        });
    }

    async getMyStreak(userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        const streak = await this.prisma.codeStreak.findUnique({
            where: { studentId: student.id },
        });

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: '',
            totalActiveDays: 0,
        };
    }

    // ══════════════ NOTES ══════════════

    async createNote(dto: { title: string; content: string; tags?: string; isPublic?: boolean }, userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        return this.prisma.codeNote.create({
            data: {
                studentId: student.id,
                title: dto.title,
                content: dto.content,
                tags: dto.tags || '',
                isPublic: dto.isPublic || false,
            },
        });
    }

    async getMyNotes(userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        return this.prisma.codeNote.findMany({
            where: { studentId: student.id },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async updateNote(id: string, dto: any, userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        const note = await this.prisma.codeNote.findUnique({ where: { id } });
        if (!note || note.studentId !== student.id) throw new ForbiddenException('Not your note');

        return this.prisma.codeNote.update({ where: { id }, data: dto });
    }

    async deleteNote(id: string, userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Not a student');

        const note = await this.prisma.codeNote.findUnique({ where: { id } });
        if (!note || note.studentId !== student.id) throw new ForbiddenException('Not your note');

        return this.prisma.codeNote.delete({ where: { id } });
    }

    // ══════════════ CONTESTS ══════════════

    async createContest(dto: any, userId: string) {
        const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
        if (!faculty) throw new ForbiddenException('Only faculty can create contests');

        const contest = await this.prisma.codeContest.create({
            data: {
                title: dto.title,
                description: dto.description,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                createdByFacultyId: faculty.id,
            },
        });

        // Add problems to contest
        if (dto.problemIds && dto.problemIds.length > 0) {
            for (let i = 0; i < dto.problemIds.length; i++) {
                await this.prisma.contestProblem.create({
                    data: {
                        contestId: contest.id,
                        problemId: dto.problemIds[i],
                        orderIndex: i,
                    },
                });
            }
        }

        return this.getContest(contest.id);
    }

    async getContests() {
        return this.prisma.codeContest.findMany({
            include: {
                createdByFaculty: { include: { user: { select: { name: true } } } },
                problems: { include: { problem: { select: { title: true, difficulty: true, points: true } } } },
                participations: { select: { id: true } },
            },
            orderBy: { startTime: 'desc' },
        });
    }

    async getContest(id: string) {
        const contest = await this.prisma.codeContest.findUnique({
            where: { id },
            include: {
                createdByFaculty: { include: { user: { select: { name: true } } } },
                problems: {
                    include: { problem: true },
                    orderBy: { orderIndex: 'asc' },
                },
                participations: {
                    include: { student: { include: { user: { select: { name: true } } } } },
                    orderBy: { score: 'desc' },
                },
            },
        });
        if (!contest) throw new NotFoundException('Contest not found');
        return contest;
    }

    async joinContest(contestId: string, userId: string) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student) throw new ForbiddenException('Only students can join contests');

        const contest = await this.prisma.codeContest.findUnique({ where: { id: contestId } });
        if (!contest) throw new NotFoundException('Contest not found');

        const existing = await this.prisma.contestParticipation.findUnique({
            where: { contestId_studentId: { contestId, studentId: student.id } },
        });
        if (existing) return existing;

        return this.prisma.contestParticipation.create({
            data: { contestId, studentId: student.id },
        });
    }

    // ══════════════ LEADERBOARDS ══════════════

    async getSectionLeaderboard(sectionId: string) {
        const students = await this.prisma.student.findMany({
            where: { sectionId },
            include: {
                user: { select: { name: true } },
                codeStreaks: true,
                pointsLedger: { select: { points: true } },
                codeSubmissions: { where: { status: 'ACCEPTED' }, select: { id: true } },
            },
        });

        const leaderboard = students.map(s => {
            const totalPoints = s.pointsLedger.reduce((acc, p) => acc + p.points, 0);
            return {
                studentId: s.id,
                name: s.user.name,
                rollNo: s.rollNo,
                totalVPoints: totalPoints,
                problemsSolved: s.codeSubmissions.length,
                currentStreak: s.codeStreaks?.currentStreak || 0,
                longestStreak: s.codeStreaks?.longestStreak || 0,
            };
        }).sort((a, b) => b.totalVPoints - a.totalVPoints);

        return leaderboard;
    }

    async getCampusLeaderboard(limit = 50) {
        const students = await this.prisma.student.findMany({
            include: {
                user: { select: { name: true } },
                section: { include: { department: true } },
                codeStreaks: true,
                pointsLedger: { select: { points: true } },
                codeSubmissions: { where: { status: 'ACCEPTED' }, select: { id: true } },
            },
        });

        const leaderboard = students.map(s => {
            const totalPoints = s.pointsLedger.reduce((acc, p) => acc + p.points, 0);
            return {
                studentId: s.id,
                name: s.user.name,
                rollNo: s.rollNo,
                section: s.section.name,
                department: s.section.department.name,
                totalVPoints: totalPoints,
                problemsSolved: s.codeSubmissions.length,
                currentStreak: s.codeStreaks?.currentStreak || 0,
                longestStreak: s.codeStreaks?.longestStreak || 0,
            };
        })
            .sort((a, b) => b.totalVPoints - a.totalVPoints)
            .slice(0, limit);

        return leaderboard;
    }

    async getMyStats(userId: string) {
        const student = await this.prisma.student.findUnique({
            where: { userId },
            include: {
                user: { select: { name: true } },
                section: { include: { department: true } },
                codeStreaks: true,
                pointsLedger: { select: { points: true } },
                codeSubmissions: {
                    where: { status: 'ACCEPTED' },
                    select: { problemId: true, createdAt: true },
                },
            },
        });
        if (!student) throw new ForbiddenException('Not a student');

        const totalVPoints = student.pointsLedger.reduce((acc, p) => acc + p.points, 0);
        const uniqueProblemsSolved = new Set(student.codeSubmissions.map(s => s.problemId)).size;

        // Difficulty breakdown
        const solvedProblemIds = [...new Set(student.codeSubmissions.map(s => s.problemId))];
        const solvedProblems = solvedProblemIds.length > 0
            ? await this.prisma.codeProblem.findMany({
                where: { id: { in: solvedProblemIds } },
                select: { difficulty: true },
            })
            : [];

        const difficultyBreakdown = {
            EASY: solvedProblems.filter(p => p.difficulty === 'EASY').length,
            MEDIUM: solvedProblems.filter(p => p.difficulty === 'MEDIUM').length,
            HARD: solvedProblems.filter(p => p.difficulty === 'HARD').length,
        };

        return {
            name: student.user.name,
            rollNo: student.rollNo,
            section: student.section.name,
            department: student.section.department.name,
            totalVPoints,
            problemsSolved: uniqueProblemsSolved,
            difficultyBreakdown,
            currentStreak: student.codeStreaks?.currentStreak || 0,
            longestStreak: student.codeStreaks?.longestStreak || 0,
            totalActiveDays: student.codeStreaks?.totalActiveDays || 0,
        };
    }
}
