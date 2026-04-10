# V-Connect 2.0: Complete Project & Tech Stack Explanation

This document serves as your definitive guide to explaining exactly how V-Connect works, why we chose specific technologies, and what every important file in this project does. Use this to easily answer any questions during your Project Expo or presentation.

---

## 1. Why Did We Build V-Connect?
Colleges today use **fragmented tools**. They use physical registers for attendance, Excel sheets for timetables and marks, Zoom/Google Meet for classes, and Noticeboards or scattered WhatsApp groups for announcements. This fragmentation leads to timetable clashes, proxy attendance, delayed exam results, and administrative chaos.

**V-Connect 2.0 solves this** by centralizing absolutely everything into one extremely fast, unified, cloud-based ERP (Enterprise Resource Planning) system. It’s automated, highly secure through role-based access, and paperless.

---

## 2. Our Technology Stack Explained

We chose a modern, enterprise-grade stack. Here is the breakdown:

### **Frontend: Next.js 14, React 18, Tailwind CSS**
*   **What it does:** Powers the user interface that users see and interact with.
*   **Why we chose it:** Next.js is lightning-fast because of Server-Side Rendering (SSR) and Edge routing. It allows us to split the application into specific locked dashboards (`/dashboard/admin`, `/faculty`, `/student`).
*   **How it makes us efficient:** Combined with Tailwind CSS and `shadcn/ui`, we built a consistent, responsive, "Dark Mode"-ready premium interface extremely rapidly without writing thousands of lines of raw CSS.

### **Backend: NestJS & TypeScript**
*   **What it does:** The engine of V-Connect. It processes raw data, secures the API, and communicates with the database.
*   **Why we chose it:** NestJS enforces strict architecture and TypeScript typing. It uses Controllers and Services, meaning the code is highly modular. It allows us to build powerful Role Guards (`@Roles('ADMIN')`) globally on the server, guaranteeing that a student can never spoof a request to change their marks.
*   **How it makes us efficient:** Its built-in WebSocket logic makes realtime tasks (like Live Classes) much easier to manage.

### **Database: PostgreSQL (Neon Tech) & Prisma ORM**
*   **What it does:** Securely stores every user, mark, attendance log, and timetable slot indefinitely.
*   **Why we chose it:** PostgreSQL is the world's most stable relational database, ensuring extreme data integrity. Prisma (our ORM) allows us to interact with SQL using JavaScript, meaning we can write logic like `prisma.student.findUnique()` instead of verbose, unsafe SQL injection-prone queries.

### **Real-Time Engine: WebRTC & Socket.io**
*   **What it does:** Powers the Live Classroom module.
*   **Why we chose it:** Instead of embedding an external commercial zoom link, we engineered a native peer-to-peer visual mesh. WebRTC handles the raw video/audio streaming, and Socket.io handles the signaling (who joined what room, who is drawing on the digital whiteboard).

### **Automation: n8n Webhooks & Nodemailer (Gmail SMTP)**
*   **What it does:** Instantly emails passwords to users upon creation, absentee alerts, and marks publishing notifications.
*   **Why we chose it:** Automation allows administrators to simply hit "Submit", while the computer does the heavy lifting of notifying 500 students behind the scenes automatically via SMTP connection to Gmail.

---

## 3. Demystifying Our Folder Structure & Key Files

Here is an explanation of every core directory and specifically what the files inside do. 

### **The Root Directory (`/`)**
*   `README.md`: The general instruction manual for running the project.
*   `chart.md` & `PPT.md`: Content generated specifically structured for your physical poster design and PowerPoint slides.
*   `render.yaml`: The deployment blueprint telling the Render cloud service exactly how to host our backend server.
*   `n8n-*.json`: Workflow backup files. If the n8n automation engine drops, these JSON exports can instantly rebuild our email workflows.

### **The Frontend (`/web`)**
*   `web/src/app/page.tsx`: The primary landing page users first see.
*   `web/src/app/login/page.tsx`: Handles authentication, encrypts the password payload, and receives the raw JWT Token.
*   `web/src/components/layout/dashboard-layout.tsx`: This master file determines exactly which sidebar navigation elements you see based on whether the JWT token identifies you as Student, Faculty, HOD, TPO, etc.
*   `web/src/app/dashboard/...`: This entire immense folder contains all the frontend views. E.g., `/admin/timetable/page.tsx` renders the HTML grid you see to drag-and-drop course schedules.
*   `web/src/lib/api.ts`: An Axios interceptor. Every time the frontend asks the backend for data, this file silently attaches the user’s secret Auth Token to the header natively.

### **The Backend (`/backend`)**
*   `backend/prisma/schema.prisma`: The most critical blueprint in the system! It defines the strict shape of all 30+ tables (Marks, Attendance, TimetableSlots) inside the SQL database so the entire platform stays perfectly synced.
*   `backend/src/auth/auth.service.ts`: The absolute security mechanism. It verifies passwords (bcrypt hash comparison) and mints secure JSON Web Tokens (JWT) for session management.
*   `backend/src/exam/exam.service.ts`: The massive operations center where faculty-submitted marks are tabulated, stored as `DRAFT`, converted to `VERIFIED`, and finalized to `RELEASED`.
*   `backend/src/academic-calendar/academic-calendar.service.ts`: Manages global college events, holidays, and tracking of semesters.
*   `backend/src/online-classes/online-classes.gateway.ts`: The "Traffic Controller" resolving the Socket.io WebSocket connections. If 50 students join a WebRTC room simultaneously, this file manages routing those peer connections securely.
*   `backend/src/notifications/webhook.service.ts`: The notification nerve center. If a Faculty marks a student as `ABSENT`, this service detects that trigger, bundles the student data, and fires the HTTP signal to the email engine instantly.

---

## 4. How the Flow Actually Works in Practice

Let’s trace a simple action: **A Faculty Marks Attendance**
1. **User Input:** A Faculty logs into `Next.js` and clicks "Absent" on a student.
2. **The POST Route:** The browser fires an API call via `Axios` to `NestJS: /api/attendance/sessions/123/mark`.
3. **The Guard:** NestJS receives it, looks at the JWT token, and says *"Is this user actually a Faculty?"* If Yes, proceed.
4. **The Database:** `Prisma` runs `INSERT INTO attendance_records...`. 
5. **The Webhook Fire:** `WebhookService` realizes an absence was marked, generates a JSON payload, and shoots it out.
6. **The Email Transport:** The webhook connects to Gmail’s SMTP servers, dynamically injects the student's name into a HTML template, and officially dispatches the warning email to their inbox in ~50 milliseconds.
