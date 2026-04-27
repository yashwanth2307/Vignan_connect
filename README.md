# V-Connect 🚀

**V-Connect** is a comprehensive, production-ready full-stack Enterprise Campus Management and Technical Event Platform. Built securely to streamline the entire academic ecosystem, bridging the gap between Students, Faculty, Administrators, the TPO (Training & Placement Officer), and Exam Cell.

## 🌟 Key Platform Features

**1. Enterprise Dashboard & Role-Based Access Control (RBAC)**
* Specialized high-security Portals for: **Admin, HOD, Faculty, Students, TPO, and Exam Cell.**
* Fully protected JWT-integrated endpoints. 
* Clean and premium user interface built upon a modern Glassmorphism dark-mode SaaS UI system. 

**2. Intelligent Email Notice & Alert System**
* Natively connected to Gmail SMTP to push critical real-time alerts.
* Automated triggers for:
  * 🔴 **Absent Notifications** mapping directly to students and parents.
  * ⚠️ **Attendance Shortage Warnings** ensuring students remain above 75%.
  * 📝 **Exam & Assignments Alerts** directly on scheduling.
  * 🎉 **Event Opportunities** & Campus Seminars.

**3. Total Media & Event Management**
* **Instant Media Uploads**: Admin galleries and magazines accept direct file uploads (image & video), instantaneously converted to Base64 buffers. 
* **Dynamic Marquees**: Scrolling landing page features that animate and adapt.
* **Important Announcement Engine**: An urgent red scrolling ticker bar that instantly takes over the navbar to broadcast crucial information.
* **Events & Extracurriculars**: Toggle between uploading an external Google form OR forcing students natively to sign up using their V-Connect Internal Profiles.
* **Data Insights**: Admin one-click CSV/Excel downloads mapping all registered student responses directly.

**4. Advanced Technical Components**
* **Code Arena**: A sandboxed execution environment built for computer science students to practice coding challenges with an integrated IDE.
* **Placements Tracking**: TPO module strictly managing placement drives, eligible branches, and salary packages natively mapping to student profiles.
* **Results & Marks Integration**: Seamless Exam Cell and Faculty interface bridging subjects, grading boundaries, and semester promotions dynamically.

---

## 🛠 Tech Stack

* **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, TypeScript.
* **Backend**: NestJS, Prisma ORM, Nodemailer, TypeScript.
* **Database**: PostgreSQL (Neon Database)
* **Cloud/Deployment**: Ready for Vercel, Railway, or AWS. 

## 🚀 Showcasing & Installation

*(Note: The environment variables `.env` and `.env.local` must remain securely local and are intentionally excluded via `.gitignore` to prevent secret leaks to the repository.)*

### 1. Backend Setup
1. Open the `/backend` terminal.
2. Run `npm install`
3. Configure your local `.env` with:
   - `DATABASE_URL` (Your Postgres URI)
   - `JWT_SECRET`
   - `SMTP_USER` & `SMTP_PASS` 
4. Sync the database: `npx prisma db push --accept-data-loss`
5. Generate the client: `npx prisma generate`
6. Run the server: `npm run start:dev`

### 2. Frontend Setup
1. Open the `/web` terminal.
2. Run `npm install`
3. Configure your local `.env` with:
   - `NEXT_PUBLIC_API_URL=http://localhost:3000`
4. Run the portal: `npm run dev`

---

> Designed & Administered exclusively for Vignan Institute of Technology & Science.
