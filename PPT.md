# V-CONNECT 2.0 — PPT SLIDE CONTENT

> Use this document to copy content directly into your PowerPoint slides.

---

## SLIDE 1: TITLE SLIDE

**V-CONNECT 2.0**
*A Next-Generation Unified Smart Campus Platform*

**Team:**
- B. SRIMALLIKA (21891A05D9)
- M. SATHWIK REDDY (21891A05G1)
- P. SAI NIKHIL (21891A05H1)
- K. AKSHAYA (21891A05G0)

**Guide:** Mrs. AVVARU R V NAGA SUNEETHA, Assistant Professor

**College:** Vignan Institute of Technology And Science, Deshmukhi
**Department:** Computer Science & Engineering
**Year:** 2024-25

---

## SLIDE 2: PROBLEM STATEMENT

**What Problem Are We Solving?**

- Colleges still manage placements, exams, and academic records using **manual registers, disconnected portals, and spreadsheets**.
- **Lack of Collaboration:** Virtual learning relies on external tools (Zoom/Google Meet) requiring separate links.
- **Manual Examination Processes:** Generating hall tickets, distributing scripts, and releasing verified marks take weeks.
- **Fragmented Communication:** Important absentee alerts and exam results rely on inefficient notice boards or WhatsApp.

**Who Faces This Problem?**
- College Administrators, Faculty, Students, TPOs, and the Exam Cell.

---

## SLIDE 3: SOLUTION OVERVIEW

**Our Idea:**
V-Connect 2.0 is a **cloud-native, full-stack Campus ERP** that digitizes every institutional workflow—from academics to placements—into a single unified ecosystem.

**How It Solves The Problem:**
- **Automated Communication:** Event-driven email engine (n8n + Nodemailer) alerts students on absences and newly uploaded results.
- **End-to-End Exam Cell Pipeline:** Faculty enters marks digitally → Exam Cell verified securely → System publishes to student dashboards.
- **TPO Placement Module:** Dedicated portals to track drives, student applications, and placement algorithms.
- **Built-In Live Classes:** Native WebRTC video classrooms with interactive digital whiteboards.

**Key Concept:** One platform, hierarchical roles (Admin, HOD, Faculty, Student, TPO, Exam Cell), zero paper.

---

## SLIDE 4: SYSTEM ARCHITECTURE

```text
                     ┌────────────────────────┐
                     │      USERS             │
                     │ Admin │ Faculty │ TPO  │
                     └──────────┬─────────────┘
                                │
                                ▼
                     ┌────────────────────────┐
                     │   FRONTEND (Next.js)   │
                     │   Vercel Deployment    │
                     │   React + Tailwind CSS │
                     └──────────┬─────────────┘
                                │ REST API + WebSocket
                                ▼
         ┌──────────────────────┴─────────────────────┐
         │                                            │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ BACKEND (NestJS)│ ◀── Webhooks (HTTP) ──▶  │   n8n WORKFLOW  │
│ Port 4000       │                          │   ENGINE        │
│ Prisma ORM      │ ──▶ Nodemailer SMTP ──▶  │   Gmail (Auth)  │
└────────┬────────┘                          └─────────────────┘
         │
         ▼
┌─────────────────┐
│   DATABASE      │
│   PostgreSQL    │
└─────────────────┘
```

---

## SLIDE 5: SYSTEM REQUIREMENTS & TECHNOLOGIES

### Technology Stack:
| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| **Backend** | NestJS, Node.js, REST APIs |
| **ORM** | Prisma v6 |
| **Database** | PostgreSQL (Neon Tech) |
| **Real-Time Video** | Peer-to-Peer WebRTC, Socket.io |
| **Automation** | n8n Workflow Automation, Nodemailer |
| **Authentication** | JWT (Access + Refresh tokens), bcrypt |
| **Deployment** | Vercel (Front) & Render (Back + n8n) |

---

## SLIDE 6: IMPLEMENTATION — THE 5 PILLARS

**How We Built It:**

| Pillar | Description |
|--------|------------|
| **1. Academic Base** | Timetable generation, Semester Promotion, Department CRUD |
| **2. Exam Cell Engine** | Marks UI, Blind Script Evaluation tracking, Results Publishing, and Vignan-branded Digital HTML Hall Tickets |
| **3. TPO Module** | Placement drive creation, Resume tracking, Application Status filtering, Analytics dashboard |
| **4. Communication** | Central webhook engine triggering background emails for Welcome messages, Absent alerts, and Grades |
| **5. Live Engagement** | Native WebRTC video classrooms and a functional 'Code Arena' for competitive programming |

---

## SLIDE 7: UI SCREENS / DEMO TO HIGHLIGHT

**Screenshots/Flows to show in Demo:**

1. **V-Connect Authentication** — Dynamic login routing based on role (Student vs. TPO vs. Admin).
2. **Student Dashboard** — Media-rich homepage featuring College Magazines, Photo Gallery, and Announcements ticker.
3. **Printable Hall Tickets** — Showing the Vignan logo, Controller of Exams signature, and timetable columns.
4. **Exam Cell Marks Ledger** — The interface where Exam Cell 'Verifies' faculty marks and hits 'Publish'.
5. **TPO Analytics** — Dynamic charts displaying selection rates and average LPA.
6. **Live WebRTC Classroom** — Split-screen showing the interactive faculty whiteboard syncing to students.

---

## SLIDE 8: KEY FEATURES

✅ **V-Connect Live Classroom** — Built-in peer-to-peer mesh video with teacher privileges.
✅ **Automated Event-Driven Emails** — System autonomous messaging without manual intervention.
✅ **Secure Examination Pipeline** — Draft → Submitted → Verified → Locked → Released state structure.
✅ **Smart Placement Operations** — Centralized portal eliminating manual student resume tracking.
✅ **Competitive Code Arena** — In-app gamified environment boosting programming skills.
✅ **Mobile Responsive Dark/Light Modes** — Flawless shadcn/ui integration across all pages.

---

## SLIDE 9: RESULTS / OUTPUT

| Metric | Result |
|--------|--------|
| **Communication Automation** | Over 10 distinct system actions now automatically generate instant email alerts. |
| **Exam Transparency** | 100% digital trace of marks from initially uploaded by faculty to officially published. |
| **Platform Ecosystem** | Completely replaced the need for Zoom (Classes), WhatsApp (Announcements), and Excel (Placements). |
| **Role Security** | 6 hierarchical distinct user types rigorously separated by JWT Route Guards. |

**Key Achievement:** *"Centralized highly complicated campus operations—from examinations to live teaching—into one flawless, robust interface."*

---

## SLIDE 10: COMPARISON — EXISTING vs V-CONNECT 2.0

| Feature | Existing Systems | V-Connect 2.0 |
|---------|----------------|---------------|
| Timetable & Attendance | Paper registers, manual counting, clash errors | Centralized digital DB with algorithm validations |
| Online Learning | External links (Zoom/Meet), expensive iframe limits | Native WebRTC with custom Socket.io signaling |
| Examination Flow | Physical report cards, delayed manual updating | Instant publish pipelines + Printable Branded Hall Tickets |
| Placement Tracking | Manual email threads, disjointed Excel databases | Unified TPO Dashboard with applicant state toggles |
| Notifications | Notice Boards | Automated Nodemailer/n8n HTML email dispatches |

---

## SLIDE 11: CHALLENGES FACED & SOLUTIONS

| Challenge | How We Solved It |
|-----------|-----------------|
| **Email Deliverability** | Configured a dual-system (n8n webhooks + Nodemailer fallback) to ensure critical alerts never fail. |
| **Real-time Synchronization** | Engineered pure WebRTC + Socket.io connections for low latency whiteboard/video transmitting. |
| **Complex Route Security** | Built advanced global `RolesGuards` checking database privileges on every API request. |
| **Vercel Statelessness** | Adapted our file-upload logic to utilize efficient runtime temporary buffers to bypass Serverless limitations. |

---

## SLIDE 12: FUTURE SCOPE

🔮 **Machine Learning Algorithms** — Predictive analytics for student risk based on attendance shortage and mock-test scores.
🔮 **Integrated Payment Gateway** — For handling semester fees, placement registration fees, and fines.
🔮 **Native Mobile Applicaton** — Expanding the Next.js PWA into an official React Native mobile application for Android/iOS.
🔮 **Advanced Proctoring** — AI-based optical monitoring during Code Arena live contest mode.

---

## SLIDE 13: CONCLUSION

**What We Achieved:**
- We successfully developed an **enterprise-grade, production-ready Cloud ERP** capable of managing massive institutional data.
- Built sophisticated architectural pipelines separating internal workflows (Faculty Upload → Exam Cell Publish).
- Achieved **immense automation** by digitizing exams, live classes, placement workflows, and background notification alerts.

**Impact:**
> V-Connect 2.0 doesn't just manage data; it completely modernizes how administrators, faculty, and students interact—bringing Vignan Institute strictly into the digital-first era.

---

## SLIDE 14: THANK YOU

# Thank You! 🙏

**V-Connect 2.0 — Smart Campus Ecosystem**

Team: B. Srimallika, M. Sathwik Reddy, P. Sai Nikhil, K. Akshaya
Guide: Mrs. Avvaru R V Naga Suneetha

*Ready for Questions!*
