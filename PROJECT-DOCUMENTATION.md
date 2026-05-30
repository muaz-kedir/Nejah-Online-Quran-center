# Nejah Online Quran Center — Full Project Documentation

> **Backend:** NestJS (TypeScript) + TypeORM/PostgreSQL  
> **Frontend:** TanStack Start (React 19) + TanStack Router + Tailwind CSS v4 + shadcn/ui

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Backend Architecture](#2-backend-architecture)
   - 2.1 [Configuration](#21-configuration)
   - 2.2 [Entry Points](#22-entry-points)
   - 2.3 [Common Module](#23-common-module)
   - 2.4 [Database Module](#24-database-module)
   - 2.5 [Auth Module](#25-auth-module)
   - 2.6 [Users Module](#26-users-module)
   - 2.7 [Students Module](#27-students-module)
   - 2.8 [Teachers Module](#28-teachers-module)
   - 2.9 [Parents Module](#29-parents-module)
   - 2.10 [Attendance Module](#210-attendance-module)
   - 2.11 [Schedules Module](#211-schedules-module)
   - 2.12 [Sessions Module](#212-sessions-module)
   - 2.13 [Progress Module](#213-progress-module)
   - 2.14 [Homework Module](#214-homework-module)
   - 2.15 [Exams Module](#215-exams-module)
   - 2.16 [Notifications Module](#216-notifications-module)
   - 2.17 [Chat Module](#217-chat-module)
   - 2.18 [Seed Script](#218-seed-script)
   - 2.19 [Complete Endpoint Inventory](#219-complete-endpoint-inventory)
   - 2.20 [Database Entity Relationship Diagram](#220-database-entity-relationship-diagram)
3. [Frontend Architecture](#3-frontend-architecture)
   - 3.1 [Framework Stack](#31-framework-stack)
   - 3.2 [Route Tree (26 routes)](#32-route-tree-26-routes)
   - 3.3 [Core Config Files](#33-core-config-files)
   - 3.4 [State Management](#34-state-management)
   - 3.5 [API Layer](#35-api-layer)
   - 3.6 [Dashboard Components](#36-dashboard-components)
   - 3.7 [Landing Page Components](#37-landing-page-components)
   - 3.8 [Modal Components](#38-modal-components)
   - 3.9 [shadcn/ui Component Library](#39-shadcnui-component-library)
   - 3.10 [Utilities](#310-utilities)
   - 3.11 [Complete Frontend File Count](#311-complete-frontend-file-count)
4. [Architectural Patterns & Observations](#4-architectural-patterns--observations)

---

## 1. Project Overview

Nejah Online Quran Center is a full-stack web application for managing an online Quran learning platform. It supports five user roles (Super Admin, Admin, Teacher, Student, Parent) with role-specific dashboards, attendance tracking, class scheduling, homework management, progress tracking, notifications, and messaging.

- **API Base URL:** `http://localhost:3000/api`
- **Frontend URL:** `http://localhost:8080`
- **Backend Port:** 3000
- **Frontend Port:** 8080

---

## 2. Backend Architecture

### 2.1 Configuration

**Package:** `backend/package.json`
- Name: `nejah-backend`
- Framework: NestJS v10
- ORM: TypeORM v0.3.17 with PostgreSQL
- Auth: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`
- Validation: `class-validator`, `class-transformer`
- Build: TypeScript → CommonJS (`dist/`)

**Scripts:**
| Script | Command |
|--------|---------|
| `start` | `nest start` |
| `start:dev` | `nest start --watch` (hot-reload) |
| `start:prod` | `node dist/main` |
| `build` | `nest build` |
| `seed:superadmin` | Seed super admin user |

**Environment Variables:**
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | API server port |
| `API_PREFIX` | `api` | Global API prefix |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `DB_NAME` | `nejah_db` | Database name |
| `JWT_SECRET` | — | JWT signing key |
| `JWT_EXPIRATION` | `7d` | Token expiry |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |

### 2.2 Entry Points

**`main.ts`** — Creates NestJS app, Global ValidationPipe (whitelist + transform), CORS (all localhost origins + mobile apps), global prefix from env, port from env.

**`app.module.ts`** — Imports 12 feature modules: ConfigModule → DatabaseModule → AuthModule → UsersModule → StudentsModule → TeachersModule → ParentsModule → AttendanceModule → SchedulesModule → HomeworkModule → ProgressModule → ExamsModule → NotificationsModule → ChatModule

### 2.3 Common Module

**Enums:** `UserRole` (SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT), `Gender` (MALE, FEMALE), `AttendanceStatus` (PRESENT, ABSENT, LATE, EXCUSED)

**Decorators:** `@CurrentUser()` (extracts request.user), `@Roles(...)` (sets role metadata)

**Guards:** `RolesGuard` (checks user role against required roles)

### 2.4 Database Module

**DatabaseConfigService:** PostgreSQL, auto-load entities, `synchronize: true` in dev, SSL enabled for non-localhost hosts.

### 2.5 Auth Module

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register student + parent |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/forgot-password` | Public | Request password reset (mock) |
| GET | `/auth/profile` | JWT | Get current user profile |

**Service Logic:**
- **register:** Validates passwords, checks email uniqueness, creates User (STUDENT) + Student linked to parent, returns JWT
- **login:** Finds user by email, bcrypt password check, active status check, returns JWT
- **JWT Strategy:** Bearer token, validates payload, attaches `{ id, email, role, name }` to request.user

**Login DTO:** email (@IsEmail), password (@IsString), rememberMe? (@IsOptional)

**Register DTO (nested):**
- `student`: fullName, gender, age, residency, levelOfQuran, email, password, confirmPassword
- `parent`: fullName, email, phoneNumber, residency, relationshipWithStudent, password, confirmPassword

### 2.6 Users Module

**Entity: `User` (`users` table)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| email | string | Unique, NOT NULL |
| password | string | Hashed (bcrypt) |
| name | string | NOT NULL |
| role | enum(UserRole) | Default: STUDENT |
| phone | string | Nullable |
| avatar | string | Nullable |
| isActive | boolean | Default: true |
| createdAt/updatedAt | datetime | Auto |

**Endpoints** (all require JWT + Roles):
| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/users` | SUPER_ADMIN, ADMIN | Create user |
| GET | `/users` | SUPER_ADMIN, ADMIN | List users (search/filter/paginate) |
| GET | `/users/profile` | Any | Get own profile |
| PATCH | `/users/profile` | Any | Update own profile |
| POST | `/users/change-password` | Any | Change own password |
| GET | `/users/:id` | SUPER_ADMIN, ADMIN | Get user by ID |
| PATCH | `/users/:id` | SUPER_ADMIN, ADMIN | Update any user |
| DELETE | `/users/:id` | SUPER_ADMIN, ADMIN | Delete user |
| PATCH | `/users/:id/toggle-status` | SUPER_ADMIN, ADMIN | Activate/deactivate |

**Service:** Auto-seeds super admin on startup (`nejahsuperadmin@gmail.com` / `SuperAdmin123`), email uniqueness check, bcrypt hashing, prevents non-super-admin modification of super admin accounts, prevents self-deletion.

**DTOs:** CreateUserDto (email, password, name, role, phone?, avatar?, isActive?), UpdateUserDto (Partial), QueryUserDto (search?, role?, isActive?, page=1, limit=10), ChangePasswordDto (currentPassword, newPassword, confirmPassword)

### 2.7 Students Module

**Entity: `Student` (`students` table)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| fullName | string | NOT NULL |
| gender | enum(Gender) | Default: MALE |
| age | number | NOT NULL |
| currentResidency | string | Nullable |
| level | enum(QuranLevel) | BEGINNER, INTERMEDIATE, HIFZ, ADVANCED, OTHER |
| email | string | Unique, NOT NULL |
| status | enum(StudentStatus) | ACTIVE, INACTIVE, PENDING |
| isAssigned | boolean | Default: false |
| avatarUrl | string | Nullable |
| attendanceRate | decimal | Default: 0 |
| progressRate | decimal | Default: 0 |
| studentCode | string | Unique (NJ-YYYY-NNN) |
| userId | FK → User | OneToOne |
| parentId | FK → Parent | ManyToOne |
| teacherId | FK → Teacher | ManyToOne |
| createdAt/updatedAt | datetime | Auto |

**Endpoints:**
| Method | Path | Roles |
|--------|------|-------|
| POST | `/students` | SUPER_ADMIN, ADMIN, PARENT |
| GET | `/students` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| GET | `/students/stats` | SUPER_ADMIN, ADMIN |
| POST | `/students/delegate` | SUPER_ADMIN, ADMIN, PARENT |
| GET | `/students/:id` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| PATCH | `/students/:id` | SUPER_ADMIN, ADMIN, PARENT |
| DELETE | `/students/:id` | SUPER_ADMIN, ADMIN |
| GET | `/students/assignments/unassigned` | ADMIN, SUPER_ADMIN |
| POST | `/students/assignments/assign` | ADMIN, SUPER_ADMIN |
| POST | `/students/assignments/unassign` | ADMIN, SUPER_ADMIN |
| GET | `/student/dashboard` | STUDENT |

**Service Logic:** Generates student code (NJ-YYYY-NNN), QueryBuilder with JOINs, delegate creates Schedule record. Student dashboard returns profile, progress, upcoming class, pending tasks, last 7 days attendance, feedback.

### 2.8 Teachers Module

**Entity: `Teacher` (`teachers` table)**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| userId | FK → User | OneToOne (cascade) |
| fullName | string | NOT NULL |
| email | string | Unique, NOT NULL |
| gender | enum(Gender) | Default: MALE |
| phoneNumber | string | Nullable |
| qualification | text | Nullable |
| specialization | string | Nullable |
| experience | number | Default: 0 |
| currentResidency | string | Nullable |
| status | string | Default: 'active' |
| avatarUrl | string | Nullable |
| weeklySchedule | string | Nullable |
| hourlyRate | decimal | Default: 0 |
| notes | text | Nullable |
| createdAt/updatedAt | datetime | Auto |

**Relations:** OneToOne → User, OneToMany → Student, OneToMany → Schedule

**Entity: `TeacherNote` (`teacher_notes` table):** id, type (CLASS_REMINDER, OBSERVATION, GENERAL_REMINDER), title, content, teacherId (FK), createdAt/updatedAt

**Endpoints:**
| Method | Path | Auth |
|--------|------|------|
| POST | `/teachers` | JWT |
| GET | `/teachers` | JWT |
| GET | `/teachers/my-dashboard-stats` | JWT |
| GET | `/teachers/:id` | JWT |
| PATCH | `/teachers/:id` | JWT |
| DELETE | `/teachers/:id` | JWT |
| POST | `/teachers/:id/assign-students` | JWT |

**Teacher Dashboard** (TEACHER role only):
| Method | Path |
|--------|------|
| GET | `/teacher/dashboard` |
| GET | `/teacher/dashboard/today-sessions` |
| GET | `/teacher/dashboard/notes` |
| POST | `/teacher/dashboard/notes` |
| PATCH | `/teacher/dashboard/notes/:id` |
| DELETE | `/teacher/dashboard/notes/:id` |

**Service:** Creates User (TEACHER) + Teacher, deletes both on remove, bulk-assign students.

### 2.9 Parents Module

**Entity: `Parent` (`parents` table):** id (uuid PK), fullName, email (unique), residency, phoneNumber?, relationshipWithStudent, status (ACTIVE/INACTIVE), userId (FK→User, cascade), students (OneToMany, eager), createdAt/updatedAt

**Endpoints:**
| Method | Path | Roles |
|--------|------|-------|
| POST | `/parents` | SUPER_ADMIN, ADMIN |
| GET | `/parents` | SUPER_ADMIN, ADMIN, TEACHER |
| GET | `/parents/stats` | SUPER_ADMIN, ADMIN |
| GET | `/parents/:id` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| GET | `/parents/:id/students` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| PUT | `/parents/:id` | SUPER_ADMIN, ADMIN, PARENT |
| DELETE | `/parents/:id` | SUPER_ADMIN, ADMIN |
| GET | `/parent/dashboard` | PARENT |

**Service:** Creates User (PARENT) + Parent, prevents deletion if parent has linked students. Parent dashboard returns profile, stats, children, activities, schedules, homework.

### 2.10 Attendance Module

**Entity: `ClassSession` (`class_sessions` table):** id (uuid PK), classTitle, subject, quranLevel, sessionDate, scheduledStartTime/EndTime, actualStartTime/EndTime, status (SCHEDULED/LIVE/COMPLETED/CANCELLED), meetingLink, teacherAttendanceStatus (PRESENT/LATE/ABSENT), teacherJoinTime/LeaveTime, teacherDuration, totalStudentsAssigned/Present/Late/Absent/LeftEarly, teacherId (FK→Teacher, CASCADE), scheduleId (FK→Schedule), notes, createdAt/updatedAt

**Entity: `StudentAttendance` (`student_attendance` table):** id (uuid PK), studentId (FK→Student, CASCADE), classSessionId (FK→ClassSession, CASCADE), attendanceStatus (PRESENT/LATE/ABSENT/LEFT_EARLY), joinTime, leaveTime, durationMinutes, notificationSent, notes, createdAt/updatedAt

**Legacy: `Attendance` table:** date, isPresent, studentId, sessionAttendanceId

**Endpoints** (12 — all JWT + role-guarded):
| Method | Path | Roles |
|--------|------|-------|
| POST | `/attendance/sessions` | teacher, admin, superadmin |
| POST | `/attendance/sessions/start-meeting` | teacher, admin, superadmin |
| POST | `/attendance/sessions/end` | teacher, admin, superadmin |
| POST | `/attendance/record` | student, teacher, admin, superadmin |
| GET | `/attendance/sessions/:id` | All roles |
| GET | `/attendance/sessions/by-schedule-today/:scheduleId` | teacher, admin, superadmin |
| GET | `/attendance/student/live` | student, parent, admin, superadmin |
| GET | `/attendance/teacher/sessions` | teacher, admin, superadmin |
| GET | `/attendance/student/history` | student, parent, admin, superadmin |
| GET | `/attendance/student/stats` | student, parent, admin, superadmin |
| GET | `/attendance/live-classes` | admin, superadmin, teacher |
| GET | `/attendance/todays-sessions` | teacher, admin, superadmin |

**Service Logic:**
- Create session → SCHEDULED + StudentAttendance records (default ABSENT)
- Start meeting → LIVE status, record meetingLink, send notifications
- Record attendance → PRESENT/LATE on join, LEFT_EARLY on leave, update stats
- End session → COMPLETED, auto-mark absent/left-early
- Notifications sent for meeting started, ended, attendance recorded

### 2.11 Schedules Module

**Entity: `Schedule` (`schedules` table):** id (uuid PK), className, dayOfWeek, startTimeString, endTimeString, startTime, endTime, studentId (FK→Student, CASCADE), teacherId (FK→Teacher, SET NULL), meetingLink, classType, notes, status (default: 'active'), createdAt/updatedAt

**Endpoints** (8 — all JWT + role-guarded):
| Method | Path | Roles |
|--------|------|-------|
| POST | `/schedules` | SUPER_ADMIN, ADMIN, TEACHER |
| GET | `/schedules` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| GET | `/schedules/student/:studentId` | Same |
| GET | `/schedules/teacher/:teacherId` | Same |
| GET | `/schedules/teacher/:teacherId/day/:day` | SUPER_ADMIN, ADMIN, TEACHER |
| GET | `/schedules/:id` | SUPER_ADMIN, ADMIN, TEACHER, PARENT |
| PATCH | `/schedules/:id` | SUPER_ADMIN, ADMIN, TEACHER |
| DELETE | `/schedules/:id` | SUPER_ADMIN, ADMIN, TEACHER |

**Service Logic:** Validates start < end time, overlap detection (prevents double-booking), defaults className to 'Quran Class' and status to 'active'.

### 2.12 Sessions Module

Not imported in AppModule — entities/services used directly by other modules.

**Entity: `SessionMeeting` (`session_meetings` table):** id (uuid PK), scheduleId (FK→Schedule, CASCADE), teacherId (FK→Teacher, CASCADE), meetingLink, status (SCHEDULED/LIVE/ENDED), teacherJoinTime/LeaveTime, actualStartTime/EndTime, totalDuration, attendanceStatus (PRESENT/LATE/ABSENT), createdAt/updatedAt. Relations: OneToMany → StudentSessionAttendance

**Entity: `StudentSessionAttendance` (`student_session_attendances` table):** id (uuid PK), sessionMeetingId (FK→SessionMeeting, CASCADE), studentId (FK→Student, CASCADE), joinTime, leaveTime, totalDuration, attendanceStatus (PRESENT/LATE/ABSENT/LEFT_EARLY), createdAt/updatedAt. Relations: OneToMany → Attendance (legacy)

**Services:** SessionService (startMeeting, endMeeting, getActiveSession, getScheduleSession, recordTeacherJoin/Leave, getLiveSessionsForAdmin), StudentAttendanceService (recordStudentJoin/Leave, calculateAttendanceStatus, getAttendanceHistory/Percentage, markAbsent, getSessionAttendance)

### 2.13 Progress Module

**Entity: `Progress` (`progress` table):** id (uuid PK), surahsCount (default: 0), ayahsCount (default: 0), weeksActive (default: 0), progressPercentage (default: 0), rank (default: 'Beginner'), lastStudiedSurah?, lastStudiedAyah?, studentId (FK→Student, CASCADE), createdAt/updatedAt

**Entity: `Feedback` (`feedback` table):** id (uuid PK), content (text), studentId (FK→Student, CASCADE), teacherId (FK→Teacher), createdAt/updatedAt

No controllers or services — only entities.

### 2.14 Homework Module

**Entity: `Homework` (`homework` table):** id (uuid PK), title, description (text), difficulty (EASY/MEDIUM/HIGH), status (PENDING/COMPLETED), dueDate, studentId (FK→Student, CASCADE), createdAt/updatedAt

No controllers or services — only entities.

### 2.15 Exams Module

Empty scaffold (`@Module({})`) — no controllers, services, or entities.

### 2.16 Notifications Module

**Entity: `Notification` (`notifications` table):** id (uuid PK), userId (FK→User, CASCADE), type (EMAIL/PUSH/IN_APP), channel (MEETING_STARTED/ENDED, ATTENDANCE_MARKED, CLASS_ALERT, STUDENT_JOINED/LEFT, SYSTEM_ALERT), title, content, dataJson (jsonb), isRead (default: false), sentAt, createdAt/updatedAt

**Endpoints:** GET `/notifications` (last 50), PATCH `/notifications/:id/read`

**Service:** Creates notifications for meeting started/ended, attendance recorded. Sends to students, parents, admins/super-admins.

### 2.17 Chat Module

Empty scaffold — no controllers, services, or entities.

### 2.18 Seed Script

**`create-super-admin.ts`:** Creates super admin: `nejahsuperadmin@gmail.com` / `SuperAdmin123`

### 2.19 Complete Endpoint Inventory

**Auth (4):** POST `/auth/register`, POST `/auth/login`, POST `/auth/forgot-password`, GET `/auth/profile`
**Users (9):** POST/GET `/users`, GET/PATCH `/users/profile`, POST `/users/change-password`, GET/PATCH/DELETE `/users/:id`, PATCH `/users/:id/toggle-status`
**Students (10):** POST/GET `/students`, GET `/students/stats`, POST `/students/delegate`, GET/PATCH/DELETE `/students/:id`, GET `/students/assignments/unassigned`, POST `/students/assignments/assign`, POST `/students/assignments/unassign`, GET `/student/dashboard`
**Teachers (7):** POST/GET `/teachers`, GET `/teachers/my-dashboard-stats`, GET/PATCH/DELETE `/teachers/:id`, POST `/teachers/:id/assign-students`
**Teacher Dashboard (6):** GET `/teacher/dashboard`, GET `/teacher/dashboard/today-sessions`, GET/POST `/teacher/dashboard/notes`, PATCH/DELETE `/teacher/dashboard/notes/:id`
**Parents (7):** POST/GET `/parents`, GET `/parents/stats`, GET `/parents/:id`, GET `/parents/:id/students`, PUT `/parents/:id`, DELETE `/parents/:id`, GET `/parent/dashboard`
**Attendance (12):** POST `/attendance/sessions`, POST `/attendance/sessions/start-meeting`, POST `/attendance/sessions/end`, POST `/attendance/record`, GET `/attendance/sessions/:id`, GET `/attendance/sessions/by-schedule-today/:scheduleId`, GET `/attendance/student/live`, GET `/attendance/teacher/sessions`, GET `/attendance/student/history`, GET `/attendance/student/stats`, GET `/attendance/live-classes`, GET `/attendance/todays-sessions`
**Schedules (8):** POST/GET `/schedules`, GET `/schedules/student/:studentId`, GET `/schedules/teacher/:teacherId`, GET `/schedules/teacher/:teacherId/day/:day`, GET/PATCH/DELETE `/schedules/:id`
**Notifications (2):** GET `/notifications`, PATCH `/notifications/:id/read`
**Total: ~67 API endpoints**

### 2.20 Database Entity Relationship Diagram

```
User ──1:1──→ Student
User ──1:1──→ Teacher
User ──1:1──→ Parent
User ──1:N──→ Notification

Parent ──1:N──→ Student
Teacher ──1:N──→ Student
Teacher ──1:N──→ Schedule
Teacher ──1:N──→ SessionMeeting
Teacher ──1:N──→ TeacherNote

Student ──1:N──→ Schedule
Student ──1:N──→ StudentAttendance
Student ──1:N──→ StudentSessionAttendance
Student ──1:N──→ Homework
Student ──1:1──→ Progress
Student ──1:N──→ Feedback

ClassSession ──1:N──→ StudentAttendance
SessionMeeting ──1:N──→ StudentSessionAttendance
Schedule ──1:N──→ SessionMeeting
Schedule ──1:N──→ ClassSession
```

---

## 3. Frontend Architecture

### 3.1 Framework Stack

| Technology | Version/Notes |
|---|---|
| TanStack Start | React 19 meta-framework (SSR) |
| TanStack Router | v1, file-based routing |
| TanStack Query | v5 (queryClient in router context) |
| Tailwind CSS | v4 (CSS-based via styles.css) |
| shadcn/ui | Radix UI primitives + Tailwind |
| Framer Motion | Animations (site + register) |
| Lucide React | Icon library |
| Sonner | Toast notifications |
| Vite | Build tool |
| TypeScript | Full type coverage |

### 3.2 Route Tree (26 routes)

| Path | File | Purpose |
|------|------|---------|
| `/` | `routes/index.tsx` | Public landing page |
| `/login` | `routes/login.tsx` | Login form (POST /api/auth/login) |
| `/register` | `routes/register.tsx` | Multi-step registration |
| `/forgot-password` | `routes/forgot-password.tsx` | Password reset request |
| `/dashboard` | `routes/dashboard.tsx` | Admin/super-admin dashboard |
| `/teacher_dashboard` | `routes/teacher_dashboard.tsx` | Teacher dashboard |
| `/student_dashboard` | `routes/student_dashboard.tsx` | Student dashboard |
| `/parent_dashboard` | `routes/parent_dashboard.tsx` | Parent dashboard (8 tabs) |
| `/users` | `routes/users.tsx` | User management table |
| `/teachers` | `routes/teachers.tsx` | Teacher management |
| `/teachers/create` | `routes/teachers_.create.tsx` | Create teacher form |
| `/teachers/$id` | `routes/teachers_.$id.tsx` | Teacher profile detail |
| `/teachers/$id/schedule/$day` | `routes/teachers_.$id.schedule.$day.tsx` | Day schedule view |
| `/students` | `routes/students.tsx` | Student management |
| `/parents` | `routes/parents.tsx` | Parent management |
| `/admins` | `routes/admins.tsx` | Admin management |
| `/attendance` | `routes/attendance.tsx` | Live attendance viewer |
| `/class-session/$id` | `routes/class-session_.$id.tsx` | Class session detail |
| `/homework` | `routes/homework.tsx` | Homework assignments |
| `/schedules` | `routes/schedules.tsx` | Schedule management |
| `/reports` | `routes/reports.tsx` | Reports generation |
| `/analytics` | `routes/analytics.tsx` | Analytics/metrics |
| `/progress` | `routes/progress.tsx` | Quran progress tracking |
| `/messages` | `routes/messages.tsx` | Messaging system |
| `/settings` | `routes/settings.tsx` | System settings |

**Auth Pattern:** Each route implements `beforeLoad` checking `localStorage.getItem('token')` inline — no centralized auth guard.

### 3.3 Core Config Files

**`router.tsx`:** Creates TanStack Router with auto-generated routeTree, QueryClient, scrollRestoration: true.

**`routeTree.gen.ts`:** Auto-generated (587 lines), 25 typed route entries with full type safety.

**`start.ts` / `server.ts`:** TanStack Start client/server entry points. Server wraps fetch handler with SSR error recovery.

**`styles.css`:** Tailwind v4 with custom theme (colors, fonts, animations, patterns).

### 3.4 State Management

**`context/AppContext.tsx`** (Dashboard context):
- Theme: light/dark toggle, persisted to localStorage
- Language: en/ar/fr with translation dictionaries
- Sidebar: collapsed state toggle
- Direction: RTL for Arabic
- Wraps all dashboard pages via DashboardLayout

**`components/site/ThemeProvider.tsx`** (Public site context):
- Theme: light/dark
- Language: en/ar/am (Amharic — unique to landing page)
- Used by all landing page components

**`components/site/i18n.ts`:** 3 languages (en/ar/am), ~265 lines of translations for nav, hero, about, courses, how, features, teachers, testimonials, cta, footer.

**`hooks/use-mobile.tsx`:** Mobile detection hook for responsive sidebar.

### 3.5 API Layer

**No centralized API abstraction** — every API call uses raw `fetch`:
```typescript
const token = localStorage.getItem('token');
fetch('http://localhost:3000/api/<endpoint>', {
  headers: { Authorization: `Bearer ${token}` },
});
```

**API endpoints called from frontend:**
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/auth/login` | POST | login |
| `/api/auth/register` | POST | register |
| `/api/auth/forgot-password` | POST | forgot-password |
| `/api/users/profile` | GET | dashboard, teacher_dashboard, student_dashboard |
| `/api/users` | GET, POST | users |
| `/api/users/:id` | PATCH, DELETE | users |
| `/api/teachers` | GET, POST | teachers, AssignStudentModal |
| `/api/teachers/:id` | PATCH, DELETE | teachers |
| `/api/teachers/my-dashboard-stats` | GET | dashboard |
| `/api/students` | GET, POST | students |
| `/api/students/:id` | PATCH, DELETE | students |
| `/api/students/assignments/unassigned` | GET | AssignStudentModal |
| `/api/students/assignments/assign` | POST | AssignStudentModal |
| `/api/parents` | GET, POST | parents |
| `/api/parents/:id` | PATCH, DELETE | parents |
| `/api/schedules` | GET, POST | schedules |
| `/api/attendance/live-classes` | GET | attendance |
| `/api/attendance/todays-sessions` | GET | attendance |
| `/api/attendance/sessions/:id` | GET | attendance |
| `/api/homework` | GET | homework |
| `/api/students?limit=100` | GET | progress |

### 3.6 Dashboard Components (10 files)

| Component | Purpose |
|-----------|---------|
| **DashboardLayout.tsx** | Wrapper: Sidebar + Topbar + AppProvider for all admin pages |
| **Sidebar.tsx** (270 lines) | Collapsible sidebar, role-based menu from menuConfig, mobile overlay drawer, active route highlighting |
| **menuConfig.ts** | 5 role-specific menus (super_admin: 13 items, admin: 10, teacher: 6, student: 5, parent: 8) |
| **Topbar.tsx** (194 lines) | Search, theme toggle, language switcher, notification bell, user dropdown |
| **Breadcrumbs.tsx** | Dynamic breadcrumb navigation |
| **DashboardCards.tsx** | Stats cards grid (students, teachers, revenue, classes) |
| **RecentStudentsTable.tsx** | Recently added students table |
| **StaffOverview.tsx** | Staff listing with roles/status |
| **TodaysClasses.tsx** | Today's scheduled classes |
| **SystemAlerts.tsx** (120 lines) | Static mock alerts (error/warning/success) |

### 3.7 Landing Page Components (15 files)

All used by `routes/index.tsx`, wrapped in ThemeProvider.

| Component | Purpose |
|-----------|---------|
| **Navbar.tsx** (220 lines) | Fixed top nav, scroll-aware blur, theme/lang toggle, mobile drawer |
| **Hero.tsx** (117 lines) | Hero with CTA, floating stat cards |
| **About.tsx** (52 lines) | 3 feature cards |
| **Courses.tsx** (75 lines) | 4 course cards with images |
| **HowItWorks.tsx** (49 lines) | 3-step process |
| **Features.tsx** (66 lines) | 6 feature items + dashboard preview |
| **Teachers.tsx** (51 lines) | 3 teacher profiles with "Book Trial" |
| **Testimonials.tsx** (69 lines) | Auto-rotating carousel (6s) with stars |
| **CTA.tsx** (41 lines) | Call-to-action banner |
| **Footer.tsx** (75 lines) | 4-column footer |
| **FloatingActions.tsx** (42 lines) | Scroll-to-top + WhatsApp button |
| **Loader.tsx** (31 lines) | Full-screen loading spinner |
| **ThemeProvider.tsx** (66 lines) | Context: theme + lang (en/ar/am) |
| **i18n.ts** (265 lines) | Translation dictionaries |
| **SectionHeader.tsx** (30 lines) | Reusable section title |

### 3.8 Modal Components (16 files)

| Category | Components |
|----------|-----------|
| **Users (3)** | AddUserModal, EditUserModal, DeleteUserModal |
| **Teachers (4)** | AddTeacherModal (300 lines, 3 sections), EditTeacherModal, DeleteTeacherModal, EditScheduleModal |
| **Students (5)** | AddStudentModal, EditStudentModal, DeleteStudentModal, AssignStudentModal (318 lines, multi-slot schedule builder), StudentDetailsModal (257 lines) |
| **Parents (4)** | AddParentModal, EditParentModal, DeleteParentModal, ViewParentModal |

### 3.9 shadcn/ui Component Library (46 files)

All 46 standard shadcn/ui components available: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle-group, toggle, tooltip.

### 3.10 Utilities

- **`lib/utils.ts`:** `cn()` function (clsx + tailwind-merge)
- **`lib/error-page.ts`:** Error page component (404/error boundary)
- **`lib/error-capture.ts`:** Error capture/logger

### 3.11 Complete Frontend File Count

| Directory | Count |
|-----------|-------|
| `routes/` | 26 |
| `components/dashboard/` | 10 |
| `components/ui/` (shadcn) | 46 |
| `components/site/` | 15 |
| `components/users/` | 3 |
| `components/teachers/` | 4 |
| `components/students/` | 5 |
| `components/parents/` | 4 |
| `context/` | 1 |
| `hooks/` | 1 |
| `lib/` | 3 |
| Config/core files | 7 |
| **Total** | **~125 files** |

---

## 4. Architectural Patterns & Observations

### Authentication
- No dedicated auth provider — token stored in `localStorage` key `'token'`
- No token refresh logic
- No centralized protected route wrapper — each frontend route implements `beforeLoad` inline
- User info (`userName`, `userRole`) also in localStorage
- Backend uses JWT + Passport with bcrypt password hashing

### API Layer
- No abstraction (no Axios, no fetch wrapper, no interceptors)
- Hardcoded `http://localhost:3000/api/` base URL throughout frontend
- Per-component try/catch error handling with `toast.error()`
- No react-query mutations — all mutations use raw fetch

### i18n Split
- Two separate translation systems: site (en/ar/am via ThemeProvider) and dashboard (en/ar/fr via AppContext)
- No shared translation layer — many dashboard UI strings hardcoded in English

### Routing
- Flat file-based routing with TanStack Router (auto-generated routeTree.gen.ts)
- All routes children of `__root` (except teachers schedule which nests under teachers)
- No nested layouts — each page renders its own layout wrapper

### Backend Modules
- 12 feature modules (2 empty scaffolds: Exams, Chat)
- ~67 total API endpoints
- Role-based access control via JWT + RolesGuard
- Notifications module sends in-app notifications via TypeORM on meeting/attendance events
- Sessions module has entities + services but is NOT registered in AppModule
- Progress and Homework modules have entities only (no controllers or services)

### Key Gaps
1. Homework, Progress, Exams, Chat modules lack backend controllers/services
2. No centralized API layer on frontend
3. No token refresh mechanism
4. No real-time WebSocket/Socket.io (polling used for live classes)
5. Chat module is entirely placeholder
6. Exams module is entirely placeholder
7. Two separate i18n systems with no shared translation layer
8. No production-ready migration strategy (`synchronize: true` in dev)
