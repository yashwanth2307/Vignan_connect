import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

export enum WebhookEvent {
  // User events
  STUDENT_CREATED = 'student.created',
  FACULTY_CREATED = 'faculty.created',
  USER_DEACTIVATED = 'user.deactivated',

  // Attendance events
  LOW_ATTENDANCE_ALERT = 'attendance.low',
  ATTENDANCE_SESSION_COMPLETED = 'attendance.session.completed',

  // Exam events
  RESULTS_RELEASED = 'results.released',

  // Announcements
  ANNOUNCEMENT_CREATED = 'announcement.created',

  // Placements
  PLACEMENT_DRIVE_CREATED = 'placement.drive.created',
  PLACEMENT_RESULT = 'placement.result',
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private baseUrl: string;
  private enabled: boolean;

  constructor(
    private config: ConfigService,
    private emailService: EmailService,
  ) {
    this.baseUrl = this.config.get(
      'N8N_WEBHOOK_URL',
      'http://localhost:5678/webhook',
    );
    this.enabled = this.config.get('N8N_ENABLED', 'false') === 'true';
  }

  /**
   * Fire a webhook event to n8n.
   * Each event type maps to a different n8n workflow via URL path.
   * e.g., student.created → POST http://localhost:5678/webhook/student-created
   */
  async fire(event: WebhookEvent, data: any): Promise<void> {
    if (!this.enabled) {
      console.log(
        `📡 Webhook [${event}] (n8n disabled, using direct email):`,
        JSON.stringify(data).substring(0, 100),
      );
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Convert event name to URL path: "student.created" → "student-created"
    const path = event.replace(/\./g, '-');
    const url = `${this.baseUrl}/${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (response.ok) {
        console.log(`✅ Webhook [${event}] sent to n8n`);
      } else {
        console.warn(`⚠️  Webhook [${event}] failed: ${response.status}`);
      }
    } catch (error) {
      // Don't crash the app if n8n is down
      console.warn(
        `⚠️  Webhook [${event}] unreachable (n8n may not be running)`,
      );
    }
  }

  /**
   * Convenience methods for common events
   */
  async studentCreated(student: any, plainPassword?: string) {
    const data = {
      name: student.name,
      email: student.email,
      password: plainPassword,
      rollNo: student.student?.rollNo,
      department: student.student?.department?.name,
      section: student.student?.section?.name,
    };

    // Always try direct email (works on both local and cloud)
    await this.emailService.sendWelcomeEmail({
      name: data.name,
      email: data.email,
      password: data.password || 'Contact admin',
      role: 'student',
      rollNo: data.rollNo,
      department: data.department,
    });

    // Also fire n8n webhook if enabled (local dev)
    await this.fire(WebhookEvent.STUDENT_CREATED, data);
  }

  async facultyCreated(faculty: any, plainPassword?: string) {
    const data = {
      name: faculty.name,
      email: faculty.email,
      password: plainPassword,
      empId: faculty.faculty?.empId,
      department: faculty.faculty?.department?.name,
    };

    // Always try direct email (works on both local and cloud)
    await this.emailService.sendWelcomeEmail({
      name: data.name,
      email: data.email,
      password: data.password || 'Contact admin',
      role: 'faculty',
      empId: data.empId,
      department: data.department,
    });

    // Also fire n8n webhook if enabled (local dev)
    await this.fire(WebhookEvent.FACULTY_CREATED, data);
  }

  async lowAttendanceAlert(student: any, subject: string, percentage: number) {
    await this.fire(WebhookEvent.LOW_ATTENDANCE_ALERT, {
      studentName: student.name,
      studentEmail: student.email,
      rollNo: student.rollNo,
      subject,
      attendancePercentage: percentage,
      message: `Attendance is below 75% (${percentage}%) in ${subject}`,
    });
  }

  async resultsReleased(examSession: any, studentResults: any[]) {
    await this.fire(WebhookEvent.RESULTS_RELEASED, {
      examType: examSession.type,
      semester: examSession.semester,
      totalStudents: studentResults.length,
      releasedAt: new Date().toISOString(),
    });
  }

  async announcementCreated(announcement: any) {
    await this.fire(WebhookEvent.ANNOUNCEMENT_CREATED, {
      title: announcement.title,
      message: announcement.message,
      targetRole: announcement.targetRole,
      createdBy: announcement.createdBy,
    });
  }

  async placementDriveCreated(drive: any) {
    await this.fire(WebhookEvent.PLACEMENT_DRIVE_CREATED, {
      companyName: drive.companyName,
      role: drive.role,
      eligibleBranches: drive.eligibleBranches,
      package: drive.packageLPA,
      deadline: drive.deadline,
    });
  }
}
