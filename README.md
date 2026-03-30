
# V-Connect 2.0 — Campus ERP System

> **Vignan Group of Institutions (VGNT)**
> A complete College ERP with Attendance, LMS, Exam Management, Placements, and n8n Workflow Automation

---

## 🚀 Quick Start — Run on Any Machine

### Prerequisites
- **Node.js 18+** — [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- That's it! No Docker, PostgreSQL, or Redis needed.

### Step-by-Step Setup

#### 1️⃣ Open the project in VS Code
```
File → Open Folder → Select "v-connect-2.0" folder
```

#### 2️⃣ Open TWO terminals in VS Code
Press `` Ctrl+` `` to open a terminal, then click the **"+"** button to open a second one.

#### 3️⃣ Terminal 1 — Start the Backend

```bash
# Navigate to the backend folder
cd backend

# Install all dependencies (first time only)
npm install

# Generate Prisma Client (first time only)
npx prisma generate

# Create/update the database (first time only)
npx prisma db push

# Seed the admin user (first time only)
npx prisma db seed

# Start the backend server
npm run start:dev
```

Wait for: `Nest application successfully started` message.

**Backend runs at:** http://localhost:4000
**API Docs (Swagger):** http://localhost:4000/api/docs

#### 4️⃣ Terminal 2 — Start the Frontend

```bash
# Navigate to the web folder
cd web

# Install all dependencies (first time only)
npm install

# Start the frontend server
npm run dev
```

**Frontend runs at:** http://localhost:3000

#### 5️⃣ Open in Browser
Go to **http://localhost:3000** — you'll see the V-Connect landing page!

---

## 🔐 Login Credentials

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@vignan.edu   | Admin@123  |

> **Note:** Only the admin account is pre-created. Admin can create faculty and student accounts from the dashboard.

---

## 📋 TL;DR — Run After First Setup

Once you've done the initial setup above, running the project again is just:

**Terminal 1 (Backend):**
```bash
cd backend
npm run start:dev
```

**Terminal 2 (Frontend):**
```bash
cd web
npm run dev
```

That's it! Open http://localhost:3000.

---

## 🔄 Reset Database (if needed)

If the database gets corrupted or you want to start fresh:

```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      V-Connect 2.0                          │
├────────────────────┬────────────────────────────────────────┤
│   Frontend         │   Backend                              │
│   Next.js 16       │   NestJS                               │
│   Port 3000        │   Port 4000                            │
├────────────────────┼────────────────────────────────────────┤
│  TailwindCSS       │   REST API (/api/*)                    │
│  Framer Motion     │   WebSockets (Socket.IO)               │
│  Recharts          │   JWT Auth + RBAC                      │
│  shadcn/ui         │   Prisma ORM                           │
│  Lucide Icons      │   SQLite (dev) / PostgreSQL (prod)     │
│                    │   Redis (optional, in-memory fallback) │
├────────────────────┼────────────────────────────────────────┤
│                    │   n8n Webhooks (optional automation)   │
└────────────────────┴────────────────────────────────────────┘
```

### Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Frontend   | Next.js 16, TypeScript, TailwindCSS, shadcn/ui, Framer Motion |
| Backend    | NestJS, TypeScript, Socket.IO                                 |
| Database   | SQLite (dev) / PostgreSQL (prod) + Prisma ORM                 |
| Cache      | Redis (optional, in-memory fallback available)                |
| Auth       | JWT access + refresh tokens, RBAC (role-based access)         |
| Automation | n8n webhooks (optional)                                       |

---

## 📂 Project Structure

```
v-connect-2.0/
├── backend/                  # NestJS REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   ├── seed.ts           # Initial admin user
│   │   └── dev.db            # SQLite database (auto-created)
│   ├── src/
│   │   ├── auth/             # JWT auth, guards, decorators
│   │   ├── users/            # User management (create students/faculty)
│   │   ├── departments/      # Academic departments
│   │   ├── sections/         # Class sections
│   │   ├── regulations/      # Academic regulations (R20, R22)
│   │   ├── subjects/         # Course subjects
│   │   ├── course-offerings/ # Course-faculty assignments
│   │   ├── timetable/        # Timetable slots
│   │   ├── attendance/       # QR Attendance + WebSockets
│   │   ├── exam/             # Exam scripts, marks, results
│   │   ├── announcements/    # Announcements module
│   │   ├── placements/       # TPO/Placements module
│   │   ├── webhooks/         # n8n webhook service
│   │   ├── prisma/           # Prisma service
│   │   └── redis/            # Redis service (with fallback)
│   └── .env                  # Environment variables
├── web/                      # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/page.tsx        # Login
│   │   │   └── dashboard/            # Role-based dashboards
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── layout/              # Dashboard layout
│   │   ├── contexts/                 # Auth context provider
│   │   └── lib/                      # API client, utilities
│   └── .env.local                    # Frontend env vars
├── docs/
│   └── n8n-workflow-guide.md         # n8n setup guide
└── README.md                         # This file
```

---

## 🎯 Core Modules

### 1. Admin Dashboard
- ✅ Manage Departments, Sections, Regulations
- ✅ Register Students & Faculty (set passwords during creation)
- ✅ Create Subjects & Course Offerings
- ✅ Create Timetable for each Section
- ✅ View/Approve/Reject Manual Attendance Requests
- ✅ Analytics Dashboard with Charts
- ✅ Post Announcements
- ✅ Create Placement Drives
- ✅ Change Password

### 2. Faculty Module
- ✅ View assigned course offerings
- ✅ View today's timetable
- ✅ Start QR Attendance Session (5-minute window)
- ✅ Rotating QR tokens every 5 seconds
- ✅ Real-time updates via WebSockets
- ✅ Mark manual attendance (requires admin approval)
- ✅ Topics Taught tracking

### 3. Student Module
- ✅ Dashboard with attendance analytics
- ✅ Scan QR attendance (camera + manual entry)
- ✅ View timetable
- ✅ Attendance percentage by subject
- ✅ View marks & results
- ✅ Apply to Placement Drives
- ✅ Student profile

### 4. Exam Module
- ✅ Create exam sessions
- ✅ Generate barcoded answer scripts
- ✅ Random distribution to faculty
- ✅ Faculty evaluation & marks submission
- ✅ Exam cell verify & lock marks
- ✅ Release results

### 5. TPO/Placements Module (NEW)
- ✅ Create placement drives
- ✅ Student applications with eligibility check
- ✅ Application status tracking (Applied → Shortlisted → Selected/Rejected)
- ✅ Placement statistics

### 6. Announcements (NEW)
- ✅ Admin/HOD create announcements
- ✅ Role-based targeting (all, students only, faculty only)
- ✅ Department filtering

---

## 🔔 n8n Workflow Automation (Optional)

V-Connect can send automated notifications via n8n:

### Setup (optional)
```bash
# Install n8n globally
npm install -g n8n

# Start n8n
n8n start
```

Then update `backend/.env`:
```env
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

### Supported Events

| Event                  | Webhook Path            | Triggered When...           |
|------------------------|-------------------------|-----------------------------|
| Student Created        | /webhook/student-created       | Admin creates student      |
| Faculty Created        | /webhook/faculty-created       | Admin creates faculty      |
| Low Attendance Alert   | /webhook/attendance-low        | Attendance below 75%       |
| Announcement Created   | /webhook/announcement-created  | Admin/HOD posts            |
| Placement Drive        | /webhook/placement-drive-created| New placement opportunity  |
| Results Released       | /webhook/results-released      | Results published          |

> See `docs/n8n-workflow-guide.md` for detailed n8n workflow creation instructions.

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/login           | Login                |
| POST   | /api/auth/refresh         | Refresh token        |
| POST   | /api/auth/logout          | Logout               |
| GET    | /api/auth/me              | Get current user     |
| POST   | /api/auth/change-password | Change password      |

### Users
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/users/students   | Create student       |
| POST   | /api/users/faculty    | Create faculty       |
| GET    | /api/users            | List all users       |

### Announcements
| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| POST   | /api/announcements     | Create (Admin/HOD)        |
| GET    | /api/announcements     | List announcements        |
| DELETE | /api/announcements/:id | Delete                    |

### Placements
| Method | Endpoint                            | Description              |
|--------|-------------------------------------|--------------------------|
| POST   | /api/placements/drives              | Create drive (Admin)     |
| GET    | /api/placements/drives              | List drives              |
| GET    | /api/placements/drives/:id          | Drive details            |
| POST   | /api/placements/drives/:id/apply    | Apply (Student)          |
| GET    | /api/placements/my-applications     | My applications          |
| PATCH  | /api/placements/applications/:id/status | Update status       |
| GET    | /api/placements/drives/stats        | Statistics               |

### Full API Docs
Visit **http://localhost:4000/api/docs** when the backend is running.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=file:./dev.db
JWT_ACCESS_SECRET=vconnect-super-secret-key-change-in-production-2024
JWT_REFRESH_SECRET=vconnect-refresh-secret-key-change-in-production-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000
QR_SESSION_DURATION_SECONDS=300
QR_TOKEN_INTERVAL_SECONDS=5
QR_TOKEN_VALIDITY_SECONDS=6
SESSION_SECRET=vconnect-session-hmac-secret
N8N_ENABLED=false
N8N_WEBHOOK_URL=http://localhost:5678/webhook
FRONTEND_URL=http://localhost:3000
```

### Frontend (`web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 🔧 Troubleshooting

### Backend won't start?
```bash
# Kill any existing Node processes
taskkill /f /im node.exe    # Windows
# OR
killall node                # macOS/Linux

# Then restart
cd backend
npm run start:dev
```

### Port 3000 or 4000 already in use?
```bash
# Windows: Find process on port
netstat -ano | findstr :4000
# Kill by PID
taskkill /pid <PID> /f

# macOS/Linux
lsof -i :4000
kill -9 <PID>
```

### Database errors?
```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

### Frontend "Cannot connect to API"?
- Make sure backend is running first on port 4000
- Check `web/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

---

## 📋 Roles & Permissions (RBAC)

| Feature                    | ADMIN | HOD | FACULTY | STUDENT | EXAM_CELL |
|---------------------------|-------|-----|---------|---------|-----------|
| Manage Departments        | ✅    | ❌   | ❌      | ❌       | ❌        |
| Register Users            | ✅    | ❌   | ❌      | ❌       | ❌        |
| Create Timetable          | ✅    | ❌   | ❌      | ❌       | ❌        |
| Post Announcements        | ✅    | ✅   | ❌      | ❌       | ❌        |
| Create Placement Drives   | ✅    | ❌   | ❌      | ❌       | ❌        |
| Start QR Session          | ❌    | ✅   | ✅      | ❌       | ❌        |
| Mark QR Attendance        | ❌    | ❌   | ❌      | ✅       | ❌        |
| Apply to Placements       | ❌    | ❌   | ❌      | ✅       | ❌        |
| Create Exam Session       | ✅    | ❌   | ❌      | ❌       | ✅        |
| Submit Marks              | ❌    | ✅   | ✅      | ❌       | ✅        |
| Verify/Lock Marks         | ✅    | ❌   | ❌      | ❌       | ✅        |
| View Own Marks            | ❌    | ❌   | ❌      | ✅       | ❌        |
| Change Password           | ✅    | ✅   | ✅      | ✅       | ✅        |

---

Built with ❤️ for Vignan Group of Institutions (VGNT)
