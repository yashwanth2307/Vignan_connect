import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private config: ConfigService) {
    this.fromEmail = this.config.get('SMTP_USER', 'vignanvgnt2025@gmail.com');
    this.frontendUrl = this.config.get('FRONTEND_URL', 'https://vignan-connect.vercel.app');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');
    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      console.log('📧 Email service initialized (Gmail SMTP)');
    } else {
      console.log('📧 Email service disabled (no SMTP credentials)');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      console.log(`⚠️  Email skipped (no SMTP): "${subject}" → ${to}`);
      return false;
    }
    try {
      await this.transporter.sendMail({ from: `"V-Connect VGNT" <${this.fromEmail}>`, to, subject, html });
      console.log(`✅ Email sent: "${subject}" → ${to}`);
      return true;
    } catch (err: any) {
      console.error(`❌ Email failed: "${subject}" → ${to}:`, err.message);
      return false;
    }
  }

  private wrap(title: string, body: string, btnLabel = 'Open V-Connect', btnPath = '/login'): string {
    return `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">${title}</h1>
    <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:13px;">Vignan Institute of Technology &amp; Science</p>
  </div>
  <div style="padding:28px 32px;">${body}</div>
  <div style="text-align:center;padding:0 32px 24px;">
    <a href="${this.frontendUrl}${btnPath}"
       style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;
              padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
      ${btnLabel}
    </a>
  </div>
  <div style="background:#f1f5f9;padding:12px;text-align:center;color:#94a3b8;font-size:11px;">
    © 2026 VGNT Deshmukhi · Powered by V-Connect
  </div>
</div>`;
  }

  private row(label: string, value: string): string {
    return `<tr>
      <td style="padding:7px 0;color:#64748b;width:150px;font-size:13px;">${label}</td>
      <td style="padding:7px 0;font-weight:600;color:#1e293b;font-size:13px;">${value}</td>
    </tr>`;
  }

  private table(rows: string): string {
    return `<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table></div>`;
  }

  // ── 1. Welcome / Account Created ──────────────────────────────────────
  async sendWelcomeEmail(data: {
    name: string; email: string; password: string; role: string;
    rollNo?: string; empId?: string; department?: string;
  }): Promise<boolean> {
    const roleLabel = data.role === 'student' ? 'Student' : 'Faculty';
    const body = `
      <p style="color:#334155;">Hello <strong>${data.name}</strong>,</p>
      <p style="color:#475569;">Your ${roleLabel} account on V-Connect is ready. Here are your login credentials:</p>
      ${this.table(
        this.row('Email', data.email) +
        this.row('Password', data.password) +
        (data.rollNo ? this.row('Roll No', data.rollNo) : '') +
        (data.empId ? this.row('Employee ID', data.empId) : '') +
        (data.department ? this.row('Department', data.department) : '')
      )}
      <p style="color:#64748b;font-size:13px;">⚠️ Please change your password after first login for security.</p>`;
    return this.send(data.email, `🎓 Welcome to V-Connect — Your ${roleLabel} Account`, this.wrap('Welcome to V-Connect! 🎓', body, 'Login Now', '/login'));
  }

  // ── 2. Low Attendance Alert ────────────────────────────────────────────
  async sendLowAttendanceAlert(data: {
    studentName: string; studentEmail: string; rollNo: string;
    subject: string; attendancePercentage: number;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.studentName}</strong>,</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <p style="color:#9a3412;margin:0 0 10px;">⚠️ Your attendance has dropped below the required minimum.</p>
        ${this.table(
          this.row('Subject', data.subject) +
          this.row('Roll No', data.rollNo) +
          this.row('Your Attendance', `<span style="color:#dc2626;font-size:18px;">${data.attendancePercentage}%</span>`) +
          this.row('Minimum Required', '75%')
        )}
      </div>
      <p style="color:#475569;font-size:13px;">Irregular attendance may lead to debarment from examinations. Please attend classes regularly.</p>`;
    return this.send(data.studentEmail, `⚠️ Low Attendance Alert — ${data.subject} (${data.attendancePercentage}%)`, this.wrap('⚠️ Low Attendance Alert', body, 'View My Attendance', '/dashboard/student/attendance'));
  }

  // ── 3. Student Marked Absent ───────────────────────────────────────────
  async sendAbsentNotification(data: {
    studentName: string; studentEmail: string; rollNo: string;
    subject: string; date: string; hourIndex: number;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.studentName}</strong>,</p>
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <p style="color:#991b1b;margin:0 0 10px;">🔴 You were marked <strong>ABSENT</strong> in today's class.</p>
        ${this.table(
          this.row('Subject', data.subject) +
          this.row('Date', data.date) +
          this.row('Hour', `Period ${data.hourIndex + 1}`) +
          this.row('Roll No', data.rollNo)
        )}
      </div>
      <p style="color:#475569;font-size:13px;">If this is incorrect, please contact your faculty immediately. Consistent absences affect your overall attendance percentage.</p>`;
    return this.send(data.studentEmail, `🔴 Absent Alert — ${data.subject} on ${data.date}`, this.wrap('🔴 Absent Notification', body, 'View Attendance', '/dashboard/student/attendance'));
  }

  // ── 4. Assignment Posted ───────────────────────────────────────────────
  async sendAssignmentPosted(data: {
    studentName: string; studentEmail: string;
    assignmentTitle: string; groupName: string;
    dueAt: string; maxPoints: number; facultyName: string;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.studentName}</strong>,</p>
      <p style="color:#475569;">A new assignment has been posted in your group.</p>
      ${this.table(
        this.row('Assignment', `<strong>${data.assignmentTitle}</strong>`) +
        this.row('Group', data.groupName) +
        this.row('Posted By', data.facultyName) +
        this.row('Due Date', new Date(data.dueAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })) +
        this.row('Max Points', `${data.maxPoints} V-Points`)
      )}
      <p style="color:#dc2626;font-size:13px;">⏰ Make sure to submit before the deadline!</p>`;
    return this.send(data.studentEmail, `📋 New Assignment: ${data.assignmentTitle}`, this.wrap('📋 New Assignment Posted', body, 'View Assignment', '/dashboard/student'));
  }

  // ── 5. Assignment Graded / Reviewed ───────────────────────────────────
  async sendAssignmentReviewed(data: {
    studentName: string; studentEmail: string;
    assignmentTitle: string; status: 'VERIFIED' | 'FLAGGED';
    vPointsAwarded: number; facultyRemarks?: string;
  }): Promise<boolean> {
    const isVerified = data.status === 'VERIFIED';
    const body = `
      <p style="color:#334155;">Dear <strong>${data.studentName}</strong>,</p>
      <div style="background:${isVerified ? '#f0fdf4' : '#fef2f2'};border:1px solid ${isVerified ? '#86efac' : '#fca5a5'};border-radius:8px;padding:16px 20px;margin:16px 0;">
        <p style="color:${isVerified ? '#166534' : '#991b1b'};font-size:15px;margin:0 0 10px;">
          ${isVerified ? '✅ Your assignment has been <strong>Verified</strong>!' : '⚠️ Your assignment has been <strong>Flagged</strong>.'}
        </p>
        ${this.table(
          this.row('Assignment', data.assignmentTitle) +
          this.row('Status', data.status) +
          (isVerified ? this.row('V-Points Earned', `🏆 +${data.vPointsAwarded}`) : '') +
          (data.facultyRemarks ? this.row('Faculty Remarks', data.facultyRemarks) : '')
        )}
      </div>`;
    return this.send(data.studentEmail, `${isVerified ? '✅' : '⚠️'} Assignment ${data.status}: ${data.assignmentTitle}`, this.wrap(`${isVerified ? '✅ Assignment Verified' : '⚠️ Assignment Flagged'}`, body, 'View My Submissions', '/dashboard/student'));
  }

  // ── 6. Online Class Scheduled ──────────────────────────────────────────
  async sendOnlineClassAlert(data: {
    recipientEmail: string; recipientName: string;
    title: string; subject?: string; platform: string;
    meetingLink: string; scheduledAt: string; durationMinutes: number;
    facultyName: string;
  }): Promise<boolean> {
    const isInApp = data.platform === 'In-App';
    const link = isInApp ? `${this.frontendUrl}${data.meetingLink}` : data.meetingLink;
    const body = `
      <p style="color:#334155;">Dear <strong>${data.recipientName}</strong>,</p>
      <p style="color:#475569;">An online class has been scheduled for you.</p>
      ${this.table(
        this.row('Class Title', `<strong>${data.title}</strong>`) +
        (data.subject ? this.row('Subject', data.subject) : '') +
        this.row('Faculty', data.facultyName) +
        this.row('Platform', data.platform) +
        this.row('Date & Time', new Date(data.scheduledAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })) +
        this.row('Duration', `${data.durationMinutes} minutes`) +
        this.row('Meeting Link', `<a href="${link}" style="color:#2563eb;">${isInApp ? 'Join in V-Connect' : link}</a>`)
      )}`;
    return this.send(data.recipientEmail, `🎥 Online Class: ${data.title}`, this.wrap('🎥 Online Class Scheduled', body, isInApp ? 'Join Class' : 'View Details', isInApp ? data.meetingLink : '/dashboard/student'));
  }

  // ── 7. Exam Scheduled ─────────────────────────────────────────────────
  async sendExamScheduled(data: {
    studentName: string; studentEmail: string;
    subjectName: string; subjectCode: string;
    date: string; slot: string; semesterNumber: number;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.studentName}</strong>,</p>
      <p style="color:#475569;">An exam has been scheduled. Please prepare accordingly.</p>
      ${this.table(
        this.row('Subject', `${data.subjectCode} — ${data.subjectName}`) +
        this.row('Semester', `Semester ${data.semesterNumber}`) +
        this.row('Date', new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) +
        this.row('Slot / Shift', data.slot)
      )}
      <p style="color:#64748b;font-size:13px;">📌 Bring your Hall Ticket and ID card on the day of the exam.</p>`;
    return this.send(data.studentEmail, `📝 Exam Scheduled — ${data.subjectCode}`, this.wrap('📝 Exam Scheduled', body, 'View Timetable', '/dashboard/student/timetable'));
  }

  // ── 8. Results Released ───────────────────────────────────────────────
  async sendResultsReleasedEmail(data: {
    recipientEmail: string; recipientName: string;
    examType: string; semester?: string;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.recipientName}</strong>,</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
        <p style="font-size:28px;margin:0;">📊</p>
        <p style="font-size:17px;font-weight:700;color:#166534;margin:8px 0;">Results are now available!</p>
        <p style="color:#15803d;margin:0;">${data.examType}${data.semester ? ` — ${data.semester}` : ''}</p>
      </div>
      <p style="color:#475569;font-size:13px;">Login to V-Connect to view your marks and performance report.</p>`;
    return this.send(data.recipientEmail, `📊 Results Released — ${data.examType}`, this.wrap('📊 Exam Results Released!', body, 'View My Results', '/dashboard/student'));
  }

  // ── 9. College Event Published ────────────────────────────────────────
  async sendEventNotification(data: {
    recipientEmail: string; recipientName: string;
    title: string; description?: string;
    startsAt: string; formUrl?: string; isInternalRegistration: boolean;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.recipientName}</strong>,</p>
      <p style="color:#475569;">A new college event has been published. Don't miss it!</p>
      ${this.table(
        this.row('Event', `<strong>${data.title}</strong>`) +
        this.row('Starts At', new Date(data.startsAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })) +
        (data.formUrl ? this.row('Registration', `<a href="${data.formUrl}" style="color:#2563eb;">Register Here</a>`) : '')
      )}
      ${data.description ? `<p style="color:#475569;font-size:13px;">${data.description}</p>` : ''}`;
    return this.send(data.recipientEmail, `🎉 Event: ${data.title}`, this.wrap('🎉 New College Event!', body, 'View Events', '/dashboard/student'));
  }

  // ── 10. Announcement Notification ────────────────────────────────────
  async sendAnnouncementEmail(data: {
    recipientEmail: string; recipientName: string;
    title: string; message: string; createdBy: string; targetRole?: string;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.recipientName}</strong>,</p>
      <div style="background:white;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <h2 style="color:#1e293b;margin:0 0 10px;font-size:16px;">${data.title}</h2>
        <p style="color:#475569;line-height:1.6;margin:0;">${data.message}</p>
        <p style="color:#94a3b8;font-size:11px;margin:10px 0 0;">
          Posted by: <strong>${data.createdBy}</strong>${data.targetRole ? ` · For: ${data.targetRole}` : ''}
        </p>
      </div>`;
    return this.send(data.recipientEmail, `📢 ${data.title}`, this.wrap('📢 New Announcement', body, 'View on V-Connect', '/login'));
  }

  // ── 11. Placement Drive ───────────────────────────────────────────────
  async sendPlacementDriveEmail(data: {
    recipientEmail: string; recipientName: string;
    companyName: string; role: string; packageLPA?: string | number;
    eligibleBranches?: string; deadline?: string;
  }): Promise<boolean> {
    const body = `
      <p style="color:#334155;">Dear <strong>${data.recipientName}</strong>,</p>
      <p style="color:#475569;">A new placement opportunity has been posted!</p>
      ${this.table(
        this.row('Company', `<strong style="font-size:16px;">${data.companyName}</strong>`) +
        this.row('Role', data.role) +
        (data.packageLPA ? this.row('Package', `<span style="color:#059669;font-weight:700;">${data.packageLPA} LPA</span>`) : '') +
        (data.eligibleBranches ? this.row('Eligible Branches', data.eligibleBranches) : '') +
        (data.deadline ? this.row('Last Date', `<span style="color:#dc2626;">${new Date(data.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>`) : '')
      )}`;
    return this.send(data.recipientEmail, `🎯 Placement: ${data.companyName} — ${data.role}`, this.wrap('🎯 New Placement Drive!', body, 'Apply Now', '/dashboard/student'));
  }
}
