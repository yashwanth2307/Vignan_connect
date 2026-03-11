# n8n Workflow Setup Guide for V-Connect
## Complete Step-by-Step Instructions

---

## 🔧 Pre-requisites
- n8n is running at: **http://localhost:5678**
- V-Connect Backend is running at: **http://localhost:4000**
- V-Connect Frontend is running at: **http://localhost:3000**
- `N8N_ENABLED=true` is set in `backend/.env`

---

## Step 1: Login to n8n

1. Open **http://localhost:5678** in your browser
2. Sign in with the email and password you created during n8n's first setup
3. If you forgot the password, stop n8n (`Ctrl+C`), delete the database:
   ```bash
   # Delete n8n data and restart fresh
   del "%USERPROFILE%\.n8n\database.sqlite"
   n8n start
   ```
   This will show the setup page again where you create a new account.

---

## Step 2: Create Workflow — "Student Account Created Notification"

### 2.1 Create New Workflow
1. After login, you'll see the **n8n Dashboard**
2. Click the **"Add workflow"** button (top-right corner)
3. You'll see an empty canvas with a **"+" button** in the center

### 2.2 Add Webhook Trigger Node
1. Click the **"+" button** on the canvas
2. In the search box, type **"Webhook"**
3. Click on **"Webhook"** to add it
4. A configuration panel opens on the right side:
   - **HTTP Method**: Select `POST` from dropdown
   - **Path**: Type `student-created`
   - You'll see two URLs:
     - **Test URL**: `http://localhost:5678/webhook-test/student-created` (for testing)
     - **Production URL**: `http://localhost:5678/webhook/student-created` (when workflow is active)
5. Click **"Back to canvas"** (or the X button)

### 2.3 Add an Action Node (Choose ONE of these options)

#### Option A: Send Email (requires SMTP setup)
1. Click the **"+"** button after the Webhook node
2. Search for **"Send Email"**
3. Click on it → it will ask you to set up SMTP credentials:
   - **SMTP Server**: `smtp.gmail.com` (for Gmail)
   - **Port**: `587`
   - **User**: Your Gmail address
   - **Password**: Your Gmail App Password (NOT your regular password)
     - Go to https://myaccount.google.com/apppasswords to generate one
   - **SSL/TLS**: Check the box
4. Configure the email:
   - **From Email**: `your-email@gmail.com`
   - **To Email**: Use expression → click the ⚡ icon → `{{ $json.data.email }}`
   - **Subject**: `Welcome to V-Connect - Account Created`
   - **Body** (HTML):
     ```html
     <h2>Welcome to V-Connect!</h2>
     <p>Hello {{ $json.data.name }},</p>
     <p>Your student account has been created successfully.</p>
     <ul>
       <li><b>Email:</b> {{ $json.data.email }}</li>
       <li><b>Roll No:</b> {{ $json.data.rollNo }}</li>
       <li><b>Department:</b> {{ $json.data.department }}</li>
       <li><b>Section:</b> {{ $json.data.section }}</li>
     </ul>
     <p>Login at: <a href="http://localhost:3000/login">V-Connect Portal</a></p>
     ```

#### Option B: Log to Console (Simple — good for testing)
1. Click the **"+"** button after the Webhook node
2. Search for **"Code"**
3. Click **"Code"** node
4. In the code editor, paste:
   ```javascript
   const data = $input.all()[0].json;
   console.log('🎉 Student Created:', data.data.name, data.data.email);
   return $input.all();
   ```

#### Option C: Send Telegram Message
1. Click **"+"** → search **"Telegram"**
2. You need:
   - **Bot Token**: Create a bot via @BotFather on Telegram
   - **Chat ID**: Your channel/group ID
3. In **Message Text**:
   ```
   🎓 New Student Registered!
   Name: {{ $json.data.name }}
   Email: {{ $json.data.email }}
   Roll No: {{ $json.data.rollNo }}
   Department: {{ $json.data.department }}
   ```

### 2.4 Test the Workflow
1. Click **"Test workflow"** button (at the bottom of the canvas)
2. n8n will start listening on the **Test URL**
3. Now go to V-Connect Admin Dashboard (http://localhost:3000)
4. Login as admin (`admin@vignan.edu` / `Admin@123`)
5. Go to **Users** → Create a Student
6. Fill in details and submit
7. Go back to n8n — you should see the webhook received data!
8. The data will show in the node output panel

### 2.5 Activate the Workflow
1. After testing works, click the **"Active"** toggle at the top-right (switch it ON)
2. Name your workflow: "Student Created Notification"
3. Click **Save** (Ctrl+S)
4. Now the **Production URL** is live and V-Connect will send events automatically

---

## Step 3: Create Workflow — "Low Attendance Alert"

### 3.1 Create New Workflow
1. Go to n8n Dashboard → Click **"Add workflow"**

### 3.2 Add Webhook Node
1. Click **"+"** → search **"Webhook"**
2. Set **HTTP Method** = `POST`
3. Set **Path** = `attendance-low`

### 3.3 Add Email/Telegram Node
- **Subject**: `⚠️ Low Attendance Alert`
- **Body**:
  ```
  Dear {{ $json.data.studentName }},

  Your attendance in {{ $json.data.subject }} is {{ $json.data.attendancePercentage }}%.
  The minimum required attendance is 75%.

  {{ $json.data.message }}

  Please ensure regular attendance to avoid debarment.

  Regards,
  V-Connect Admin
  ```
- **To**: `{{ $json.data.studentEmail }}`

### 3.4 Activate & Save
- Toggle **Active** ON → Save as "Low Attendance Alert"

---

## Step 4: Create Workflow — "Announcement Notification"

### 4.1 Add Webhook Node
- Path = `announcement-created`

### 4.2 Add Action Node
- **Subject**: `📢 {{ $json.data.title }}`
- **Body**:
  ```
  📢 New Announcement

  Title: {{ $json.data.title }}
  
  {{ $json.data.message }}
  
  Posted by: {{ $json.data.createdBy }}
  For: {{ $json.data.targetRole || 'Everyone' }}
  ```

---

## Step 5: Create Workflow — "Placement Drive Notification"

### 5.1 Add Webhook Node
- Path = `placement-drive-created`

### 5.2 Add Action Node
- **Subject**: `🎯 Placement Drive: {{ $json.data.companyName }}`
- **Body**:
  ```
  🎯 New Placement Opportunity!

  Company: {{ $json.data.companyName }}
  Role: {{ $json.data.role }}
  Package: {{ $json.data.package }} LPA
  Eligible Branches: {{ $json.data.eligibleBranches }}
  Deadline: {{ $json.data.deadline }}

  Apply now at V-Connect Portal!
  ```

---

## Step 6: Create Workflow — "Results Released"

### 6.1 Add Webhook Node
- Path = `results-released`

### 6.2 Add Action Node
- **Subject**: `📊 Exam Results Released`
- **Body**:
  ```
  📊 Results Released!

  Exam Type: {{ $json.data.examType }}
  Total Students: {{ $json.data.totalStudents }}
  Released At: {{ $json.data.releasedAt }}

  Check your results at: http://localhost:3000/login
  ```

---

## Step 7: Create Workflow — "Faculty Created"

### 7.1 Add Webhook Node
- Path = `faculty-created`

### 7.2 Add Action Node
- **Subject**: `Welcome to V-Connect - Faculty Account`
- **Body**:
  ```
  Hello {{ $json.data.name }},

  Your faculty account has been created.
  Email: {{ $json.data.email }}
  Employee ID: {{ $json.data.empId }}
  Department: {{ $json.data.department }}

  Login at: http://localhost:3000/login
  ```

---

## 📊 Summary of All 6 Workflows

| # | Workflow Name                  | Webhook Path           | Trigger Event              |
|---|-------------------------------|------------------------|---------------------------|
| 1 | Student Created Notification  | `student-created`      | Admin creates student     |
| 2 | Low Attendance Alert          | `attendance-low`       | Student < 75% attendance  |
| 3 | Announcement Notification     | `announcement-created` | Admin/HOD posts announcement |
| 4 | Placement Drive Notification  | `placement-drive-created` | Admin creates drive    |
| 5 | Results Released              | `results-released`     | Results are published     |
| 6 | Faculty Created               | `faculty-created`      | Admin creates faculty     |

---

## 🔧 Troubleshooting

### Webhook not receiving data?
1. Make sure `N8N_ENABLED=true` in `backend/.env`
2. Make sure the workflow is **Active** (toggle ON)
3. Restart the backend after changing `.env`:
   ```bash
   # Stop and restart backend
   cd backend
   npm run start:dev
   ```

### Gmail not sending?
1. Use **App Password**, not your regular password
2. Go to https://myaccount.google.com/apppasswords
3. Create app password for "Mail" → use that in n8n SMTP credentials

### Want to test without email?
1. Use the **"Code"** node instead of email
2. Use `console.log()` to see the webhook data in n8n's output panel
3. Or use **"Respond to Webhook"** node to see data directly

---

## 🌐 URLs Reference

| Service          | URL                              |
|-----------------|----------------------------------|
| V-Connect Frontend  | http://localhost:3000         |
| V-Connect Backend   | http://localhost:4000         |
| V-Connect API Docs  | http://localhost:4000/api/docs |
| n8n Dashboard       | http://localhost:5678         |
| n8n Webhook Base    | http://localhost:5678/webhook |
