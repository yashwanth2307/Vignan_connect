import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTimetableSlotDto) {
    const existing = await this.prisma.timetableSlot.findFirst({
      where: {
        sectionId: dto.sectionId,
        dayOfWeek: dto.dayOfWeek as DayOfWeek,
        hourIndex: dto.hourIndex,
      },
    });
    if (existing)
      throw new ConflictException(
        'Slot already occupied for this section/day/hour',
      );
    return this.prisma.timetableSlot.create({
      data: {
        sectionId: dto.sectionId,
        dayOfWeek: dto.dayOfWeek as DayOfWeek,
        hourIndex: dto.hourIndex,
        courseOfferingId: dto.courseOfferingId,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        courseOffering: {
          include: {
            subject: true,
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
        section: true,
      },
    });
  }

  async findBySection(sectionId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { sectionId },
      include: {
        courseOffering: {
          include: {
            subject: true,
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }],
    });
  }

  async findByFacultyUserId(userId: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty not found');
    return this.prisma.timetableSlot.findMany({
      where: { courseOffering: { facultyId: faculty.id } },
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
          },
        },
        section: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { hourIndex: 'asc' }],
    });
  }

  async findTodayBySection(sectionId: string) {
    const days: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const today = days[new Date().getDay() - 1] || 'MONDAY';
    return this.prisma.timetableSlot.findMany({
      where: { sectionId, dayOfWeek: today },
      include: {
        courseOffering: {
          include: {
            subject: true,
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { hourIndex: 'asc' },
    });
  }

  async findTodayByFacultyUserId(userId: string) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty not found');
    const days: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const today = days[new Date().getDay() - 1] || 'MONDAY';
    return this.prisma.timetableSlot.findMany({
      where: { courseOffering: { facultyId: faculty.id }, dayOfWeek: today },
      include: {
        courseOffering: {
          include: {
            subject: true,
            section: { include: { department: true } },
          },
        },
        section: true,
      },
      orderBy: { hourIndex: 'asc' },
    });
  }

  // ── Auto-Generate Timetable for a Section ──
  async autoGenerate(sectionId: string, semesterId: string, globalFacultySchedule?: Record<string, Set<number>[]>) {
    // 1. Get course offerings for this section + semester
    const offerings = await this.prisma.courseOffering.findMany({
      where: { sectionId, semesterId },
      include: {
        subject: true,
        faculty: { include: { user: { select: { name: true } } } },
      },
      orderBy: { subject: { isLab: 'desc' } }
    });

    if (offerings.length === 0) {
      if (globalFacultySchedule) return { slotsCreated: 0, offerings: 0 };
      throw new ConflictException(
        'No course offerings found for this section and semester. Create course offerings first.',
      );
    }

    // 2. Clear existing timetable for this section
    await this.prisma.timetableSlot.deleteMany({ where: { sectionId } });

    // 3. Build slot requirements from weeklyHours
    const DAYS: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const MAX_PERIODS = 7; // periods per day (1-7)
    const PERIOD_TIMES: { start: string; end: string }[] = [
      { start: '09:00', end: '09:50' },
      { start: '09:50', end: '10:40' },
      { start: '11:00', end: '11:50' },
      { start: '11:50', end: '12:40' },
      { start: '01:30', end: '02:20' },
      { start: '02:20', end: '03:10' },
      { start: '03:20', end: '04:10' },
    ];

    // Create a grid: grid[dayIndex][hourIndex] = courseOfferingId | null
    const grid: (string | null)[][] = DAYS.map(() =>
      new Array(MAX_PERIODS).fill(null),
    );

    // Array to track if a lab is placed on a specific day
    const dayHasLab: boolean[] = DAYS.map(() => false);

    // Track faculty schedule across ALL sections to avoid conflicts
    const facultySchedule: Record<string, Set<number>[]> = globalFacultySchedule || {};

    if (!globalFacultySchedule) {
      // Load existing faculty schedules (other sections)
      const existingSlots = await this.prisma.timetableSlot.findMany({
        where: { sectionId: { not: sectionId } },
        include: { courseOffering: true },
      });

      for (const slot of existingSlots) {
        const facId = slot.courseOffering.facultyId;
        if (!facultySchedule[facId]) {
          facultySchedule[facId] = DAYS.map(() => new Set());
        }
        const dayIdx = DAYS.indexOf(slot.dayOfWeek);
        if (dayIdx >= 0) facultySchedule[facId][dayIdx].add(slot.hourIndex - 1);
      }
    }

    // Build a list of (courseOfferingId, isLab, totalHours)
    interface SlotReq {
      coId: string;
      isLab: boolean;
      hoursLeft: number;
      facultyId: string;
    }
    const requirements: SlotReq[] = offerings.map((o) => ({
      coId: o.id,
      isLab: o.subject.isLab,
      hoursLeft: o.subject.weeklyHours || 3,
      facultyId: o.facultyId,
    }));

    // Initialize faculty schedule for this section's faculty
    for (const req of requirements) {
      if (!facultySchedule[req.facultyId]) {
        facultySchedule[req.facultyId] = DAYS.map(() => new Set());
      }
    }

    // 4. Place labs first (need 2 consecutive periods) AND maximum 1 lab per day
    const labs = requirements.filter((r) => r.isLab);
    for (const lab of labs) {
      let placed = 0;
      const sessionsNeeded = Math.floor(lab.hoursLeft / 2); // each lab session = 2 periods

      for (
        let attempt = 0;
        attempt < sessionsNeeded && placed < sessionsNeeded;
        attempt++
      ) {
        let slotFound = false;
        // Prefer afternoon slots for labs (indices 4, 5) or morning (indices 0, 1)
        const preferredHours = [4, 5, 0, 1, 2];
        for (let d = 0; d < DAYS.length && !slotFound; d++) {
          if (dayHasLab[d]) continue; // PREVENT multiple labs on same day
          
          for (const h of preferredHours) {
            if (h + 1 >= MAX_PERIODS) continue;
            if (slotFound) break;
            
            if (
              grid[d][h] === null &&
              grid[d][h + 1] === null &&
              !facultySchedule[lab.facultyId][d].has(h) &&
              !facultySchedule[lab.facultyId][d].has(h + 1)
            ) {
              grid[d][h] = lab.coId;
              grid[d][h + 1] = lab.coId;
              facultySchedule[lab.facultyId][d].add(h);
              facultySchedule[lab.facultyId][d].add(h + 1);
              dayHasLab[d] = true; // Mark this day as having a lab
              lab.hoursLeft -= 2;
              placed++;
              slotFound = true;
            }
          }
        }
      }
    }

    // 5. Place theory subjects — spread evenly across days using round-robin
    const theories = requirements.filter((r) => !r.isLab && r.hoursLeft > 0);
    theories.sort((a, b) => b.hoursLeft - a.hoursLeft); // Most hours first

    for (const th of theories) {
      let lastPlacedDay = -1;
      let failsafe = 0;

      while (th.hoursLeft > 0 && failsafe < 50) {
        failsafe++;
        let placed = false;

        const dayOrder = DAYS.map((_, idx) => idx)
          .filter((d) => d !== lastPlacedDay)
          .sort((a, b) => {
            const aCount = grid[a].filter((x) => x !== null).length;
            const bCount = grid[b].filter((x) => x !== null).length;
            return aCount - bCount;
          });

        if (lastPlacedDay >= 0) dayOrder.push(lastPlacedDay);

        for (const d of dayOrder) {
          if (placed) break;
          // Prefer theory in the morning (0, 1, 2, 3) then afternoon
          const theoryHours = [0, 1, 2, 3, 4, 5, 6];
          for (const h of theoryHours) {
            if (
              grid[d][h] === null &&
              !facultySchedule[th.facultyId][d].has(h)
            ) {
              grid[d][h] = th.coId;
              facultySchedule[th.facultyId][d].add(h);
              th.hoursLeft--;
              lastPlacedDay = d;
              placed = true;
              break; // Found slot, move to next hour needed
            }
          }
        }
        if (!placed) break;
      }
    }

    // 6. Create timetable slots in DB
    const slotsToCreate: any[] = [];
    for (let d = 0; d < DAYS.length; d++) {
      for (let h = 0; h < MAX_PERIODS; h++) {
        if (grid[d][h]) {
          slotsToCreate.push({
            sectionId,
            dayOfWeek: DAYS[d],
            hourIndex: h + 1, // 1-indexed
            courseOfferingId: grid[d][h],
            startTime: PERIOD_TIMES[h].start,
            endTime: PERIOD_TIMES[h].end,
          });
        }
      }
    }

    if (slotsToCreate.length > 0) {
      await this.prisma.timetableSlot.createMany({ data: slotsToCreate });
    }

    if (globalFacultySchedule) return { slotsCreated: slotsToCreate.length, offerings: offerings.length };

    return {
      message: "Auto-generated timetable with " + slotsToCreate.length + " slots across " + DAYS.length + " days",
      slotsCreated: slotsToCreate.length,
      offerings: offerings.length,
      timetable: await this.findBySection(sectionId),
    };
  }

  // ── Auto-Generate ALL sections for a semester sequentially ──
  async autoGenerateAll(semesterId: string) {
    const sections = await this.prisma.section.findMany({
      where: {
        courseOfferings: { some: { semesterId } }
      }
    });

    if (sections.length === 0) {
      throw new ConflictException("No sections found with active course offerings for this semester.");
    }

    const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    // Clear all existing slots for all sections matching the course offerings in this semester
    const sectionIds = sections.map(s => s.id);
    await this.prisma.timetableSlot.deleteMany({ where: { sectionId: { in: sectionIds } } });

    // Global track to easily prevent faculty clashes when generating sequentially
    const globalFacultySchedule: Record<string, Set<number>[]> = {};
    
    // Also preload OTHER active sections NOT in this batch just in case a faculty teaches across semesters
    const existingOtherSlots = await this.prisma.timetableSlot.findMany({
      where: { sectionId: { notIn: sectionIds } },
      include: { courseOffering: true },
    });

    for (const slot of existingOtherSlots) {
      const facId = slot.courseOffering.facultyId;
      if (!globalFacultySchedule[facId]) {
        globalFacultySchedule[facId] = DAYS.map(() => new Set());
      }
      const dayIdx = DAYS.indexOf(slot.dayOfWeek);
      if (dayIdx >= 0) globalFacultySchedule[facId][dayIdx].add(slot.hourIndex - 1);
    }

    let totalCreated = 0;
    for (const section of sections) {
        const result = await this.autoGenerate(section.id, semesterId, globalFacultySchedule);
        totalCreated += result.slotsCreated;
    }

    return {
      message: "Successfully generated timetables for " + sections.length + " sections simultaneously without overlap.",
      totalCreated,
      sectionsProcessed: sections.length
    };
  }

  // ── Clear all slots for a section ──
  async clearSection(sectionId: string) {
    const deleted = await this.prisma.timetableSlot.deleteMany({
      where: { sectionId },
    });
    return {
      message: "Cleared " + deleted.count + " timetable slots",
      count: deleted.count,
    };
  }

  async remove(id: string) {
    return this.prisma.timetableSlot.delete({ where: { id } });
  }
}
