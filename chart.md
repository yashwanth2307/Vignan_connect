# V-Connect 2.0 - Project Architecture & Highlights

## 🏆 Project Overview
V-Connect is a comprehensive, multi-role Learning Management and Campus Administration System built with a highly robust Next.js frontend and a performant NestJS/Prisma backend. It connects Students, Faculty, Admins, HODs, TPOs, and the Exam Cell into a unified digital campus.

---

## 🛠️ Technology Stack
*   **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend:** NestJS, TypeScript, `@nestjs/websockets` (Socket.io).
*   **Database:** PostgreSQL (Neon Tech), Prisma ORM, Redis (ioredis).
*   **Deployment:** Vercel (Front & Back), optimized for Serverless / Ephemeral constraints.

---

## 🌟 Key Highlights & Features

### 1. Robust Role-Based Access Control (RBAC)
*   **Dedicated Dashboards:** Specific dynamic routes and features locked via Guards for `ADMIN`, `FACULTY`, `STUDENT`, `EXAM_CELL`, `TPO`, `HOD`, `LIBRARY`, and `PRINCIPAL`.
*   **Data Integrity:** Role-based access ensures faculty can only mark attendance for their assigned subjects, while students only see their own marks and alerts.

### 2. V-Connect Live Classroom (Zoom Alternative)
*   **Native WebRTC Video Conferencing:** Completely built-in! Uses standard WebRTC `RTCPeerConnection` for real-time video mesh without relying on expensive external iframes like Jitsi.
*   **Smart Socket.io Signaling:** `ClassroomGateway` manages dynamic room joining, real-time peer state, and disconnects.
*   **Live Interactive Whiteboard:** Faculty can draw on a digital canvas that is broadcasted instantly to student screens over WebSocket streams. Screen sharing and host controls are natively supported.

### 3. Automated Notification Engine (n8n + Nodemailer)
*   **Event-Driven Architecture:** A centralized `WebhookService` acts as the nervous system for the platform. It wraps 11 distinct event triggers (e.g., `STUDENT_ABSENT`, `RESULTS_RELEASED`, `EXAM_SCHEDULED`).
*   **Fault-Tolerant Delivery:** Intelligently pings an `n8n` webhook endpoint if enabled (`N8N_ENABLED=true`), but guarantees delivery by autonomously dispatching rich HTML emails via `Nodemailer` directly through Gmail SMTP. Emails are confirmed to be sending accurately!
*   *Highlights:* Automated Welcome Emails (with plaintext keys), Low Attendance Alerts, and Absentee Reports sent out the moment Attendance is submitted.

### 4. Advanced Academic Operations
*   **Semester Promotion Engine:** Automates promoting entire groups of students to the next semester or graduating them based on their current academic standing.
*   **Timetable Integration:** Supports rendering complex schedules mapped perfectly to Course Offerings, Sections, and distinct Branch patterns.
*   **Exam Cell:** Centralized module for declaring exam schedules and seamlessly publishing digital results/report cards via the portal.

### 5. Media & Engagement Modules
*   **College Gallery & Magazines:** Integrated file-upload system (`Multer` configured safely for Vercel) enabling admins to post college updates, newsletters, and dynamic image grids directly to student dashboards.
*   **Code Arena:** Gamified competitive coding environment where students tackle algorithmic challenges and track their rank on universal leaderboards.

---

### 🟢 Status Check: Notifications & Emailing
**Emails are FULLY FUNCTIONAL and actively sending!**
The `WebhookService` natively delegates to `Nodemailer` directly via Gmail SMTP (`SMTP_USER`) to guarantee automated emails are delivered regardless of the n8n container status. 
Currently, the webhook URLs point to the `n8n` workflow instances; however, since email fallback is securely handled internally by NestJS, *absent notifications, welcome emails, and low attendance alerts* all send perfectly behind the scenes upon every database action.
