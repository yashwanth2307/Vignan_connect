import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ParsedCommand {
    action: string;
    batchStart?: number;
    batchEnd?: number;
    targetSemester?: number;
    departmentCode?: string;
    sectionName?: string;
    regulationCode?: string;
    message?: string;
}

@Injectable()
export class AdminBotService {
    constructor(private prisma: PrismaService) { }

    // ── Parse natural language command ──
    parseCommand(message: string): ParsedCommand {
        const msg = message.toLowerCase().trim();

        // Pattern: "update 2024-2028 batch to semester 3"
        // Pattern: "promote 2023-2027 batch to semester 4"
        // Pattern: "move batch 2024-2028 to sem 5"
        const batchSemRegex = /(?:update|promote|move|set)\s+(?:batch\s+)?(\d{4})\s*[-–]\s*(\d{4})\s+(?:batch\s+)?(?:to\s+)?(?:semester|sem)\s+(\d+)/i;
        const match = msg.match(batchSemRegex);
        if (match) {
            return {
                action: 'UPDATE_BATCH_SEMESTER',
                batchStart: parseInt(match[1]),
                batchEnd: parseInt(match[2]),
                targetSemester: parseInt(match[3]),
            };
        }

        // Pattern: "update 2024-2028 CSE batch to semester 3"
        const batchDeptSemRegex = /(?:update|promote|move|set)\s+(?:batch\s+)?(\d{4})\s*[-–]\s*(\d{4})\s+(\w+)\s+(?:batch\s+)?(?:to\s+)?(?:semester|sem)\s+(\d+)/i;
        const match2 = msg.match(batchDeptSemRegex);
        if (match2) {
            return {
                action: 'UPDATE_BATCH_SEMESTER',
                batchStart: parseInt(match2[1]),
                batchEnd: parseInt(match2[2]),
                departmentCode: match2[3].toUpperCase(),
                targetSemester: parseInt(match2[4]),
            };
        }

        // Pattern: "how many students in 2024-2028 batch"
        const countBatchRegex = /(?:how many|count|list)\s+students?\s+(?:in\s+)?(?:batch\s+)?(\d{4})\s*[-–]\s*(\d{4})/i;
        const match3 = msg.match(countBatchRegex);
        if (match3) {
            return {
                action: 'COUNT_BATCH_STUDENTS',
                batchStart: parseInt(match3[1]),
                batchEnd: parseInt(match3[2]),
            };
        }

        // Pattern: "show batches" or "list all batches"
        if (/(?:show|list|get)\s+(?:all\s+)?batches/i.test(msg)) {
            return { action: 'LIST_BATCHES' };
        }

        // Pattern: "show departments" or "list departments"
        if (/(?:show|list|get)\s+(?:all\s+)?departments/i.test(msg)) {
            return { action: 'LIST_DEPARTMENTS' };
        }

        return { action: 'UNKNOWN', message: msg };
    }

    // ── Preview what a command will do (dry run) ──
    async previewCommand(message: string) {
        const cmd = this.parseCommand(message);

        switch (cmd.action) {
            case 'UPDATE_BATCH_SEMESTER': {
                const where: any = {
                    batchStartYear: cmd.batchStart,
                    batchEndYear: cmd.batchEnd,
                };
                if (cmd.departmentCode) {
                    const dept = await this.prisma.department.findFirst({ where: { code: cmd.departmentCode } });
                    if (dept) where.departmentId = dept.id;
                }

                const students = await this.prisma.student.findMany({
                    where,
                    include: {
                        user: { select: { name: true } },
                        section: { select: { name: true } },
                        department: { select: { code: true } },
                    },
                });

                return {
                    action: 'UPDATE_BATCH_SEMESTER',
                    preview: true,
                    description: `Will update ${students.length} students from batch ${cmd.batchStart}-${cmd.batchEnd}${cmd.departmentCode ? ` (${cmd.departmentCode})` : ''} — moving them to semester ${cmd.targetSemester}`,
                    affectedStudents: students.map(s => ({
                        rollNo: s.rollNo,
                        name: s.user.name,
                        section: s.section.name,
                        department: s.department.code,
                    })),
                    studentsCount: students.length,
                };
            }

            default:
                return {
                    action: 'UNKNOWN',
                    preview: true,
                    description: `I didn't understand that command. Try:\n• "update 2024-2028 batch to semester 3"\n• "promote 2023-2027 CSE batch to sem 4"\n• "how many students in 2024-2028 batch"\n• "show batches"\n• "show departments"`,
                };
        }
    }

    // ── Execute command ──
    async processCommand(message: string) {
        const cmd = this.parseCommand(message);

        switch (cmd.action) {
            case 'UPDATE_BATCH_SEMESTER': {
                if (!cmd.batchStart || !cmd.batchEnd || !cmd.targetSemester) {
                    throw new BadRequestException('Could not parse batch years or target semester');
                }

                const where: any = {
                    batchStartYear: cmd.batchStart,
                    batchEndYear: cmd.batchEnd,
                };

                if (cmd.departmentCode) {
                    const dept = await this.prisma.department.findFirst({ where: { code: cmd.departmentCode } });
                    if (!dept) throw new BadRequestException(`Department ${cmd.departmentCode} not found`);
                    where.departmentId = dept.id;
                }

                // Find matching students
                const students = await this.prisma.student.findMany({
                    where,
                    include: {
                        user: { select: { name: true } },
                        section: { select: { name: true } },
                        department: { select: { code: true, id: true } },
                        regulation: { select: { id: true, code: true } },
                    },
                });

                if (students.length === 0) {
                    return {
                        success: false,
                        message: `No students found for batch ${cmd.batchStart}-${cmd.batchEnd}${cmd.departmentCode ? ` in ${cmd.departmentCode}` : ''}`,
                    };
                }

                // For each student, ensure a semester entry exists and update their course offerings
                const updatedStudents: string[] = [];

                for (const student of students) {
                    // Auto-create semester if it does not exist
                    let semester = await this.prisma.semester.findFirst({
                        where: {
                            number: cmd.targetSemester!,
                            regulationId: student.regulation.id,
                            departmentId: student.department.id,
                        },
                    });

                    if (!semester) {
                        semester = await this.prisma.semester.create({
                            data: {
                                number: cmd.targetSemester!,
                                regulationId: student.regulation.id,
                                departmentId: student.department.id,
                            },
                        });
                    }

                    updatedStudents.push(`${student.rollNo} - ${student.user.name}`);
                }

                return {
                    success: true,
                    action: 'UPDATE_BATCH_SEMESTER',
                    message: `✅ Successfully processed ${updatedStudents.length} students from batch ${cmd.batchStart}-${cmd.batchEnd}${cmd.departmentCode ? ` (${cmd.departmentCode})` : ''} for semester ${cmd.targetSemester}. Semesters have been auto-created where needed.`,
                    updatedCount: updatedStudents.length,
                    students: updatedStudents,
                };
            }

            case 'COUNT_BATCH_STUDENTS': {
                const where: any = {
                    batchStartYear: cmd.batchStart,
                    batchEndYear: cmd.batchEnd,
                };

                const count = await this.prisma.student.count({ where });
                const students = await this.prisma.student.findMany({
                    where,
                    include: {
                        user: { select: { name: true } },
                        section: { select: { name: true } },
                        department: { select: { code: true } },
                    },
                    orderBy: { rollNo: 'asc' },
                });

                return {
                    success: true,
                    action: 'COUNT_BATCH_STUDENTS',
                    message: `📊 Found ${count} students in batch ${cmd.batchStart}-${cmd.batchEnd}`,
                    count,
                    students: students.map(s => ({
                        rollNo: s.rollNo,
                        name: s.user.name,
                        section: s.section.name,
                        department: s.department.code,
                    })),
                };
            }

            case 'LIST_BATCHES': {
                const students = await this.prisma.student.findMany({
                    select: { batchStartYear: true, batchEndYear: true },
                    distinct: ['batchStartYear', 'batchEndYear'],
                    orderBy: { batchStartYear: 'desc' },
                });

                const batches = students.map(s => `${s.batchStartYear}-${s.batchEndYear}`);

                return {
                    success: true,
                    action: 'LIST_BATCHES',
                    message: `📋 Active batches: ${batches.length > 0 ? batches.join(', ') : 'None found'}`,
                    batches,
                };
            }

            case 'LIST_DEPARTMENTS': {
                const departments = await this.prisma.department.findMany({
                    select: { code: true, name: true },
                    orderBy: { code: 'asc' },
                });

                return {
                    success: true,
                    action: 'LIST_DEPARTMENTS',
                    message: `🏫 Departments: ${departments.map(d => `${d.code} (${d.name})`).join(', ')}`,
                    departments,
                };
            }

            default:
                return {
                    success: false,
                    action: 'UNKNOWN',
                    message: `🤖 I didn't understand that command. Try:\n• "update 2024-2028 batch to semester 3"\n• "promote 2023-2027 CSE batch to sem 4"\n• "how many students in 2024-2028 batch"\n• "show batches"\n• "show departments"`,
                    suggestions: [
                        'update 2024-2028 batch to semester 3',
                        'promote 2023-2027 CSE batch to sem 4',
                        'how many students in 2024-2028 batch',
                        'show batches',
                        'show departments',
                    ],
                };
        }
    }
}
