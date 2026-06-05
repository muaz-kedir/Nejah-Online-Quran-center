# Nejah Admin Dashboard — Implementation Roadmap

Based on a thorough analysis of the **SRS (Nejah.pdf)** and the entire project codebase, this document outlines:

1. **What's already implemented** (baseline)
2. **What's missing vs the SRS** (must implement)
3. **Future / premium features** (beyond SRS, nice-to-have)

---

## 1. What Already Exists

### Admin Routes & Pages

| Route | Page | Status |
|---|---|---|
| `/dashboard` | Main dashboard — stat cards, recent students, staff overview, today's classes, system alerts | ✅ Implemented (hardcoded data on cards) |
| `/students` | Student CRUD — list, add, edit, delete, assign, details, reset password | ✅ Fully implemented |
| `/teachers` | Teacher listing + filters | ✅ Listing done |
| `/teachers/create` | Create teacher form | ✅ Implemented |
| `/teachers/$id` | Teacher profile + schedule view | ✅ Implemented |
| `/teachers/$id/schedule/$day` | Edit daily schedule | ✅ Implemented |
| `/parents` | Parent CRUD — list, add, edit, delete, view | ✅ Fully implemented |
| `/users` | User management (super_admin only) — list, add, edit, delete, toggle-active | ✅ Fully implemented |
| `/admins` | Admin management (super_admin only) — list cards only, no add modal | ⚠️ Partial (no Create) |
| `/schedules` | Schedule listing — table only, no CRUD modals | ⚠️ Partial (view-only) |
| `/attendance` | Live session tracking + attendance management | ✅ Feature-rich |
| `/progress` | Student progress tracking + feedback | ✅ Fully implemented |
| `/homework` | Homework CRUD by student | ✅ Fully implemented |
| `/analytics` | Static analytics — hardcoded metrics, chart placeholders | ⚠️ Partial |
| `/reports` | Report listing UI — no actual report generation | ⚠️ Partial |
| `/settings` | Settings UI — no API integration (frontend-only) | ⚠️ Partial |
| `/messages` | Mock chat UI — no backend, no real messages | ⚠️ Partial |

### Backend API Coverage

| Module | Endpoints | Status |
|---|---|---|
| Auth | login, register, forgot-password, profile | ✅ Complete |
| Users | CRUD, toggle-active, change-password, findByRole | ✅ Complete |
| Students | CRUD, stats, delegate, reset-password | ✅ Complete |
| Teachers | CRUD, stats, analytics, dashboard-stats, assign-students | ✅ Complete |
| Parents | CRUD, stats, getParentStudents | ✅ Complete |
| Schedules | CRUD, query by student/teacher/day | ✅ Complete |
| Attendance | Sessions, start/end meeting, record, live-classes, today-sessions, student history/stats | ✅ Complete |
| Progress | Get progress, get feedback, log progress, add feedback | ✅ Complete |
| Homework | CRUD, update status | ✅ Complete |
| Notifications | List, mark-as-read | ✅ Complete |
| Exams | **Empty stub — no controller, service, or entity** | ❌ Missing |
| Chat | **Empty stub — no controller, service, or entity** | ❌ Missing |
| Finance/Payments | **Nothing exists — no module, no entity, no routes** | ❌ Missing |

---

## 2. SRS Gaps — What Must Be Implemented

### 2.1 Admin Dashboard (`/dashboard`)

**SRS §16 requires:**
- Total students, total teachers, active classes — ✅ (done, but uses hacky/computed values)
- **Attendance summary** — ⚠️ Partial (hardcoded 94.5%)
- **Performance summary** — ❌ Missing
- **Recent activities** — ❌ Missing
- **Financial overview** — ❌ Missing (no finance module at all)
- **Active sessions** — ❌ Missing (should show currently live Zoom sessions)
- **Zoom session analytics** — ❌ Missing
- **Student engagement statistics** — ❌ Missing

**Needs:**
- Backend endpoint: `GET /api/dashboard/admin` returning real aggregated stats
- Real-time active session count from Zoom integration
- Financial summary box (once finance module exists)
- Recent activity feed (audit log)
- Performance/engagement charts

---

### 2.2 Student Management (`/students`)

**SRS §5 requires:**
- Add/Edit/Delete student — ✅ Done
- Assign teacher — ✅ Done
- Assign level — ✅ Done (QuranLevel enum)
- Assign class schedule — ⚠️ Partial (no direct schedule assignment from student page)
- Activate/deactivate student — ⚠️ Partial (no toggle on student page; only in Users)
- **Transfer student between teachers** — ❌ Missing (backend `delegate` exists, no frontend UI)
- **Archive student records** — ❌ Missing
- **Track student learning status** — ❌ Missing
- Student Profile Fields: full name, age, gender, parent info, level, assigned teacher, enrollment date, status, notes, country, timezone, learning goals, emergency contact — ⚠️ Partial (some fields exist in entity but not all exposed in UI)

**Needs:**
- Transfer student modal/action between teachers
- Archive/restore functionality
- Student learning status timeline view
- Full profile view with all SRS fields

---

### 2.3 Teacher Management (`/teachers`)

**SRS §6 requires:**
- Add/Edit/Delete teacher — ✅ Done
- Assign students — ✅ Done (backend assign-students endpoint exists)
- Assign schedule — ✅ Done
- **Track performance** — ❌ Missing
- **Monitor attendance** — ❌ Missing (teacher attendance not tracked)
- **Monitor teaching sessions** — ⚠️ Partial (can view sessions, no aggregated view)
- **Manage teacher availability** — ⚠️ Partial (schedule exists, availability UI missing)
- Teacher Profile: Name, qualification, experience, assigned students, availability, status, country, languages, specialization, teaching rating — ⚠️ Partial

**Needs:**
- Teacher performance metrics (classes taught, punctuality, student progress)
- Teacher attendance tracking
- Availability management UI (work hours, time off)
- Teaching rating/review system

---

### 2.4 Parent Management (`/parents`)

**SRS §15 requires (Parent Portal — relevant to admin setup):**
- Admin should be able to see parent-student relationships — ✅ Done (getParentStudents)
- SRS requires parents to view child progress, attendance, teacher notes, recitations, session recordings, homework, exam results — ✅ Student-side UI exists, parent-side exists too

**Needs (admin-side):**
- Parent-student relationship management in admin panel
- View parent activity / login history
- Parent communication preferences (WhatsApp/SMS/Email opt-in)

---

### 2.5 Live Class Sessions (`/attendance`, backend)

**SRS §7 requires:**
- Start live session, generate Zoom link — ✅ Partial (backend can create sessions, Zoom integration is basic)
- Schedule/reschedule/cancel sessions — ✅ Done
- **Track session start/end time automatically** — ⚠️ Partial (manual end, not auto-detected)
- **Calculate total duration** — ⚠️ Partial (backend stores times but not always computed)
- **Auto-track attendance** — ❌ Missing (teacher marks attendance manually)
- **Detect missed sessions** — ❌ Missing
- **Store recording links** — ❌ Missing (no recording link field in use)
- **Live session analytics** — ❌ Missing
- Session details: Session ID, teacher, student, meeting link, start/end time, duration, attendance, notes, recording link — ⚠️ Partial

**Needs:**
- Zoom API deep integration (auto-create meetings, webhooks for start/end)
- Auto-mark attendance via Zoom join/leave events
- Recording link storage and management
- Missed session detection and auto-notification
- Session analytics (duration trends, attendance rates)

---

### 2.6 Quran Progress Tracking (`/progress`)

**SRS §8 requires:**
- Record memorization progress (Surah, Ayah, Juz) — ✅ Done
- Tajweed notes, mistakes, revision — ⚠️ Partial
- Set memorization targets — ❌ Missing
- Evaluate pronunciation, fluency, Tajweed accuracy — ❌ Missing (no scoring system)
- Track: Daily progress, weekly progress, revision cycles, weak areas — ❌ Missing
- Tajweed evaluation scores, fluency scores — ❌ Missing

**Needs:**
- Target/goal setting for memorization
- Scoring/evaluation rubrics for pronunciation, fluency, Tajweed
- Progress charts (weekly/monthly trends)
- Weak area identification and reporting
- Revision cycle tracking

---

### 2.7 Attendance Management

**SRS §9 requires:**
- Mark present/absent/late — ✅ Done
- Calculate attendance percentage — ✅ Done
- **Generate attendance report** — ⚠️ Partial (stats exist, no PDF export)
- Show monthly attendance — ✅ Done (backend student stats)
- **Notify parents for absence** — ❌ Missing
- **Track live session attendance** — ⚠️ Partial (manual, not automatic)
- **Generate attendance analytics** — ❌ Missing
- **Detect repeated absences** — ❌ Missing

**Needs:**
- Automated absence notifications (via Notification module)
- Repeated absence alerts
- Attendance analytics dashboard (charts, trends)
- PDF/Excel export for attendance reports

---

### 2.8 Class Scheduling (`/schedules`)

**SRS §10 requires:**
- Create/edit/delete schedule — ✅ Done (backend complete)
- Assign teacher/student — ✅ Done
- Add meeting link — ✅ Done
- **Set recurring classes** — ❌ Missing
- **Timezone scheduling** — ❌ Missing
- **Reschedule classes** — ⚠️ Partial (edit exists, reschedule workflow missing)

**Also:**
- Admin page (`/schedules`) currently has **no create/edit/delete modals** — only a table view
- Schedules page needs full CRUD modal implementation

**Needs:**
- Recurring schedule support (weekly, bi-weekly, etc.)
- Timezone-aware scheduling UI
- Reschedule workflow with conflict detection
- Full CRUD modals on the admin schedules page

---

### 2.9 Homework Management (`/homework`)

**SRS §11 requires:**
- Assign homework, set due date, add instructions, upload attachments — ✅ Partial
- Student: View, submit, upload files, view feedback — ❌ Missing student submission flow
- Teacher: Review, add feedback, grade, track completion — ⚠️ Partial (add feedback exists, grading missing)

**Needs:**
- File attachment upload for homework assignments
- Student submission portal (upload files)
- Teacher grading/review interface with scores
- Homework completion tracking dashboard

---

### 2.10 Audio & Video Recitation System

**SRS §12 requires:**
- Student upload recitation audio/video — ❌ Missing
- View video history, feedback history — ❌ Missing
- Teacher: Listen/review, add corrections, rate performance, save feedback, Tajweed corrections, evaluate fluency — ❌ Missing
- Store recitation history, generate performance history — ❌ Missing

**This is a major missing feature.** Needs:
- Backend: Recitation entity (audio/video file, studentId, teacherId, date, score, feedback, corrections)
- Frontend: Student upload portal, teacher review/feedback interface, admin oversight panel

---

### 2.11 Exam & Evaluation

**SRS §13 requires:**
- Weekly/monthly tests, memorization test, Tajweed test, oral evaluation, final exams — ❌ Missing
- Enter marks, add comments, publish result — ❌ Missing
- Performance, report, rankings, evaluation analytics — ❌ Missing

**Current state:** Exams module is an **empty stub** in the backend — no controller, service, or entity.

**Needs:**
- Backend: Exam entity, results entity, grading logic
- Frontend: Exam creation, student exam portal, grading interface, results dashboard

---

### 2.12 Communication System (`/messages`)

**SRS §14 requires:**
- Teacher ↔ Parent chat — ❌ Missing
- Teacher ↔ Admin chat — ❌ Missing
- Parent ↔ Admin chat — ❌ Missing
- Student ↔ Teacher chat — ❌ Missing
- Announcements — ❌ Missing
- Notifications — ✅ Backend exists, frontend integration missing
- File sharing, voice notes — ❌ Missing
- Read receipts, search messages — ❌ Missing

**Current state:** Chat module is an **empty stub** in the backend. Frontend `/messages` is a static mock.

**Needs:**
- Backend real-time chat (Socket.IO or similar)
- Full messaging UI with conversations, typing indicators, read receipts
- File/voice note upload
- Announcements system (admin broadcast)
- Integration with Notification module

---

### 2.13 Reports & Analytics (`/reports`, `/analytics`)

**SRS §17 requires:**
- Student progress report — ❌ Missing (no PDF/Excel export)
- Teacher performance report — ❌ Missing
- Attendance report — ❌ Missing
- Memorization report — ❌ Missing
- Monthly report — ❌ Missing
- Session analytics report — ❌ Missing
- Financial report — ❌ Missing (no finance module)
- Exam report — ❌ Missing (no exam module)
- Export PDF, export Excel, print reports — ❌ Missing

**Needs:**
- Backend report generation (PDF/Excel) using libraries like `pdfkit`, `exceljs`
- Frontend report viewer with export buttons
- Scheduled report generation (monthly email)

---

### 2.14 Notification System

**SRS §18 requires:**
- Class reminder, homework reminder, absence notification, new message alert, exam notification, payment reminder, session reminder, Zoom meeting reminder — ❌ Mostly missing
- In-app, email, WhatsApp, SMS notifications — ⚠️ Partial (in-app entity exists, no integration)

**Current state:** Backend `Notification` entity exists with list/mark-as-read endpoints. No actual notification sending logic.

**Needs:**
- Email integration (Nodemailer / SendGrid)
- WhatsApp API integration
- SMS integration (Twilio)
- Scheduled notification jobs (cron)
- Frontend notification bell with real-time updates

---

### 2.15 Finance & Payment Management

**SRS §20 requires:**
- Fee structures — ❌ Missing
- Generate invoices — ❌ Missing
- Track payments — ❌ Missing
- Record expenses — ❌ Missing
- Financial reports — ❌ Missing
- Parent: View invoices, payment history, pay online — ❌ Missing
- Receipts, payment reminders, overdue tracking — ❌ Missing

**This is entirely missing.** Needs full module:
- Backend: `Fee`, `Invoice`, `Payment`, `Expense` entities + controllers/services
- Payment gateway integration (Stripe, PayPal, or local)
- Frontend: Admin fee management, parent payment portal, invoice generation

---

### 2.16 Session Recordings Management

**SRS §21 requires:**
- Store session recordings, allow playback, save Zoom recording links — ❌ Missing
- Archive recordings, track recording history — ❌ Missing
- Teacher upload/share recordings — ❌ Missing
- Parent view recordings — ❌ Missing

**Needs:**
- Backend: Recording entity linked to sessions
- Zoom recording webhook integration (auto-fetch recordings)
- Frontend: Recording library with playback

---

### 2.17 File & Media Management

**SRS §22 requires:**
- Upload/download/preview files — ✅ Partial (upload endpoint exists — images only, 5MB limit)
- Support: Audio, video, PDF, images, homework attachments, session recordings — ⚠️ Partial

**Needs:**
- Increase file type support and size limits
- File preview components (PDF viewer, audio/video player)
- File library/organizer for admin

---

### 2.18 Audit Logs & System Monitoring

**SRS §23 requires:**
- Login history, user activities, attendance/progress/payment updates, deleted records, file uploads — ❌ Missing

**Needs:**
- Backend: Audit log entity + interceptor/guard to auto-log actions
- Frontend: Admin audit log viewer with filters

---

### 2.19 Calendar & Event Management

**SRS §25 requires:**
- Class calendar, exams, holidays, upcoming sessions — ❌ Missing
- Recurring schedules, timezone conversion — ❌ Missing (mentioned above in scheduling)

**Needs:**
- Full calendar view component (e.g., FullCalendar library)
- Event CRUD for holidays, exams, announcements
- Integration with schedule data

---

### 2.20 Role-Based Access Control

**SRS §19 requires:**
Super Admin: Full access — ✅ Most features accessible
Admin: Manage users, system, schedules, reports — ⚠️ Partial
Teacher: Manage students, record progress, conduct live classes, manage homework — ✅ Largely done
Student: View lessons, submit recitation, attend live sessions, view progress — ⚠️ Partial
Parent: Monitor student, view reports, communicate — ⚠️ Partial

**Needs:**
- Fine-grained permission system (beyond role-level)
- Permission-based UI rendering (hide buttons/links user can't access)

---

### 2.21 Parent Portal (Admin's role in setting up)

**SRS §15 requires parents to access:**
- Child progress, attendance, teacher notes, recitations, session recordings — ❌ Missing
- Chat with teacher, notifications, schedules, homework, exam results, monitor performance — ❌ Missing

**Needs:**
- Parent portal fully wired to real data (some UI exists but uses mock data)
- All missing features listed above

---

## 3. Implement Now — Priority Order (Admin Dashboard Focus)

Based on the SRS requirements and current state, here is the **recommended implementation order** for the admin dashboard:

### Phase 1 — Core Admin Dashboard Enhancements (1-2 weeks)
- [ ] **Real dashboard API** — `GET /api/dashboard/admin` returning real aggregated stats (student/teacher counts, active classes, attendance rate, recent activity)
- [ ] **Live active sessions widget** — Show currently live Zoom sessions on dashboard
- [ ] **Student/teacher transfer workflow** — Frontend UI for reassigning students between teachers
- [ ] **Schedules page full CRUD** — Add create/edit/delete modals to `/schedules`
- [ ] **Admins page — Add Admin modal** — Wire up the missing create flow

### Phase 2 — Reporting & Analytics (2-3 weeks)
- [ ] **Backend report generation** — PDF export for attendance, progress, student list
- [ ] **Analytics page — real charts** — Replace placeholders with real data using recharts
- [ ] **Attendance analytics dashboard** — Charts for daily/weekly/monthly trends

### Phase 3 — Exams & Recitation Module (3-4 weeks)
- [ ] **Exams module** — Backend entities + CRUD, frontend exam creation/grading/results
- [ ] **Recitation module** — Audio/video upload, teacher review/scoring interface

### Phase 4 — Communication & Notifications (2-3 weeks)
- [ ] **Real-time chat** — Socket.IO backend + frontend messaging UI
- [ ] **Notification engine** — Email integration, automated reminders, WhatsApp/SMS

### Phase 5 — Finance Module (3-4 weeks)
- [ ] **Fee structures & invoicing** — Backend entities + admin management UI
- [ ] **Payment gateway integration** — Online payment processing
- [ ] **Financial reports & dashboards**

### Phase 6 — Polish & Advanced Features (2-3 weeks)
- [ ] **Audit log viewer** — Admin activity monitoring
- [ ] **Calendar view** — FullCalendar integration
- [ ] **Zoom deep integration** — Webhooks, auto-recordings, attendance sync
- [ ] **Permission system** — Fine-grained RBAC
- [ ] **Session recordings library**

---

## 4. Futuristic / Premium Features (Beyond SRS)

These features would differentiate the platform and add significant value:

### 4.1 AI-Powered Features
- **AI Tajweed Correction** — Analyze student recitation audio and auto-detect Tajweed errors using ML
- **AI Memorization Assistant** — Smart spaced-repetition system for Quran memorization
- **AI Performance Insights** — Predictive analytics for student success/risk
- **AI Teacher Assistant** — Auto-generate lesson plans, homework, and progress notes
- **AI Chatbot** — 24/7 assistant for parents/students answering queries about schedules, progress, etc.

### 4.2 Gamification & Engagement
- **Leaderboards** — Student rankings by memorization progress, attendance, test scores
- **Badges & Achievements** — Milestone badges (e.g., "Completed 5 Juz", "Perfect Attendance Month")
- **Streak Tracking** — Daily learning streaks with rewards
- **Interactive Quran Map** — Visual Juz/Surah progress with completion percentage

### 4.3 Advanced Communication
- **Video/Audio Calls** — In-platform calling (not just Zoom)
- **Community Forum** — Student/teacher discussion boards
- **Broadcast System** — Admin announcements to all/parents/teachers
- **Multilingual Real-time Translation** — Auto-translate messages between languages

### 4.4 Advanced Analytics & BI
- **Custom Report Builder** — Drag-and-drop report configuration
- **Data Export API** — REST API for external BI tools (Power BI, Tableau)
- **Trend Forecasting** — Predict enrollment, attendance, performance trends
- **Teacher Effectiveness Score** — Algorithmic rating based on student outcomes

### 4.5 Mobile & Accessibility
- **Mobile App** — React Native / Flutter mobile apps for all roles
- **Offline Mode** — Download lessons, homework, and recitations for offline access
- **Dark Mode** — ✅ Already done
- **Voice Navigation** — Screen reader optimization, voice commands
- **RTL Support** — Full Arabic UI layout

### 4.6 Operational Excellence
- **Multi-branch/Multi-campus** — Support multiple physical/digital branches
- **Batch Management** — Group students into batches/classes with shared schedules
- **Substitute Teacher Management** — Emergency teacher replacement workflow
- **Automated Parent-Teacher Meetings** — Scheduled quarterly video conferences
- **Document Management** — ID cards, certificates, report cards generation

### 4.7 Integration Ecosystem
- **LMS Integration** — Moodle/Google Classroom sync
- **CRM Integration** — HubSpot/Salesforce for lead management
- **Accounting Software Sync** — QuickBooks/Xero integration
- **Calendar Sync** — Google/Outlook calendar sync for schedules
- **SSO Integration** — Google, Microsoft, Apple login

### 4.8 Security & Compliance
- **GDPR/Data Privacy Compliance** — Data export/delete, consent management
- **Advanced 2FA** — TOTP, hardware key support
- **IP-based Access Control** — Restrict by IP range
- **Data Retention Policies** — Automated data archiving

---

## 5. Architecture Notes & Improvements

### Current Issues to Fix
1. **Hardcoded API URL** — `http://localhost:3000/api` is scattered across every route file. Move to a shared config / env variable.
2. **No global API client** — Every page has its own `fetch()` calls. Create a shared Axios/fetch wrapper with auth header injection.
3. **Auth stored in localStorage** — Switch to httpOnly cookies or at least use a dedicated auth context/provider.
4. **Duplicate attendance entities** — `SessionMeeting` + `StudentSessionAttendance` seems to overlap with `ClassSession` + `StudentAttendance`. Consolidate.
5. **No loading skeletons** — Most pages just show "Loading..." text. Use skeleton components.
6. **No error boundaries** — API failures crash pages silently.

### Recommended Architecture Improvements
1. **Shared API client** (`lib/api.ts`) — Centralized with auth interceptor
2. **React Query hooks** per feature — Move data fetching to custom hooks in `hooks/`
3. **Reusable table component** — Generic sortable/filterable/paginated table
4. **Form components** — Reusable form wrapper with validation
5. **Permission-based rendering** — `can(permission)` utility for hiding/showing UI
