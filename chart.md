# V-Connect 2.0 — Complete Feature Chart

## Technology Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| Frontend     | Next.js 14 (App Router), React 18, Tailwind CSS     |
| Backend      | NestJS, TypeScript, Prisma ORM                      |
| Database     | PostgreSQL (Neon Tech)                               |
| Real-Time    | Socket.io, WebRTC (Peer-to-Peer Mesh)               |
| Automation   | n8n Workflow Engine, Nodemailer (Gmail SMTP)         |
| Animation    | Framer Motion, Lucide Icons                          |
| Auth         | JWT (Access + Refresh Tokens), Bcrypt                |
| File Upload  | Multer (Local / Cloud)                               |
| Deployment   | Vercel (Frontend), Render (Backend + n8n)            |

---

## Roles & Access Control (RBAC)

| Role       | Dashboard Features                                                                                   |
|------------|------------------------------------------------------------------------------------------------------|
| ADMIN      | User Management, Departments, Sections, Subjects, Timetable, Clubs, Events, Gallery, Magazines, Announcements, Semester Promotion, Reports |
| FACULTY    | Attendance Marking, Marks Upload, Topics Taught, Materials, Assignments, Online Classes, Groups, Club Coordination, Evaluation |
| STUDENT    | Attendance View, Marks View, Hall Tickets, Timetable, Online Classes, Code Arena, Clubs, Groups, Profile, Service Requests |
| EXAM_CELL  | Exam Sessions, Marks Verification, Results Publishing, Hall Ticket Generation, Answer Scripts, Reports |
| TPO        | Placement Drives, Student Applications, Placement Reports & Analytics                                |
| HOD        | Department Overview, Faculty Management, Attendance Reports                                          |

---

## Module-wise Feature List

### 1. Authentication & User Management
| Feature                         | Status |
|---------------------------------|--------|
| JWT Login (Access + Refresh)    | ✅      |
| Role-Based Dashboard Routing    | ✅      |
| Password Reset (Token-based)    | ✅      |
| Admin: Create Students (Bulk)   | ✅      |
| Admin: Create Faculty           | ✅      |
| Admin: Create Exam Cell / TPO   | ✅      |
| Welcome Email on Account Create | ✅      |

### 2. Academic Structure
| Feature                              | Status |
|--------------------------------------|--------|
| Departments (CRUD)                   | ✅      |
| Sections per Department              | ✅      |
| Regulations (R20, R22, etc.)         | ✅      |
| Semesters per Regulation/Department  | ✅      |
| Subjects (Theory, Lab, Elective)     | ✅      |
| Course Offerings (Subject+Section+Faculty) | ✅ |
| Semester Promotion Engine            | ✅      |

### 3. Timetable
| Feature                          | Status |
|----------------------------------|--------|
| Auto-Generated Timetable        | ✅      |
| Section-wise Weekly Schedule     | ✅      |
| Faculty Personal Timetable      | ✅      |
| Student Timetable View          | ✅      |

### 4. Attendance System
| Feature                               | Status |
|---------------------------------------|--------|
| Faculty: Start Attendance Session     | ✅      |
| Click-to-Cycle Status (P/A/L/OD/ML)  | ✅      |
| Mark All Present / Absent             | ✅      |
| Student: View Own Attendance          | ✅      |
| Auto Absent Alert Email               | ✅      |
| Low Attendance Warning Email          | ✅      |

### 5. Marks & Examination Pipeline
| Feature                                    | Status |
|--------------------------------------------|--------|
| Faculty: Upload Mid-1 Marks                | ✅      |
| Faculty: Upload Mid-2 Marks                | ✅      |
| Faculty: Upload Internal Marks             | ✅      |
| Faculty: Upload External Marks             | ✅      |
| Faculty: Bulk Upload (CSV Support)         | ✅      |
| Exam Cell: Create Exam Sessions            | ✅      |
| Exam Cell: Verify Submitted Marks          | ✅      |
| Exam Cell: Lock Verified Marks             | ✅      |
| Exam Cell: Publish / Release Results       | ✅      |
| Student: View Published Marks              | ✅      |
| Marks Status Flow: DRAFT → SUBMITTED → VERIFIED → LOCKED → RELEASED | ✅ |

### 6. Hall Tickets
| Feature                                      | Status |
|----------------------------------------------|--------|
| Exam Cell: Generate Hall Tickets             | ✅      |
| Student: View & Print Hall Ticket            | ✅      |
| Vignan Institute Branding (Logo + Name)      | ✅      |
| Principal Digital Signature Area             | ✅      |
| Controller of Examinations Signature Area    | ✅      |
| Student Photo Placeholder                    | ✅      |
| Subject Table with Invigilator Sign Column   | ✅      |
| Print-Optimized A4 Layout                    | ✅      |

### 7. Answer Scripts & Evaluation
| Feature                              | Status |
|--------------------------------------|--------|
| Generate Barcoded Answer Scripts     | ✅      |
| Distribute Scripts to Faculty        | ✅      |
| Faculty: Submit Evaluation           | ✅      |
| Exam Cell: Verify Evaluation Tasks   | ✅      |

### 8. Online Classes (Live Classroom)
| Feature                                | Status |
|----------------------------------------|--------|
| WebRTC Peer-to-Peer Video Calling      | ✅      |
| Socket.io Signaling Server             | ✅      |
| Interactive Whiteboard (Canvas)        | ✅      |
| Screen Sharing                         | ✅      |
| Schedule / Join Classes                | ✅      |

### 9. Learning Management (LMS)
| Feature                        | Status |
|--------------------------------|--------|
| Materials Upload               | ✅      |
| Assignments (Create + Submit)  | ✅      |
| Quizzes with Scoring           | ✅      |
| Topics Taught Log              | ✅      |
| Group Projects & Submissions   | ✅      |

### 10. Code Arena (Competitive Coding)
| Feature                          | Status |
|----------------------------------|--------|
| Problem Bank (EASY/MEDIUM/HARD)  | ✅      |
| Code Editor with Execution       | ✅      |
| Test Case Validation              | ✅      |
| V-Points & Streaks               | ✅      |
| Contest Mode (Live Contests)      | ✅      |
| Global Leaderboard               | ✅      |

### 11. Placement Module (TPO)
| Feature                              | Status |
|--------------------------------------|--------|
| Create Placement Drives              | ✅      |
| Set Eligibility (Branch/CGPA)        | ✅      |
| Student: Apply to Drives             | ✅      |
| TPO: Review Applications             | ✅      |
| TPO: Update Status (Shortlist/Select/Reject) | ✅ |
| TPO: Placement Reports & Charts      | ✅      |

### 12. Clubs & Events
| Feature                           | Status |
|-----------------------------------|--------|
| Admin/Faculty: Create Clubs       | ✅      |
| Admin/Faculty: Schedule Events    | ✅      |
| Student: Join Clubs               | ✅      |
| Admin: Delete Clubs               | ✅      |
| Campus Events (Create/Register)   | ✅      |

### 13. Announcements
| Feature                            | Status |
|------------------------------------|--------|
| Admin/Faculty: Create Announcements | ✅     |
| Target by Role/Department          | ✅      |
| Scrolling Ticker on Dashboard      | ✅      |
| Important Flag                     | ✅      |

### 14. College Gallery & Magazines
| Feature                           | Status |
|-----------------------------------|--------|
| Admin: Upload Gallery Photos      | ✅      |
| Admin: Upload College Magazines   | ✅      |
| Student Dashboard: View Gallery   | ✅      |
| Student Dashboard: View Magazines | ✅      |

### 15. Notification & Email Engine
| Feature                                  | Status |
|------------------------------------------|--------|
| n8n Webhook Integration                  | ✅      |
| Nodemailer SMTP Fallback                 | ✅      |
| Welcome Email (Student/Faculty/Staff)    | ✅      |
| Absent Alert Email                       | ✅      |
| Low Attendance Warning Email             | ✅      |
| Results Released Notification            | ✅      |
| Exam Scheduled Notification              | ✅      |
| Placement Drive Posted Notification      | ✅      |

### 16. Service Requests
| Feature                        | Status |
|--------------------------------|--------|
| Student: Raise Service Request | ✅      |
| Faculty: Respond to Requests   | ✅      |
| Status Tracking                | ✅      |

### 17. Audit & Reporting
| Feature                         | Status |
|---------------------------------|--------|
| Audit Log (All Actions Tracked) | ✅      |
| Marks Reports (Filtered)        | ✅      |
| Attendance Reports (Filtered)   | ✅      |

---

## Architecture Flow

```
Student/Faculty/Admin (Browser)
        │
        ▼
  ┌─────────────┐     ┌──────────────┐
  │  Next.js 14  │────▶│  NestJS API  │
  │  (Vercel)    │     │  (Render)    │
  └─────────────┘     └──────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │ PostgreSQL │  │ Socket.io │  │ Nodemailer│
       │ (Neon)     │  │ (WebRTC)  │  │ (Gmail)   │
       └───────────┘  └───────────┘  └───────────┘
```

---

## Marks Verification Pipeline

```
Faculty Uploads Marks (Mid1/Mid2/Internal/External)
        │
        ▼ Status: SUBMITTED
Exam Cell Reviews & Verifies
        │
        ▼ Status: VERIFIED → LOCKED
Exam Cell Publishes Results
        │
        ▼ Status: RELEASED
Students View on Dashboard + Email Notification
```
