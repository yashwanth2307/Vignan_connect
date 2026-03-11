# V-Connect 2.0 — Technical Documentation

> **Vignan Institute of Technology and Science**
> College ERP + LMS + Code Arena Platform
> Last updated: March 2026

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Security & Authentication](#3-security--authentication)
4. [Database Schema & ORM](#4-database-schema--orm)
5. [Backend Modules — Implementation & Security](#5-backend-modules--implementation--security)
6. [Frontend — Implementation & Pages](#6-frontend--implementation--pages)
7. [API Reference by Module](#7-api-reference-by-module)
8. [Environment Configuration](#8-environment-configuration)
9. [Deployment & DevOps](#9-deployment--devops)

---

## 1. Technology Stack

### Backend

| Technology        | Version  | Purpose                                    |
|-------------------|----------|--------------------------------------------|
| **NestJS**        | v11.x    | Server-side framework (TypeScript)         |
| **Prisma ORM**    | v6.5     | Database ORM & migrations                  |
| **SQLite**        | —        | Development database (file-based)          |
| **PostgreSQL**    | 15+      | Production database (optional)             |
| **JWT**           | v11.x    | Access & refresh token authentication      |
| **Passport**      | v0.7     | Authentication middleware (JWT strategy)    |
| **bcrypt**        | v5.1     | Password hashing (12 salt rounds)          |
| **Redis / ioredis**| v5.4    | Token storage & caching (in-memory fallback) |
| **Socket.IO**     | v4.8     | WebSocket adapter (real-time features)     |
| **Swagger**       | v11.x    | Auto-generated API documentation           |
| **class-validator**| v0.14   | DTO validation with decorators             |
| **class-transformer**| v0.5  | DTO transformation                         |
| **multer**        | v1.4     | File upload handling                       |

### Frontend

| Technology            | Version  | Purpose                                 |
|-----------------------|----------|-----------------------------------------|
| **Next.js**           | v16.1.6  | React framework (App Router, Turbopack) |
| **React**             | v19.2    | UI library                              |
| **TypeScript**        | v5.x     | Type safety                             |
| **Tailwind CSS**      | v4.x     | Utility-first CSS framework             |
| **Radix UI**          | Latest   | Headless UI primitives (shadcn/ui)      |
| **Framer Motion**     | v12.x    | Animations & transitions                |
| **Recharts**          | v3.7     | Charts & data visualization             |
| **Lucide React**      | v0.575   | Icon library                            |
| **XLSX**              | v0.18    | Excel file parsing (bulk uploads)       |
| **Socket.IO Client**  | v4.8     | Real-time WebSocket client              |
| **next-themes**       | v0.4     | Dark/light theme toggle                 |

### Infrastructure

| Component      | Details                                            |
|----------------|----------------------------------------------------|
| **Database**   | SQLite (dev) / PostgreSQL (prod)                   |
| **Cache**      | Redis with in-memory `Map` fallback                |
| **WebSockets** | Socket.IO via NestJS `IoAdapter`                   |
| **API Docs**   | Swagger at `/api/docs`                             |
| **Fonts**      | Google Fonts — Inter (300–900)                     |

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                   │
│                        Port: 3000                              │
│  ┌─────────────┬─────────────┬──────────┬───────────────────┐  │
│  │  Landing    │  Login      │Dashboard │  Code Arena       │  │
│  │  Page       │  Page       │ (5 roles)│  (Playground)     │  │
│  └──────┬──────┴──────┬──────┴────┬─────┴───────┬───────────┘  │
│         │             │           │             │              │
│         ▼             ▼           ▼             ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              AuthContext + ApiClient (lib/api.ts)        │  │
│  │         localStorage: accessToken, refreshToken          │  │
│  │         Auto-refresh on 401 → silent token renewal       │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────────┘
                            │ HTTP (REST) + WebSocket
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS 11)                     │
│                        Port: 4000                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Global Middleware                        │  │
│  │  • CORS (origin: FRONTEND_URL)                           │  │
│  │  • ValidationPipe (whitelist, forbidNonWhitelisted)      │  │
│  │  • Global prefix: /api                                   │  │
│  │  • Swagger docs: /api/docs                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────── MODULES ──────────────────────────────┐  │
│  │ Auth │ Users │ Departments │ Sections │ Regulations      │  │
│  │ Subjects │ CourseOfferings │ Timetable │ Attendance      │  │
│  │ Exam │ Announcements │ Placements │ OnlineClasses        │  │
│  │ CodeArena │ SkillCourses │ AdminBot │ Groups │ Webhooks  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌───────────────── INFRASTRUCTURE ─────────────────────────┐  │
│  │  PrismaService (DB)  │  RedisService (Cache/in-memory)   │  │
│  │  WebhookService      │  IoAdapter (WebSockets)           │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
               ┌─────────────────────────┐
               │  SQLite / PostgreSQL    │
               │  (Prisma ORM)           │
               │  File: prisma/dev.db    │
               └─────────────────────────┘
```

---

## 3. Security & Authentication

### 3.1 Authentication Flow

```
┌─────────┐    POST /api/auth/login     ┌──────────┐
│  Client  │ ──────────────────────────► │  Server  │
│          │    {email, password}         │          │
│          │                             │  1. Find user by email
│          │                             │  2. Check isActive flag
│          │                             │  3. bcrypt.compare(password, hash)
│          │                             │  4. Generate JWT pair
│          │◄────────────────────────────│  5. Store refresh token in Redis
│          │    {user, tokens}           │          │
└─────────┘                             └──────────┘
```

### 3.2 JWT Token Architecture

| Token          | Secret Env Var         | Default Expiry | Storage (Server) | Storage (Client) |
|----------------|------------------------|----------------|------------------|-------------------|
| Access Token   | `JWT_ACCESS_SECRET`    | 15 minutes     | —                | `localStorage`    |
| Refresh Token  | `JWT_REFRESH_SECRET`   | 7 days         | Redis (`refresh:{userId}`) | `localStorage` |

**JWT Payload:**
```typescript
interface JwtPayload {
    sub: string;    // User ID (UUID)
    email: string;  // User email
    role: UserRole; // ADMIN | HOD | FACULTY | STUDENT | EXAM_CELL
}
```

### 3.3 Token Refresh Mechanism

The frontend `ApiClient` automatically handles token refresh:

1. On any **401 Unauthorized** response, the client calls `POST /api/auth/refresh`
2. Server verifies the refresh token against Redis-stored token
3. If valid: generates **new token pair**, updates Redis, returns new tokens
4. If invalid: clears all tokens, redirects to `/login`
5. The original failed request is **automatically retried** with the new access token

### 3.4 Password Security

| Aspect             | Implementation                                      |
|--------------------|-----------------------------------------------------|
| Hashing Algorithm  | **bcrypt** with **12 salt rounds**                   |
| Default Students   | `student@{rollNo}` (e.g., `student@21BCE7001`)      |
| Default Faculty    | `faculty@{empId}` (e.g., `faculty@FAC001`)           |
| Change Password    | Requires current password, invalidates all sessions  |
| Password Exposure  | `passwordHash` is **never returned** in any API response |

### 3.5 Guards & Decorators

The security system uses a layered guard approach:

```
Request → JwtAuthGuard → RolesGuard → Controller Method
```

| Guard/Decorator     | Purpose                                                |
|---------------------|--------------------------------------------------------|
| `JwtAuthGuard`      | Validates the `Bearer` token in `Authorization` header. Extends Passport's `AuthGuard('jwt')`. |
| `RolesGuard`        | Checks if the authenticated user's role matches the `@Roles()` decorator requirements. |
| `@Roles(...)`       | Decorator that sets metadata for required roles (e.g., `@Roles(UserRole.ADMIN)`). |
| `@CurrentUser()`    | Parameter decorator to extract the current user from the request. |

### 3.6 CORS Configuration

```typescript
app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
});
```

### 3.7 Input Validation (Global)

```typescript
app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Strip unknown properties
    forbidNonWhitelisted: true, // Reject requests with unknown properties
    transform: true,            // Auto-transform payloads to DTO types
    transformOptions: { enableImplicitConversion: true },
}));
```

### 3.8 Route Protection Summary

| Protection Level | Description                                   |
|------------------|-----------------------------------------------|
| **Public**       | Only `POST /auth/login` and `POST /auth/refresh` are public |
| **Authenticated**| All other routes require a valid JWT token     |
| **Role-Gated**   | Most write operations require specific roles   |

---

## 4. Database Schema & ORM

### 4.1 ORM: Prisma

- **Provider:** SQLite (dev) / PostgreSQL (prod)
- **Schema file:** `backend/prisma/schema.prisma`
- **Database file:** `backend/prisma/dev.db` (auto-created)
- **Seeding:** `backend/prisma/seed.ts` (creates admin user)

### 4.2 Entity Relationship Diagram

```
User (1) ──── (0..1) Student ──── (N) AttendanceRecord
  │                    │
  │                    ├──── (N) CodeSubmission
  │                    ├──── (N) CodeStreak (1)
  │                    ├──── (N) ContestParticipation
  │                    ├──── (N) SkillEnrollment
  │                    ├──── (N) PlacementApplication
  │                    ├──── (N) Marks
  │                    └──── (N) HallTicket
  │
  ├── (0..1) Faculty ──── (N) CourseOffering
  │                        ├──── (N) CodeProblem
  │                        ├──── (N) CodeContest
  │                        └──── (N) EvaluationTask
  │
  ├── (N) AuditLog
  ├── (N) Announcement
  ├── (N) OnlineClass
  └── (N) PlacementDrive

Department (1) ──── (N) Section ──── (N) CourseOffering
                                       ├──── (N) TimetableSlot
                                       ├──── (N) AttendanceSession ──── (N) AttendanceRecord
                                       ├──── (N) Material
                                       ├──── (N) Assignment ──── (N) Submission
                                       ├──── (N) Quiz ──── (N) QuizAttempt
                                       └──── (N) OnlineClass

Regulation (1) ──── (N) Semester ──── (N) CourseOffering
                      │                ├──── (N) ExamSession ──── (N) AnswerScript
                      │                ├──── (N) HallTicket
                      │                └──── (N) Marks
                      └──── (N) Subject ──── (N) CourseOffering
```

### 4.3 Enums

| Enum                | Values                                               |
|---------------------|------------------------------------------------------|
| `UserRole`          | `ADMIN`, `HOD`, `FACULTY`, `STUDENT`, `EXAM_CELL`   |
| `AttendanceStatus`  | `PRESENT`, `ABSENT`                                  |
| `AttendanceMethod`  | `MANUAL`                                             |
| `ApprovalStatus`    | `PENDING`, `APPROVED`, `REJECTED`                    |
| `SessionStatus`     | `ACTIVE`, `CLOSED`, `EXPIRED`                        |
| `EvalTaskStatus`    | `ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `VERIFIED`, `LOCKED` |
| `MarksStatus`       | `DRAFT`, `SUBMITTED`, `VERIFIED`, `LOCKED`, `RELEASED` |
| `EventStatus`       | `DRAFT`, `PUBLISHED`, `CLOSED`, `EXPIRED`            |
| `DayOfWeek`         | `MONDAY` – `SATURDAY`                                |
| `ProblemDifficulty` | `EASY`, `MEDIUM`, `HARD`                             |
| `ContestStatus`     | `UPCOMING`, `LIVE`, `COMPLETED`                      |

### 4.4 Key Models (30 total)

| Model               | Table Name              | Primary Key | Notable Fields                                |
|----------------------|-------------------------|-------------|-----------------------------------------------|
| User                 | `users`                 | UUID        | email (unique), passwordHash, role, isActive   |
| Student              | `students`              | UUID        | rollNo (unique), sectionId, regulationId       |
| Faculty              | `faculty`               | UUID        | empId (unique), departmentId                   |
| Department           | `departments`           | UUID        | name (unique), code (unique)                   |
| Section              | `sections`              | UUID        | name + departmentId (unique)                   |
| Regulation           | `regulations`           | UUID        | code (unique, e.g. R20), rulesJson, pdfUrl     |
| Semester             | `semesters`             | UUID        | number + regulationId + deptId (unique)        |
| Subject              | `subjects`              | UUID        | code (unique), credits, semesterNumber         |
| CourseOffering       | `course_offerings`      | UUID        | subject + section + semester (unique)          |
| TimetableSlot        | `timetable_slots`       | UUID        | section + day + hour (unique), startTime       |
| AttendanceSession    | `attendance_sessions`   | UUID        | courseOfferingId, date, hourIndex, status       |
| AttendanceRecord     | `attendance_records`    | UUID        | session + student (unique), status             |
| TopicsTaught         | `topics_taught`         | UUID        | courseOfferingId, date, description             |
| Material             | `materials`             | UUID        | courseOfferingId, fileUrl                       |
| Assignment           | `assignments`           | UUID        | courseOfferingId, dueAt                         |
| Submission           | `submissions`           | UUID        | assignment + student (unique)                  |
| Quiz                 | `quizzes`               | UUID        | courseOfferingId, durationMin, startsAt/endsAt  |
| ExamSession          | `exam_sessions`         | UUID        | subjectId, date, slot (FN/AN)                  |
| AnswerScript         | `answer_scripts`        | UUID        | barcodeValue (unique)                          |
| EvaluationTask       | `evaluation_tasks`      | UUID        | answerScriptId (unique), status                |
| Marks                | `marks`                 | UUID        | student + subject + semester (unique), status  |
| Announcement         | `announcements`         | UUID        | targetRole, departmentId                       |
| PlacementDrive       | `placement_drives`      | UUID        | companyName, eligibleBranches, packageLPA       |
| OnlineClass          | `online_classes`        | UUID        | meetingLink, platform, scheduledAt             |
| CodeProblem          | `code_problems`         | UUID        | difficulty, testCasesJson, points              |
| CodeSubmission       | `code_submissions`      | UUID        | status, vPointsEarned                          |
| CodeStreak           | `code_streaks`          | studentId   | currentStreak, longestStreak, lastActiveDate   |
| CodeContest          | `code_contests`         | UUID        | startTime, endTime                             |
| SkillCourse          | `skill_courses`         | UUID        | tags, modules → lessons                        |
| AuditLog             | `audit_logs`            | UUID        | action, entityType, entityId, metaJson         |
| Group                | `groups`                | UUID        | name, facultyId, courseOfferingId               |
| GroupMember          | `group_members`         | UUID        | groupId + studentId (unique)                   |
| GroupMessage         | `group_messages`        | UUID        | groupId, senderId, content                     |
| GroupAssignment      | `group_assignments`     | UUID        | groupId, title, dueAt, maxPoints               |
| GroupSubmission      | `group_submissions`     | UUID        | assignment + student (unique), similarityScore |

---

## 5. Backend Modules — Implementation & Security

### 5.1 Auth Module (`/api/auth`)

**Purpose:** Authentication, token management, password operations.

| Endpoint                  | Method | Auth Required | Role Restriction | Description                    |
|---------------------------|--------|---------------|------------------|--------------------------------|
| `/auth/login`             | POST   | ❌ No          | —                | Email + password login         |
| `/auth/refresh`           | POST   | ❌ No          | —                | Refresh token pair             |
| `/auth/logout`            | POST   | ✅ Yes         | Any              | Invalidate refresh token       |
| `/auth/me`                | GET    | ✅ Yes         | Any              | Get current user profile       |
| `/auth/change-password`   | POST   | ✅ Yes         | Any              | Change password (invalidates sessions) |

**Security Implementation:**
- Passwords hashed with **bcrypt (12 rounds)**
- Refresh tokens stored in **Redis** with 7-day TTL
- `passwordHash` is **stripped** from all API responses using object destructuring
- Account deactivation check (`isActive`) on every login
- `changePassword` invalidates all refresh tokens forcing re-authentication

---

### 5.2 Users Module (`/api/users`)

**Purpose:** User (student/faculty) CRUD, bulk upload, activation toggle.

| Endpoint                            | Method | Role Restriction        | Description                               |
|-------------------------------------|--------|-------------------------|-------------------------------------------|
| `/users/students`                   | POST   | `ADMIN`                 | Create single student                     |
| `/users/students/bulk`              | POST   | `ADMIN`                 | Bulk upload students from Excel data      |
| `/users/faculty`                    | POST   | `ADMIN`                 | Create single faculty member              |
| `/users`                            | GET    | `ADMIN`                 | List all users (filter by role)           |
| `/users/:id`                        | GET    | Any authenticated       | Get user by ID                            |
| `/users/:id/toggle-active`          | PATCH  | `ADMIN`                 | Enable/disable user account               |
| `/users/students/section/:sectionId`| GET    | `ADMIN`, `FACULTY`      | Get students by section                   |

**Security Implementation:**
- Entire controller guarded with `JwtAuthGuard` + `RolesGuard`
- All write operations restricted to `ADMIN`
- Default passwords: `student@{rollNo}` and `faculty@{empId}`
- Duplicate email and roll number checks before creation
- Bulk upload processes sequentially, reports individual errors
- Fires **webhook** on student/faculty creation (n8n integration)

---

### 5.3 Departments Module (`/api/departments`)

**Purpose:** Academic department management.

| Endpoint              | Method | Role Restriction | Description          |
|-----------------------|--------|------------------|----------------------|
| `/departments`        | POST   | `ADMIN`          | Create department    |
| `/departments`        | GET    | Any authenticated| List all departments |
| `/departments/:id`    | GET    | Any authenticated| Get department by ID |
| `/departments/:id`    | PUT    | `ADMIN`          | Update department    |
| `/departments/:id`    | DELETE | `ADMIN`          | Delete department    |

**Security:** Full CRUD restricted to `ADMIN`; read access for all authenticated users.

---

### 5.4 Sections Module (`/api/sections`)

**Purpose:** Academic section management (e.g., CSE-A, CSE-B).

| Endpoint           | Method | Role Restriction | Description                     |
|--------------------|--------|------------------|---------------------------------|
| `/sections`        | POST   | `ADMIN`          | Create section                  |
| `/sections`        | GET    | Any authenticated| List sections (filter by dept)  |
| `/sections/:id`    | GET    | Any authenticated| Get section by ID               |
| `/sections/:id`    | PUT    | `ADMIN`          | Update section                  |
| `/sections/:id`    | DELETE | `ADMIN`          | Delete section                  |

**Security:** Write = `ADMIN` only. Read = all authenticated. Unique constraint on `name + departmentId`.

---

### 5.5 Regulations Module (`/api/regulations`)

**Purpose:** Academic regulation management (R20, R22, etc.).

| Endpoint             | Method | Role Restriction | Description          |
|----------------------|--------|------------------|----------------------|
| `/regulations`       | POST   | `ADMIN`          | Create regulation    |
| `/regulations`       | GET    | Any authenticated| List all regulations |
| `/regulations/:id`   | GET    | Any authenticated| Get regulation by ID |
| `/regulations/:id`   | PUT    | `ADMIN`          | Update regulation    |
| `/regulations/:id`   | DELETE | `ADMIN`          | Delete regulation    |

**Security:** Write = `ADMIN` only. Stores rules as JSON string, supports PDF URL.

---

### 5.6 Subjects Module (`/api/subjects`)

**Purpose:** Subject/course catalog management.

| Endpoint          | Method | Role Restriction | Description                            |
|-------------------|--------|------------------|----------------------------------------|
| `/subjects`       | POST   | `ADMIN`          | Create subject                         |
| `/subjects`       | GET    | Any authenticated| List subjects (filter by dept/reg)     |
| `/subjects/:id`   | GET    | Any authenticated| Get subject by ID                      |
| `/subjects/:id`   | PUT    | `ADMIN`          | Update subject                         |
| `/subjects/:id`   | DELETE | `ADMIN`          | Delete subject                         |

**Security:** Write = `ADMIN` only. Unique `code` per subject.

---

### 5.7 Course Offerings Module (`/api/course-offerings`)

**Purpose:** Maps subjects to sections with assigned faculty for a semester.

| Endpoint                    | Method | Role Restriction     | Description                    |
|-----------------------------|--------|----------------------|--------------------------------|
| `/course-offerings`         | POST   | `ADMIN`              | Create offering                |
| `/course-offerings`         | GET    | Any authenticated    | List (filter by faculty/section)|
| `/course-offerings/my`      | GET    | `FACULTY`, `HOD`     | Get my offerings (faculty)     |
| `/course-offerings/:id`     | GET    | Any authenticated    | Get offering by ID             |
| `/course-offerings/:id`     | PUT    | `ADMIN`              | Update offering                |
| `/course-offerings/:id`     | DELETE | `ADMIN`              | Delete offering                |

**Security:** Creation and modification = `ADMIN`. Faculty can view their own assignments. Unique constraint on `subject + section + semester`.

---

### 5.8 Timetable Module (`/api/timetable`)

**Purpose:** Weekly timetable management by section.

| Endpoint                             | Method | Role Restriction   | Description                       |
|--------------------------------------|--------|--------------------|-----------------------------------|
| `/timetable`                         | POST   | `ADMIN`            | Create timetable slot             |
| `/timetable/section/:sectionId`      | GET    | Any authenticated  | Get full timetable for section    |
| `/timetable/faculty/my`              | GET    | `FACULTY`, `HOD`   | Get my timetable (faculty)        |
| `/timetable/today/section/:sectionId`| GET    | Any authenticated  | Get today's schedule for section  |
| `/timetable/today/faculty`           | GET    | `FACULTY`, `HOD`   | Get today's schedule for faculty  |
| `/timetable/:id`                     | DELETE | `ADMIN`            | Delete timetable slot             |

**Security:** Slot creation/deletion = `ADMIN`. Unique constraint on `section + day + hourIndex`.

---

### 5.9 Attendance Module (`/api/attendance`)

**Purpose:** Manual attendance management with session-based tracking.

| Endpoint                                      | Method | Role Restriction               | Description                          |
|-----------------------------------------------|--------|--------------------------------|--------------------------------------|
| `/attendance/students`                         | GET    | `ADMIN`, `FACULTY`, `HOD`      | Get students by section/semester/dept |
| `/attendance/sessions/start`                   | POST   | `FACULTY`, `HOD`               | Start manual attendance session      |
| `/attendance/sessions/:sessionId/stop`         | POST   | `FACULTY`, `HOD`               | Close attendance session             |
| `/attendance/sessions/:sessionId/mark`         | POST   | `FACULTY`, `HOD`               | Mark attendance (bulk student IDs)   |
| `/attendance/sessions/:sessionId/records`      | GET    | Any authenticated              | Get session attendance records       |
| `/attendance/sessions/active/:courseOfferingId` | GET    | Any authenticated              | Get active session for offering      |
| `/attendance/sessions/list/:courseOfferingId`   | GET    | Any authenticated              | List all sessions for offering       |
| `/attendance/student/my`                       | GET    | `STUDENT`                      | Get my attendance summary            |

**Security Implementation:**
- QR-based attendance has been **removed**; system uses **manual bulk marking**
- Faculty start a session → select present students → mark attendance → stop session
- Session ownership validated via `req.user.sub` (userId)
- `AttendanceSession.status`: `ACTIVE` → `CLOSED` (prevents late marking)
- Unique constraint: one record per student per session

---

### 5.10 Exam Module (`/api/exam`)

**Purpose:** Examination lifecycle — sessions, answer scripts, evaluation, marks, results.

| Endpoint                                     | Method | Role Restriction              | Description                        |
|----------------------------------------------|--------|-------------------------------|------------------------------------|
| `/exam/sessions`                             | POST   | `EXAM_CELL`, `ADMIN`          | Create exam session                |
| `/exam/sessions`                             | GET    | Any authenticated             | List exam sessions                 |
| `/exam/sessions/:id/generate-scripts`        | POST   | `EXAM_CELL`, `ADMIN`          | Generate barcoded answer scripts   |
| `/exam/sessions/:id/distribute`              | POST   | `EXAM_CELL`, `ADMIN`          | Distribute scripts for evaluation  |
| `/exam/evaluations/my`                       | GET    | `FACULTY`, `HOD`              | Get faculty's evaluation tasks     |
| `/exam/marks`                                | POST   | `FACULTY`, `HOD`, `EXAM_CELL` | Submit marks                       |
| `/exam/marks/:id/verify`                     | PATCH  | `EXAM_CELL`, `ADMIN`          | Verify marks                       |
| `/exam/marks/:id/lock`                       | PATCH  | `EXAM_CELL`, `ADMIN`          | Lock marks (prevent changes)       |
| `/exam/results/release/:semesterId`          | POST   | `EXAM_CELL`, `ADMIN`          | Release results for semester       |
| `/exam/marks/student`                        | GET    | `STUDENT`                     | Get my marks                       |
| `/exam/marks`                                | GET    | `ADMIN`, `EXAM_CELL`          | Get all marks (filter)             |

**Security Implementation:**
- Multi-stage workflow: `DRAFT` → `SUBMITTED` → `VERIFIED` → `LOCKED` → `RELEASED`
- Answer scripts have **unique barcodes** for anonymous evaluation
- Script distribution assigns faculty **randomly** for blind evaluation
- Marks verification requires `EXAM_CELL` or `ADMIN` approval
- Students can **only view their own marks** (enforced via `req.user.sub`)

---

### 5.11 Announcements Module (`/api/announcements`)

**Purpose:** Broadcast announcements targeted by role.

| Endpoint                | Method | Role Restriction | Description                     |
|-------------------------|--------|------------------|---------------------------------|
| `/announcements`        | POST   | `ADMIN`, `HOD`   | Create announcement             |
| `/announcements`        | GET    | Any authenticated| List announcements for my role  |
| `/announcements/:id`    | DELETE | `ADMIN`          | Deactivate announcement         |

**Security:** Announcements filtered by `targetRole` — users only see announcements meant for their role. Deletion = soft-delete via `isActive` flag.

---

### 5.12 Placements Module (`/api/placements`)

**Purpose:** Training & Placement Office (TPO) — drives, applications, status tracking.

| Endpoint                                | Method | Role Restriction | Description                      |
|-----------------------------------------|--------|------------------|----------------------------------|
| `/placements/drives`                    | POST   | `ADMIN`          | Create placement drive           |
| `/placements/drives`                    | GET    | Any authenticated| List drives (active/all)         |
| `/placements/drives/stats`              | GET    | `ADMIN`          | Placement statistics             |
| `/placements/drives/:id`               | GET    | Any authenticated| Drive details with applications  |
| `/placements/drives/:id/toggle`        | PATCH  | `ADMIN`          | Toggle drive active/inactive     |
| `/placements/drives/:id/apply`         | POST   | `STUDENT`        | Apply to a drive                 |
| `/placements/my-applications`           | GET    | `STUDENT`        | My placement applications        |
| `/placements/applications/:id/status`  | PATCH  | `ADMIN`          | Update application status        |

**Security:** Students can only apply (not create/manage drives). Application status: `APPLIED` → `SHORTLISTED` → `SELECTED` / `REJECTED`. Unique constraint: one application per student per drive.

---

### 5.13 Online Classes Module (`/api/online-classes`)

**Purpose:** Schedule and manage virtual classes with meeting links.

| Endpoint                    | Method | Role Restriction              | Description                      |
|-----------------------------|--------|-------------------------------|----------------------------------|
| `/online-classes`           | POST   | `ADMIN`, `FACULTY`, `HOD`     | Schedule online class            |
| `/online-classes`           | GET    | Any authenticated             | List all online classes          |
| `/online-classes/my`        | GET    | Any authenticated             | My classes (faculty/student)     |
| `/online-classes/upcoming`  | GET    | Any authenticated             | List upcoming classes            |
| `/online-classes/:id`       | GET    | Any authenticated             | Get class details                |
| `/online-classes/:id`       | PUT    | `ADMIN`, `FACULTY`, `HOD`     | Update online class              |
| `/online-classes/:id`       | DELETE | `ADMIN`, `FACULTY`, `HOD`     | Delete online class              |

**Security:** Faculty see their course-offering classes; students see classes for their section. Supports platforms: Google Meet, Zoom, Microsoft Teams. Status lifecycle: `SCHEDULED` → `LIVE` → `COMPLETED` / `CANCELLED`.

---

### 5.14 Code Arena Module (`/api/code-arena`)

**Purpose:** Coding playground with problems, submissions, streaks, contests, leaderboards, and notes.

| Endpoint                                     | Method | Role Restriction     | Description                    |
|----------------------------------------------|--------|----------------------|--------------------------------|
| `/code-arena/problems`                        | POST   | `FACULTY`, `HOD`     | Create coding problem          |
| `/code-arena/problems`                        | GET    | Any authenticated    | List problems (filter)         |
| `/code-arena/problems/:id`                    | GET    | Any authenticated    | Get problem details            |
| `/code-arena/problems/:id`                    | PUT    | `FACULTY`, `HOD`     | Update problem                 |
| `/code-arena/problems/:id/submissions`        | GET    | `FACULTY`, `HOD`     | View all submissions           |
| `/code-arena/problems/:problemId/submit`      | POST   | `STUDENT`            | Submit code solution           |
| `/code-arena/submissions/my`                  | GET    | `STUDENT`            | Get my submissions             |
| `/code-arena/streaks/my`                      | GET    | `STUDENT`            | Get my coding streak           |
| `/code-arena/notes`                           | POST   | `STUDENT`            | Create study note              |
| `/code-arena/notes/my`                        | GET    | `STUDENT`            | Get my notes                   |
| `/code-arena/notes/:id`                       | PUT    | `STUDENT`            | Update note                    |
| `/code-arena/notes/:id`                       | DELETE | `STUDENT`            | Delete note                    |
| `/code-arena/contests`                        | POST   | `FACULTY`, `HOD`     | Create contest                 |
| `/code-arena/contests`                        | GET    | Any authenticated    | List contests                  |
| `/code-arena/contests/:id`                    | GET    | Any authenticated    | Contest details                |
| `/code-arena/contests/:id/join`               | POST   | `STUDENT`            | Join contest                   |
| `/code-arena/leaderboard/section/:sectionId`  | GET    | Any authenticated    | Section leaderboard            |
| `/code-arena/leaderboard/campus`              | GET    | Any authenticated    | Campus-wide leaderboard        |
| `/code-arena/stats/my`                        | GET    | `STUDENT`            | My coding statistics           |

**Security Implementation:**
- **Code execution** is done server-side with **test case matching** (input/output comparison)
- Faculty create problems with **hidden test cases** (`testCasesJson`)
- Students can only see **sample** input/output, not full test cases
- **V-Points** earned on successful submissions (first-time bonus)
- **Streak tracking**: consecutive days with at least one accepted submission
- **Note ownership**: students can only edit/delete their own notes
- **Contest timing**: submissions only accepted during `startTime` → `endTime`
- Leaderboard aggregates `vPointsEarned` across all submissions

---

### 5.15 Skill Courses Module (`/api/skill-courses`)

**Purpose:** In-app learning platform with courses, modules, and lessons.

| Endpoint                                 | Method | Role Restriction       | Description              |
|------------------------------------------|--------|------------------------|--------------------------|
| `/skill-courses`                         | POST   | `ADMIN`, `FACULTY`     | Create skill course      |
| `/skill-courses`                         | GET    | Any authenticated      | List all courses         |
| `/skill-courses/:id`                     | GET    | Any authenticated      | Course details           |
| `/skill-courses/:id/modules`             | POST   | `ADMIN`, `FACULTY`     | Add module to course     |
| `/skill-courses/modules/:moduleId/lessons`| POST  | `ADMIN`, `FACULTY`     | Add lesson to module     |
| `/skill-courses/:id/enroll`              | POST   | `STUDENT`              | Enroll in course         |

**Security:** Content creation = Faculty/Admin only. Students can only enroll and consume content.

---

### 5.16 Admin Bot Module (`/api/admin-bot`)

**Purpose:** Natural language command execution for admin tasks.

| Endpoint                | Method | Role Restriction | Description                        |
|-------------------------|--------|------------------|------------------------------------|
| `/admin-bot/command`    | POST   | `ADMIN`          | Execute AI admin command           |
| `/admin-bot/preview`    | POST   | `ADMIN`          | Preview command (dry run)          |

**Security:** Strictly `ADMIN` only. Accepts natural language, parses into database operations.

---

### 5.17 Webhooks Module

**Purpose:** Outbound webhook notifications to n8n automation platform.

- Fires events on: student creation, faculty creation
- Non-blocking (fire-and-forget)
- Configurable via environment variables

---

### 5.18 Groups Module (`/api/groups`) — NEW

**Purpose:** Faculty-student communication groups with in-app messaging, assignments, AI plagiarism detection, and V-Points rewards.

#### Group CRUD & Members

| Endpoint                                | Method | Role Restriction     | Description                       |
|-----------------------------------------|--------|----------------------|-----------------------------------|
| `/groups`                               | POST   | `FACULTY`, `HOD`     | Create a new group                |
| `/groups/my`                            | GET    | Any authenticated    | Get my groups (role-aware)        |
| `/groups/:id`                           | GET    | Any authenticated    | Get group details with members    |
| `/groups/:id`                           | PUT    | `FACULTY`, `HOD`     | Update group                      |
| `/groups/:id`                           | DELETE | `FACULTY`, `HOD`     | Delete group                      |
| `/groups/:id/members`                   | POST   | `FACULTY`, `HOD`     | Add students by IDs               |
| `/groups/:id/members/section/:sectionId`| POST   | `FACULTY`, `HOD`     | Add entire section to group       |
| `/groups/:id/members/:studentId`        | DELETE | `FACULTY`, `HOD`     | Remove student from group         |

#### Messaging

| Endpoint               | Method | Role Restriction | Description                        |
|------------------------|--------|------------------|------------------------------------|
| `/groups/:id/messages`  | POST   | Group members    | Send a message                     |
| `/groups/:id/messages`  | GET    | Group members    | Get messages (paginated cursor)    |

#### Assignments

| Endpoint                                         | Method | Role Restriction     | Description                         |
|--------------------------------------------------|--------|----------------------|-------------------------------------|
| `/groups/:id/assignments`                         | POST   | `FACULTY`, `HOD`     | Create assignment in group          |
| `/groups/:id/assignments`                         | GET    | Group members        | List group assignments              |
| `/groups/assignments/:assignmentId`               | GET    | Group members        | Assignment detail with submissions  |
| `/groups/assignments/:assignmentId/stats`         | GET    | Any authenticated    | Submission statistics               |

#### Submissions & Review

| Endpoint                                              | Method | Role Restriction     | Description                        |
|-------------------------------------------------------|--------|----------------------|------------------------------------|
| `/groups/assignments/:assignmentId/submit`             | POST   | `STUDENT`            | Submit assignment                  |
| `/groups/assignments/:assignmentId/my-submission`      | GET    | `STUDENT`            | View my submission                 |
| `/groups/assignments/:assignmentId/plagiarism-check`   | POST   | `FACULTY`, `HOD`     | Run AI plagiarism detection        |
| `/groups/submissions/:submissionId/review`             | POST   | `FACULTY`, `HOD`     | Verify/flag + award V-Points      |

**Security Implementation:**
- Only the group **owner faculty** can manage members, create assignments, and review
- Students can only submit to groups they are **members of**
- Submission deadline enforced: **rejects after `dueAt`**
- Students can update submissions before deadline (overwrites previous)
- Unique constraint: **one submission per student per assignment**
- Faculty review sets status to `VERIFIED` (V-Points awarded) or `FLAGGED` (rejected)
- V-Points automatically credited to the student's `PointsLedger`

**AI Plagiarism Detection Algorithm:**
The system uses a **multi-layer Jaccard n-gram similarity** approach:

1. **Text Normalization** — lowercase, strip punctuation, collapse whitespace
2. **Word-level n-grams** — generates overlapping 2-grams, 3-grams, and 4-grams
3. **Jaccard Coefficient** — `|A ∩ B| / |A ∪ B|` for each n-gram size
4. **Character trigrams** — additional character-level 3-gram similarity
5. **Weighted Score** — 60% word n-grams + 40% character trigrams
6. **Thresholds:**
   - **≥ 70%** → Automatically **FLAGGED** (high plagiarism)
   - **40–69%** → Marked **REVIEWED** with similarity info
   - **< 40%** → **REVIEWED** (clean)

**Submission Status Lifecycle:**
```
SUBMITTED → [AI Check] → REVIEWED or FLAGGED
    ↓                          ↓
  Faculty Review          Faculty Review
    ↓                          ↓
 VERIFIED (+V-Points)      FLAGGED (rejected)
```


## 6. Frontend — Implementation & Pages

### 6.1 App Structure

```
web/src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, ThemeProvider, AuthProvider)
│   ├── globals.css             # Global styles & CSS variables
│   ├── page.tsx                # Landing page (public)
│   ├── login/
│   │   └── page.tsx            # Login form with animations
│   └── dashboard/
│       ├── layout.tsx          # Auth-gated dashboard layout
│       ├── admin/              # Admin dashboard & sub-pages
│       ├── faculty/            # Faculty dashboard & sub-pages
│       ├── student/            # Student dashboard & sub-pages
│       ├── hod/                # HOD dashboard
│       ├── exam-cell/          # Exam Cell dashboard & sub-pages
│       └── code-arena/         # Code Arena (shared module)
├── components/
│   ├── layout/
│   │   └── dashboard-layout.tsx # Sidebar + navigation
│   ├── theme-provider.tsx       # next-themes wrapper
│   └── ui/                     # Reusable UI components (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── select.tsx
├── contexts/
│   └── auth-context.tsx        # Auth state management (React Context)
└── lib/
    ├── api.ts                  # ApiClient with auto-refresh
    └── utils.ts                # Utility functions (cn, getInitials)
```

### 6.2 Route Protection (Frontend)

```typescript
// dashboard/layout.tsx
export default function DashboardRootLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');  // Redirect unauthenticated users
        }
    }, [user, loading, router]);

    if (loading) return <LoadingSpinner />;
    if (!user) return null;
    return <DashboardLayout>{children}</DashboardLayout>;
}
```

### 6.3 Role-Based Navigation

Each role gets a different sidebar navigation:

| Role       | Dashboard Path          | Key Pages                                                    |
|------------|-------------------------|--------------------------------------------------------------|
| **ADMIN**  | `/dashboard/admin`      | Departments, Sections, Regulations, Subjects, Course Offerings, Users, Timetable, Attendance, Online Classes, Code Arena, Reports |
| **HOD**    | `/dashboard/hod`        | Sections, Faculty, Attendance, Timetable, Code Arena         |
| **FACULTY**| `/dashboard/faculty`    | My Classes, Attendance, Timetable, Topics Taught, Evaluation, Code Arena |
| **STUDENT**| `/dashboard/student`    | Attendance, Timetable, Marks, Profile, Code Arena, Leaderboard |
| **EXAM_CELL** | `/dashboard/exam-cell` | Sessions, Answer Scripts, Evaluation, Results, Subjects, Users |

### 6.4 Frontend Pages Inventory

#### Public Pages
| Page          | Path     | Description                                    |
|---------------|----------|------------------------------------------------|
| Landing Page  | `/`      | Marketing page with features showcase          |
| Login         | `/login` | Animated login form with campus background     |

#### Admin Pages
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Admin Dashboard  | `/dashboard/admin`                      | Overview stats & quick actions        |
| Departments      | `/dashboard/admin/departments`          | CRUD departments                      |
| Sections         | `/dashboard/admin/sections`             | CRUD sections per department          |
| Regulations      | `/dashboard/admin/regulations`          | CRUD academic regulations             |
| Subjects         | `/dashboard/admin/subjects`             | CRUD subjects per regulation          |
| Course Offerings | `/dashboard/admin/course-offerings`     | Map subjects to faculty/sections      |
| Users            | `/dashboard/admin/users`                | Manage all users (bulk upload)        |
| Timetable        | `/dashboard/admin/timetable`            | Visual timetable management           |
| Attendance       | `/dashboard/admin/attendance`           | Attendance overview & reports         |
| Online Classes   | `/dashboard/admin/online-classes`       | Schedule virtual classes              |
| Reports          | `/dashboard/admin/reports`              | Analytics & data exports              |

#### Faculty Pages
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Faculty Dashboard| `/dashboard/faculty`                    | Overview of assigned courses          |
| My Classes       | `/dashboard/faculty/classes`            | Course offerings list                 |
| Attendance       | `/dashboard/faculty/attendance`         | Take attendance (manual)              |
| Timetable        | `/dashboard/faculty/timetable`          | View my weekly schedule               |
| Topics Taught    | `/dashboard/faculty/topics`             | Log topics covered per class          |
| Evaluation       | `/dashboard/faculty/evaluation`         | Grade answer scripts                  |

#### Student Pages
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Student Dashboard| `/dashboard/student`                    | Personal overview & schedule          |
| Attendance       | `/dashboard/student/attendance`         | My attendance percentages             |
| Timetable        | `/dashboard/student/timetable`          | Today's schedule & weekly view        |
| Marks            | `/dashboard/student/marks`              | View released marks/grades            |
| Profile          | `/dashboard/student/profile`            | Personal information                  |
| QR Scan          | `/dashboard/student/scan`               | (Legacy — QR attendance removed)      |

#### Exam Cell Pages
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Exam Dashboard   | `/dashboard/exam-cell`                  | Overview of exam operations           |
| Sessions         | `/dashboard/exam-cell/sessions`         | Manage exam sessions                  |
| Answer Scripts   | `/dashboard/exam-cell/scripts`          | Barcode generation & distribution     |
| Evaluation       | `/dashboard/exam-cell/evaluation`       | Track evaluation progress             |
| Results          | `/dashboard/exam-cell/results`          | Release semester results              |

#### Code Arena Pages
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Code Arena       | `/dashboard/code-arena`                 | Problem list, editor, streaks, notes  |
| Leaderboard      | `/dashboard/code-arena/leaderboard`     | Section & campus leaderboards         |

#### Groups Pages (Faculty & Student)
| Page             | Path                                    | Description                           |
|------------------|-----------------------------------------|---------------------------------------|
| Groups (Faculty) | `/dashboard/faculty/groups`             | Create groups, chat, assign, review   |
| Groups (Student) | `/dashboard/student/groups`             | View groups, chat, submit assignments |

### 6.5 ApiClient Architecture (`lib/api.ts`)

```typescript
class ApiClient {
    // Token management
    getAccessToken()        // from localStorage
    getRefreshToken()       // from localStorage
    setTokens(access, refresh)
    clearTokens()

    // Auto-refresh logic
    refreshAccessToken()    // POST /auth/refresh

    // HTTP methods (all auto-attach Bearer token)
    fetch<T>(endpoint, options)
    get<T>(endpoint)
    post<T>(endpoint, body)
    put<T>(endpoint, body)
    patch<T>(endpoint, body)
    delete<T>(endpoint)

    // Features:
    // - Auto-refresh on 401
    // - Redirect to /login on session expiry
    // - FormData support (skips JSON content-type)
    // - skipAuth option for login/register
}
```

### 6.6 Auth Context (`contexts/auth-context.tsx`)

```typescript
interface AuthContextType {
    user: User | null;       // Current user with role + profile
    loading: boolean;        // Initial auth check in progress
    login(email, password);  // Authenticate & store tokens
    logout();                // Clear tokens & redirect
    refreshUser();           // Re-fetch /auth/me
}
```

**Post-login routing:**
```typescript
const roleRoutes: Record<UserRole, string> = {
    ADMIN:     '/dashboard/admin',
    HOD:       '/dashboard/hod',
    FACULTY:   '/dashboard/faculty',
    STUDENT:   '/dashboard/student',
    EXAM_CELL: '/dashboard/exam-cell',
};
```

### 6.7 UI Component Library

Built on **shadcn/ui** (Radix UI + Tailwind CSS):

| Component     | Source Library   | Usage                                  |
|---------------|-----------------|----------------------------------------|
| Button        | Radix Slot      | Primary actions, form submissions      |
| Card          | Custom          | Content containers, dashboards         |
| Input         | Custom          | Form text inputs                       |
| Label         | Radix Label     | Form field labels                      |
| Select        | Radix Select    | Dropdown selections                    |
| Dialog        | Radix Dialog    | Modals for create/edit forms           |
| DropdownMenu  | Radix Dropdown  | Context menus, user avatar menu        |
| Tabs          | Radix Tabs      | Tabbed content (e.g., Code Arena)      |
| Switch        | Radix Switch    | Toggle controls                        |
| Tooltip       | Radix Tooltip   | Hover information                      |
| Avatar        | Radix Avatar    | User profile pictures                  |
| Separator     | Radix Separator | Visual dividers                        |
| Popover       | Radix Popover   | Floating content                       |

### 6.8 Design System

- **Font:** Inter (Google Fonts) — weights 300–900
- **Theme:** Light/Dark mode via `next-themes`
- **Colors:** CSS variables with HSL values
- **Animations:** Framer Motion for page transitions, hover effects, skeleton loaders
- **Charts:** Recharts for attendance %, marks distribution, placement stats
- **Icons:** Lucide React icon library
- **Responsive:** Mobile-first with sidebar collapse on small screens

---

## 7. API Reference by Module

### Base URL: `http://localhost:4000/api`

### Authentication Header
```
Authorization: Bearer <accessToken>
```

### Standard Error Response
```json
{
    "statusCode": 401,
    "message": "Invalid credentials",
    "error": "Unauthorized"
}
```

### Swagger Documentation
Auto-generated at: **`http://localhost:4000/api/docs`**

---

## 8. Environment Configuration

### Backend (`backend/.env`)

| Variable              | Default                    | Description                        |
|-----------------------|----------------------------|------------------------------------|
| `DATABASE_URL`        | `file:./dev.db`            | SQLite database path               |
| `REDIS_HOST`          | `localhost`                | Redis server hostname              |
| `REDIS_PORT`          | `6379`                     | Redis server port                  |
| `JWT_ACCESS_SECRET`   | `default-secret`           | Access token signing key           |
| `JWT_REFRESH_SECRET`  | *(required)*               | Refresh token signing key          |
| `JWT_ACCESS_EXPIRY`   | `15m`                      | Access token TTL                   |
| `JWT_REFRESH_EXPIRY`  | `7d`                       | Refresh token TTL                  |
| `PORT`                | `4000`                     | Backend server port                |
| `NODE_ENV`            | `development`              | Runtime environment                |
| `FRONTEND_URL`        | `http://localhost:3000`    | CORS allowed origin                |
| `UPLOAD_DIR`          | `./uploads`                | File upload directory              |
| `MAX_FILE_SIZE`       | `10485760` (10MB)          | Max upload file size               |

### Frontend (`web/.env.local`)

| Variable                | Default                    | Description                |
|-------------------------|----------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`   | `http://localhost:4000/api`| Backend API base URL       |

---

## 9. Deployment & DevOps

### 9.1 Local Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed       # Creates admin@vignan.edu / Admin@123
npm run start:dev         # Port 4000 (hot-reload)

# Frontend (separate terminal)
cd web
npm install
npm run dev               # Port 3000 (Turbopack)
```

### 9.2 Production Build

```bash
# Backend
cd backend
npm run build             # Compiles to dist/
npm run start:prod        # node dist/main

# Frontend
cd web
npm run build             # Next.js production build
npm run start             # Production server
```

### 9.3 Database Management

```bash
npx prisma studio        # Visual database editor
npx prisma db push       # Sync schema → DB
npx prisma db seed       # Seed admin user
npx prisma db push --force-reset && npx prisma db seed  # Full reset
```

### 9.4 Redis Fallback

The `RedisService` implements an **automatic in-memory fallback**:
- On startup, attempts to connect to Redis
- If connection fails (no Docker/Redis running), silently switches to `Map<string, {value, expiresAt}>`
- Supports: `get`, `set`, `del`, `exists`, `setJson`, `getJson` with TTL
- All features work identically in both modes

---

> **Document generated from codebase analysis of V-Connect 2.0**
> Backend: 17 controllers, 20 modules, 30+ database models
> Frontend: 32+ pages across 5 role-based dashboards
