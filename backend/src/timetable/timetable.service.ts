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
  async autoGenerate(sectionId: string, semesterId: string) {
    // 1. Get course offerings for this section + semester
    const offerings = await this.prisma.courseOffering.findMany({
      where: { sectionId, semesterId },
      include: {
        subject: true,
        faculty: { include: { user: { select: { name: true } } } },
      },
    });

    if (offerings.length === 0) {
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

    // Track faculty schedule across ALL sections to avoid conflicts
    // facultySchedule[facultyId][dayIndex] = Set of hourIndices already occupied
    const facultySchedule: Record<string, Set<number>[]> = {};

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

    // 4. Place labs first (need 2 consecutive periods)
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
        for (let d = 0; d < DAYS.length && !slotFound; d++) {
          for (let h = 0; h < MAX_PERIODS - 1 && !slotFound; h++) {
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
    // Sort by most hours needed first
    theories.sort((a, b) => b.hoursLeft - a.hoursLeft);

    for (const th of theories) {
      const totalHours = th.hoursLeft;
      let lastPlacedDay = -1;

      while (th.hoursLeft > 0) {
        let placed = false;

        // Build a list of days sorted by how many slots are used (prefer emptier days)
        const dayOrder = DAYS.map((_, idx) => idx)
          .filter((d) => d !== lastPlacedDay) // skip the day we just placed on
          .sort((a, b) => {
            const aCount = grid[a].filter((x) => x !== null).length;
            const bCount = grid[b].filter((x) => x !== null).length;
            return aCount - bCount;
          });

        // Also add lastPlacedDay at the end as fallback
        if (lastPlacedDay >= 0) dayOrder.push(lastPlacedDay);

        for (const d of dayOrder) {
          if (placed) break;
          for (let h = 0; h < MAX_PERIODS; h++) {
            if (
              grid[d][h] === null &&
              !facultySchedule[th.facultyId][d].has(h)
            ) {
              grid[d][h] = th.coId;
              facultySchedule[th.facultyId][d].add(h);
              th.hoursLeft--;
              lastPlacedDay = d;
              placed = true;
              break;
            }
          }
        }
        if (!placed) break; // No more slots available anywhere
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

    // Return generated timetable
    return {
      message: `Auto-generated timetable with ${slotsToCreate.length} slots across ${DAYS.length} days`,
      slotsCreated: slotsToCreate.length,
      offerings: offerings.length,
      timetable: await this.findBySection(sectionId),
    };
  }

  // ── Clear all slots for a section ──
  async clearSection(sectionId: string) {
    const deleted = await this.prisma.timetableSlot.deleteMany({
      where: { sectionId },
    });
    return {
      message: `Cleared ${deleted.count} timetable slots`,
      count: deleted.count,
    };
  }

  async remove(id: string) {
    return this.prisma.timetableSlot.delete({ where: { id } });
  }
}
