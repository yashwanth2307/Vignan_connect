import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

export enum WebhookEvent {
  STUDENT_CREATED = 'student.created',
  FACULTY_CREATED = 'faculty.created',
  USER_DEACTIVATED = 'user.deactivated',
  LOW_ATTENDANCE_ALERT = 'attendance.low',
  STUDENT_ABSENT = 'attendance.absent',
  ATTENDANCE_SESSION_COMPLETED = 'attendance.session.completed',
  RESULTS_RELEASED = 'results.released',
  EXAM_SCHEDULED = 'exam.scheduled',
  ANNOUNCEMENT_CREATED = 'announcement.created',
  PLACEMENT_DRIVE_CREATED = 'placement.drive.created',
  PLACEMENT_RESULT = 'placement.result',
  ASSIGNMENT_POSTED = 'assignment.posted',
  ASSIGNMENT_REVIEWED = 'assignment.reviewed',
  ONLINE_CLASS_SCHEDULED = 'online-class.scheduled',
  EVENT_PUBLISHED = 'event.published',
}

@Injectable()
export class WebhookService {
  private baseUrl: string;
  private enabled: boolean;

  constructor(
    private config: ConfigService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {
    this.baseUrl = this.config.get('N8N_WEBHOOK_URL', 'http://localhost:5678/webhook');
    this.enabled = this.config.get('N8N_ENABLED', 'false') === 'true';
  }

  /** Fire webhook to n8n (fire-and-forget) */
  async fire(event: WebhookEvent, data: any): Promise<void> {
    if (!this.enabled) {
      console.log(`📡 n8n disabled — skipping [${event}]`);
      return;
    }
    const path = event.replace(/\./g, '-');
    const url = `${this.baseUrl}/${path}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), data }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) console.log(`✅ Webhook [${event}] → n8n`);
      else console.warn(`⚠️ Webhook [${event}] failed: ${res.status}`);
    } catch {
      console.warn(`⚠️ Webhook [${event}] unreachable`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 1. ACCOUNT CREATED
  // ══════════════════════════════════════════════════════════════════
  async studentCreated(student: any, plainPassword?: string) {
    const data = {
      name: student.name, email: student.email, password: plainPassword,
      rollNo: student.student?.rollNo,
      department: student.student?.department?.name,
      section: student.student?.section?.name,
    };
    await this.emailService.sendWelcomeEmail({
      name: data.name, email: data.email,
      password: data.password || 'Contact admin', role: 'student',
      rollNo: data.rollNo, department: data.department,
    });
    await this.fire(WebhookEvent.STUDENT_CREATED, data);
  }

  async facultyCreated(faculty: any, plainPassword?: string) {
    const data = {
      name: faculty.name, email: faculty.email, password: plainPassword,
      empId: faculty.faculty?.empId,
      department: faculty.faculty?.department?.name,
    };
    await this.emailService.sendWelcomeEmail({
      name: data.name, email: data.email,
      password: data.password || 'Contact admin', role: 'faculty',
      empId: data.empId, department: data.department,
    });
    await this.fire(WebhookEvent.FACULTY_CREATED, data);
  }

  // ══════════════════════════════════════════════════════════════════
  // 2. LOW ATTENDANCE ALERT
  // ══════════════════════════════════════════════════════════════════
  async lowAttendanceAlert(
    student: { name: string; email: string; rollNo: string },
    subject: string, percentage: number,
  ) {
    await this.emailService.sendLowAttendanceAlert({
      studentName: student.name, studentEmail: student.email,
      rollNo: student.rollNo, subject, attendancePercentage: percentage,
    });
    await this.fire(WebhookEvent.LOW_ATTENDANCE_ALERT, {
      studentName: student.name, studentEmail: student.email,
      rollNo: student.rollNo, subject, attendancePercentage: percentage,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 3. STUDENT MARKED ABSENT
  // ══════════════════════════════════════════════════════════════════
  async studentAbsent(data: {
    studentName: string; studentEmail: string; rollNo: string;
    subject: string; date: string; hourIndex: number;
  }) {
    await this.emailService.sendAbsentNotification(data);
    await this.fire(WebhookEvent.STUDENT_ABSENT, data);
  }

  // ══════════════════════════════════════════════════════════════════
  // 4. ASSIGNMENT POSTED
  // ══════════════════════════════════════════════════════════════════
  async assignmentPosted(assignment: any, group: any, facultyName: string) {
    try {
      const members = await this.prisma.groupMember.findMany({
        where: { groupId: group.id },
        include: { student: { include: { user: { select: { name: true, email: true } } } } },
      });
      for (const m of members) {
        await this.emailService.sendAssignmentPosted({
          studentName: m.student.user.name, studentEmail: m.student.user.email,
          assignmentTitle: assignment.title, groupName: group.name,
          dueAt: assignment.dueAt, maxPoints: assignment.maxPoints,
          facultyName,
        });
      }
      console.log(`📋 Assignment emails sent to ${members.length} students`);
    } catch (err: any) {
      console.error('❌ Assignment notification error:', err.message);
    }
    await this.fire(WebhookEvent.ASSIGNMENT_POSTED, {
      title: assignment.title, group: group.name,
      dueAt: assignment.dueAt, maxPoints: assignment.maxPoints,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. ASSIGNMENT REVIEWED / GRADED
  // ══════════════════════════════════════════════════════════════════
  async assignmentReviewed(data: {
    studentName: string; studentEmail: string;
    assignmentTitle: string; status: 'VERIFIED' | 'FLAGGED';
    vPointsAwarded: number; facultyRemarks?: string;
  }) {
    await this.emailService.sendAssignmentReviewed(data);
    await this.fire(WebhookEvent.ASSIGNMENT_REVIEWED, data);
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. ONLINE CLASS SCHEDULED
  // ══════════════════════════════════════════════════════════════════
  async onlineClassScheduled(cls: any) {
    try {
      let recipients: Array<{ name: string; email: string }> = [];
      if (cls.courseOffering?.sectionId) {
        const students = await this.prisma.student.findMany({
          where: { sectionId: cls.courseOffering.sectionId },
          include: { user: { select: { name: true, email: true } } },
        });
        recipients = students.map(s => ({ name: s.user.name, email: s.user.email }));
      } else {
        // broadcast to all students
        const users = await this.prisma.user.findMany({
          where: { role: 'STUDENT', isActive: true },
          select: { name: true, email: true }, take: 500,
        });
        recipients = users;
      }
      const facultyName = cls.createdBy?.name || 'Faculty';
      const subjectName = cls.courseOffering?.subject?.title;
      for (const r of recipients) {
        await this.emailService.sendOnlineClassAlert({
          recipientEmail: r.email, recipientName: r.name,
          title: cls.title, subject: subjectName,
          platform: cls.platform, meetingLink: cls.meetingLink,
          scheduledAt: cls.scheduledAt, durationMinutes: cls.durationMinutes,
          facultyName,
        });
      }
      console.log(`🎥 Online class emails sent to ${recipients.length} students`);
    } catch (err: any) {
      console.error('❌ Online class notification error:', err.message);
    }
    await this.fire(WebhookEvent.ONLINE_CLASS_SCHEDULED, {
      title: cls.title, scheduledAt: cls.scheduledAt,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. EXAM SCHEDULED
  // ══════════════════════════════════════════════════════════════════
  async examScheduled(examSession: any) {
    try {
      const offerings = await this.prisma.courseOffering.findMany({
        where: { subjectId: examSession.subjectId, semesterId: examSession.semesterId },
        include: { section: { include: { students: { include: { user: { select: { name: true, email: true } } } } } } },
      });
      const students = offerings.flatMap(co => co.section.students);
      for (const s of students) {
        await this.emailService.sendExamScheduled({
          studentName: s.user.name, studentEmail: s.user.email,
          subjectName: examSession.subject?.title || 'Unknown',
          subjectCode: examSession.subject?.code || '',
          date: examSession.date, slot: examSession.slot,
          semesterNumber: examSession.semester?.number || 0,
        });
      }
      console.log(`📝 Exam scheduled emails sent to ${students.length} students`);
    } catch (err: any) {
      console.error('❌ Exam notification error:', err.message);
    }
    await this.fire(WebhookEvent.EXAM_SCHEDULED, {
      subject: examSession.subject?.code, date: examSession.date, slot: examSession.slot,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 8. RESULTS RELEASED
  // ══════════════════════════════════════════════════════════════════
  async resultsReleased(semesterId: string) {
    try {
      const semester = await this.prisma.semester.findUnique({
        where: { id: semesterId },
        include: { department: true },
      });
      const students = await this.prisma.student.findMany({
        where: { currentSemester: semester?.number, departmentId: semester?.departmentId },
        include: { user: { select: { name: true, email: true } } },
      });
      for (const s of students) {
        await this.emailService.sendResultsReleasedEmail({
          recipientEmail: s.user.email, recipientName: s.user.name,
          examType: 'Semester Exam',
          semester: `Semester ${semester?.number} — ${semester?.department?.name}`,
        });
      }
      console.log(`📊 Results emails sent to ${students.length} students`);
    } catch (err: any) {
      console.error('❌ Results notification error:', err.message);
    }
    await this.fire(WebhookEvent.RESULTS_RELEASED, { semesterId });
  }

  // ══════════════════════════════════════════════════════════════════
  // 9. ANNOUNCEMENT CREATED
  // ══════════════════════════════════════════════════════════════════
  async announcementCreated(announcement: any) {
    try {
      const where: any = { isActive: true };
      if (announcement.targetRole) where.role = announcement.targetRole;
      const users = await this.prisma.user.findMany({
        where, select: { name: true, email: true }, take: 500,
      });
      for (const u of users) {
        await this.emailService.sendAnnouncementEmail({
          recipientEmail: u.email, recipientName: u.name,
          title: announcement.title, message: announcement.message,
          createdBy: announcement.createdBy, targetRole: announcement.targetRole,
        });
      }
      console.log(`📢 Announcement emails sent to ${users.length} users`);
    } catch (err: any) {
      console.error('❌ Announcement notification error:', err.message);
    }
    await this.fire(WebhookEvent.ANNOUNCEMENT_CREATED, {
      title: announcement.title, targetRole: announcement.targetRole,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 10. PLACEMENT DRIVE CREATED
  // ══════════════════════════════════════════════════════════════════
  async placementDriveCreated(drive: any) {
    try {
      const students = await this.prisma.user.findMany({
        where: { role: 'STUDENT', isActive: true },
        select: { name: true, email: true }, take: 1000,
      });
      for (const s of students) {
        await this.emailService.sendPlacementDriveEmail({
          recipientEmail: s.email, recipientName: s.name,
          companyName: drive.companyName, role: drive.role,
          packageLPA: drive.packageLPA, eligibleBranches: drive.eligibleBranches,
          deadline: drive.deadline,
        });
      }
      console.log(`🎯 Placement drive emails sent to ${students.length} students`);
    } catch (err: any) {
      console.error('❌ Placement notification error:', err.message);
    }
    await this.fire(WebhookEvent.PLACEMENT_DRIVE_CREATED, {
      companyName: drive.companyName, role: drive.role,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 11. EVENT PUBLISHED
  // ══════════════════════════════════════════════════════════════════
  async eventPublished(event: any) {
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { name: true, email: true }, take: 1000,
      });
      for (const u of users) {
        await this.emailService.sendEventNotification({
          recipientEmail: u.email, recipientName: u.name,
          title: event.title, description: event.description,
          startsAt: event.startsAt, formUrl: event.formUrl,
          isInternalRegistration: event.isInternalRegistration,
        });
      }
      console.log(`🎉 Event emails sent to ${users.length} users`);
    } catch (err: any) {
      console.error('❌ Event notification error:', err.message);
    }
    await this.fire(WebhookEvent.EVENT_PUBLISHED, {
      title: event.title, startsAt: event.startsAt,
    });
  }
}
