# V-CONNECT 2.0 — PPT SLIDE CONTENT

> Use this document to copy content directly into your PowerPoint slides.

---

## SLIDE 1: TITLE SLIDE

**V-CONNECT 2.0**
*A Unified Campus Enterprise Resource Planning (ERP) System*

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

- Colleges still manage attendance, timetables, and academic records using **manual registers, spreadsheets, and WhatsApp groups**.
- Faculty waste hours charting timetables that frequently **clash**.
- Students have **zero real-time visibility** into attendance shortages.
- Virtual learning relies on external tools requiring separate links and accounts.

**Who Faces This Problem?**
- College Administrators, Faculty, Students, HODs.

**Real-World Example:**
> "A faculty member was assigned to two sections at the same time slot, causing confusion for 120 students. Attendance records took weeks to reconcile manually."

---

## SLIDE 3: SOLUTION OVERVIEW

**Our Idea:**
V-Connect 2.0 is a **cloud-native, full-stack Campus ERP** that digitizes core institutional workflows into a single unified platform.

**How It Solves The Problem:**
- Automated **collision-free timetable generation** checking faculty availability instantly.
- **Centralized Attendance Management** preventing proxy marking with precise session locks.
- **In-app video classes** for seamless online education (built-in whiteboard and controls).
- **Automated Semester Promotion**, gracefully archiving 8th-semester students to Alumni.

**Key Concept:** One platform, hierarchical roles (Admin, HOD, Faculty, Student), zero paper.

---

## SLIDE 4: SYSTEM ARCHITECTURE / WORKFLOW

```
                    ┌────────────────────────┐
                    │      USERS             │
                    │ Admin│Faculty│Student  │
                    └──────────┬─────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │   FRONTEND (Next.js)   │
                    │   Vercel Cloud         │
                    │   React + Tailwind CSS │
                    │   shadcn/ui Components │
                    └──────────┬─────────────┘
                               │ REST API + WebSocket
                               ▼
                    ┌────────────────────────┐
                    │   BACKEND (NestJS)     │
                    │   Port 4000            │
                    │   JWT Auth + RBAC      │
                    │   Prisma ORM           │
                    └──────────┬─────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │   DATABASE             │
                    │   PostgreSQL           │
                    │   Relational Schema    │
                    └────────────────────────┘
```

**Flow:** User → Login → Role-based Dashboard → Perform Action → API Call → Backend Validates Guard → Database → Response → UI Updates

---

## SLIDE 5: TECHNOLOGIES USED

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **UI Library** | shadcn/ui, Tailwind CSS, Framer Motion |
| **Backend** | NestJS 11, Node.js 18+ |
| **ORM** | Prisma v6.5 |
| **Database** | PostgreSQL |
| **Authentication** | JWT (Access + Refresh tokens), bcrypt |
| **Video** | Custom Built-In Classroom (WebRTC compatible) |
| **Deployment** | Vercel (Frontend), Render/Railway (Backend) |

---

## SLIDE 6: IMPLEMENTATION — CORE MODULES

**How We Built It:**

| Module | Description |
|--------|------------|
| **1. Auth & RBAC** | JWT dual-token system + strict role-based guards (Admin, HOD, Faculty, Student) |
| **2. Academic Setup** | Departments, Sections, Regulations, Subjects, Semesters — full CRUD capability |
| **3. Timetable Engine** | Algorithm prevents collisions; checks faculty availability across ALL sections |
| **4. Attendance Logic** | Session-based attendance tracking, Admin overrides, restricted editing windows |
| **5. Semester Promotion** | Batch promotion of students across semesters, including automatic conversion to 'Alumni' at the 8th semester |
| **6. Online Classes** | Custom in-app video classroom featuring screen sharing, faculty whiteboard, and "Mute All" host controls |

---

## SLIDE 7: UI SCREENS / DEMO

**Screenshots to show:**

1. **Login Page** — Gradient design with dynamic routing.
2. **Admin Dashboard** — Overview cards showing total students, faculty, departments.
3. **Timetable View** — Color-coded weekly grid with subject, faculty, and room info.
4. **Attendance Registry** — Faculty marks entry grid highlighting session locks.
5. **Admin Attendance Override** — High-privileged table to fix past attendance mistakes.
6. **Online Classroom** — In-app video with host controls (Whiteboard & Mute).
7. **Semester Promotion** — Migration tool moving students seamlessly across academic years.

---

## SLIDE 8: KEY FEATURES

✅ **Collision-Free Timetable** — Validates cross-section availability dynamically.
✅ **Admin Attendance Overrides** — Strict security where only admins can unlock past records.
✅ **Hierarchical Security** — Operations evaluated strictly via JWT + Role Guards.
✅ **In-App Video Classes** — Custom classroom with Teacher controls (No Jitsi/Zoom dependency needed).
✅ **Automated Alumni Conversion** — Final year data archiving perfectly structured.
✅ **Dark/Light Mode** — Premium, responsive theme support across all pages.
✅ **Mobile Responsive** — Dashboards operate perfectly on all screen sizes.

---

## SLIDE 9: RESULTS / OUTPUT

| Metric | Result |
|--------|--------|
| **Timetable Generation** | Zero faculty collisions allowed across multi-section configurations |
| **API Response Time** | <200ms average latency for standard endpoints |
| **Data Integrity** | Locked attendance sessions remain wholly uneditable to standard users |
| **Role Security** | All hierarchy verified — unauthorized access attempts immediately blocked at the guard level |

**Key Achievement:** *"Centralized disconnected collegiate operations into one highly-performant interface."*

---

## SLIDE 10: COMPARISON — EXISTING vs V-CONNECT 2.0

| Feature | Existing System | V-Connect 2.0 |
|---------|----------------|---------------|
| Timetable | Manual (trial & error, hours) | Digitized (instant collision checking) |
| Attendance | Paper registers, manual counting | Centralized digital DB with Admin Audit capabilities |
| Online Learning | External links, fragmented platforms | Built-in video classroom with host privileges |
| Data Progression | Manual database wiping | One-click Semester Promotion and Alumni archiving |
| Security | Shared Excel passwords | Modern JWT + RBAC + bcrypt password hashing |

---

## SLIDE 11: CHALLENGES FACED

| Challenge | How We Solved It |
|-----------|-----------------|
| **Faculty Double-Booking** | Implemented cross-section availability algorithms in the timetable logic |
| **Attendance Tampering** | Introduced strict `isLocked` Session Booleans bypassing only for Admins |
| **Virtual Class Integration** | Engineered a Custom React Video component equipped with Host/Student conditionally rendered controls |
| **JWT Token Expiration UX** | Developed silent auto-refresh token rotation in the frontend API client |

---

## SLIDE 12: FUTURE SCOPE

🔮 **Machine Learning Integration** — Analytics dashboard predicting student performance based on attendance.
🔮 **External Integrations** — SMS/WhatsApp notifications on attendance shortages via Webhooks.
🔮 **Mobile Native App** — Deploying React Native app using the same robust backend APIs.
🔮 **Advanced Gamification** — Incorporating Code Arena, Skill points, and Hackathons natively.

---

## SLIDE 13: CONCLUSION

**What We Achieved:**
- Built a **complete, production-ready Campus ERP foundation** focusing on the most critical structural workflows.
- Successfully digitized scheduling, attendance validation, and virtual classrooms.
- Enforced **strict role-based security** ensuring data privacy across user tiers.
- Delivered a **modern, fully-responsive dashboard UI** deployed live to Vercel.

**Impact:**
> V-Connect 2.0 eliminates manual academic friction, establishing a clean, secure, and easily expansible digital infrastructure for the institution.

---

## SLIDE 14: THANK YOU

# Thank You! 🙏

**V-Connect 2.0 — Campus ERP System**

Team: B. Srimallika, M. Sathwik Reddy, P. Sai Nikhil, K. Akshaya
Guide: Mrs. Avvaru R V Naga Suneetha

*Ready for Questions!*
