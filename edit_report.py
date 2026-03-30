import re

with open("report.md", "r", encoding="utf-8") as f:
    text = f.read()

# Remove mentions from ABSTRACT
text = re.sub(r'an end-to-end examination administration module leveraging cryptographic barcode assignment for blind evaluation, and a Training & Placement \(TPO\) dashboard tracking dynamic student placement pipelines\.',
              r'and a seamless Online Classes module equipping faculty with built-in interactive whiteboards to ensure dynamic educational continuity.', text)

# Remove Table of Contents items
text = re.sub(r'6\.4 Advanced Examination & Marks Processing\n6\.5 Code Arena & Skill Development Module\n6\.6 Placement Drive Tracking System\n6\.7 Implementation Stack Overview',
              r'6.4 Online Classes & Virtual Learning Engine\n6.5 Administrative Attendance Overrides & Audits\n6.6 Semester Promotion & Alumni Archiving\n6.7 Implementation Stack Overview', text)

# Adjust Scope
text = re.sub(r'- Specialized Controller of Examinations workflows\.',
              r'- Deep Online Classroom logic with faculty execution roles.', text)

text = re.sub(r', exams are distributed physically leading to tampering risks,', '', text)

# Problem statement adjustments
text = re.sub(r'examination integrity, and', 'virtual classroom continuity, and', text)

# Remove Architecture Solutions
text = re.sub(r'2\. \*\*Blind Examination Execution\*\*: V-Connect auto-generates randomized crypto-secure barcodes for answer scripts\. The evaluator only submits marks against the barcode, preventing bias\.\n3\. \*\*Unified Application Triggers\*\*: The Placements dashboard filters drives exclusively to eligible students \(via branch filters and minimum CGPA criteria calculations\) allowing native one-click applying\.',
              r'2. **Session-Locked Attendance Auditing**: Attendance modifications are programmatically impossible post-class, except by explicitly authorized Administrative overrides.\n3. **Native Virtual Classrooms**: Avoids fragmented Zoom links by utilizing a natively integrated video framework complete with Host-only whiteboard tools.', text)

# Remove Placement flow rule
text = re.sub(r'- \*\*FR3 \(Placement Flow\)\*\*: Students MUST be able to view drives, while Admins MUST possess the UI to move applications sequentially through \[APPLIED\] -> \[SHORTLISTED\] -> \[SELECTED\]\.',
              r'- **FR3 (Virtual Classes)**: Faculty MUST be able to launch online digital classrooms wherein they retain Host privileges like Mute All and Interactive Canvas sharing.', text)

# Erase Exam Answer Schema
text = re.sub(r'- \*\*Exam Answer Scripts\*\*: Possesses unique Barcode schemas avoiding mapped Student ID linkages inherently until final result locking\.',
              r'- **Online Class Entity**: Maps individual scheduled virtual streams alongside Platform rules and scheduled runtime arrays.', text)

# Replace Chapter 6 contents 6.4, 6.5, 6.6 with Online Classes and Promotion
ch_old = r'### 6\.4 Advanced Examination.*### 6\.7 Groups & AI Plagiarism Check Module.*?---'
ch_new = """### 6.4 Administrative Attendance Overrides
While faculty members execute daily attendance logs within a tightly regulated temporal window, errors occur. The system implements a separate secure pathway exclusively accessible by the `ADMIN` role. This overrides the intrinsic `isLocked` Boolean flag associated with past Attendance Sessions, allowing administrative clerks to manually rectify anomalies without globally unprotecting the architectural flow.

### 6.5 Virtual Classroom & Host Emulation
Bypassing the requirement for external video conferencing subscriptions, V-Connect 2.0 incorporates `VConnectClassroom` — a natively built React component. Using browser MediaDevices APIs, it broadcasts audio/visual channels. The component actively interprets the `isHost` prop, granting Faculty users explicit UI actions: an interactive Whiteboard overlay and global 'Mute All' triggers, features fundamentally un-renderable in a Student's DOM.

### 6.6 Semantic Semester Promotion & Archiving
A uniquely complex problem involves migrating academic data seamlessly between years. The implemented Promotion Module queries explicitly targeted student datasets and transacts database updates shifting their `currentSemester` integers. Crucially, as students breach the 8th semester, the algorithm gracefully rewrites their fundamental system `UserRole` from `STUDENT` to `ALUMNI`, archiving their status while retaining historical analytical records intact.

---"""
text = re.sub(ch_old, ch_new, text, flags=re.DOTALL)

# System Testing adjustments
text = re.sub(r'The examination pipeline successfully navigated from Admin generation -> Script barcoding -> Faculty Submission Phase -> Exam Cell Validation -> Permanent Result release',
              r'The academic lifecycle effectively triggered from Timetable generation -> Attendance Locking -> Semester Promotion -> Alumni archiving', text)

# Results Adjustment
text = re.sub(r'- \*\*Blind Integrity Secured\*\*: The examination module completely obscured identifiable student variables prior to grade locking\.',
              r'- **Hierarchical Dominance Maintained**: The `isHost` variables properly localized rendering logic for faculty inside video streams, maintaining strict application state.', text)

# Replace old PPT modules from Table of Contents Section
with open("report_edited.md", "w", encoding="utf-8") as f:
    f.write(text)
