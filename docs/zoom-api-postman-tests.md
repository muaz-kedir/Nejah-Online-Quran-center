# Zoom Backend API — Postman Test Cases

**Base URL:** `http://localhost:3000/api`  
**Auth:** All endpoints except webhook require `Authorization: Bearer <JWT>` header.  
**Roles:** `super_admin`, `admin`, `qirat_manager`, `teacher`, `student`, `parent`

---

## Setup

### Environment Variables (Postman)
| Variable | Description |
|---|---|
| `baseUrl` | `http://localhost:3000/api` |
| `token` | JWT token (obtain from auth login) |
| `sessionId` | UUID from created live session |
| `studentId` | UUID of a student |
| `teacherId` | UUID of a teacher |
| `noteId` | UUID from created session note |
| `zoomUserId` | Zoom user ID from teacher's Zoom account |
| `webhookSecret` | `sl8uTpezSUeqYc7DXpKK3w` |

### Pre-requisite: Get a JWT Token
Call your auth login endpoint (e.g. `POST /auth/login`) with teacher/admin credentials and save the token to the `token` variable.

---

## 1. Zoom Settings — `/zoom-settings`

### 1.1 Connect Zoom Account
```
POST {{baseUrl}}/zoom-settings/connect
Role: teacher
```
**Body (JSON):**
```json
{
  "zoomUserId": "abc123",
  "zoomEmail": "teacher@example.com"
}
```
**Expected:** `200` — `{ "id": "<uuid>", "teacherId": "...", "zoomUserId": "abc123", "connectionStatus": "connected", ... }`

---

### 1.2 Disconnect Zoom Account
```
POST {{baseUrl}}/zoom-settings/disconnect
Role: teacher
```
**Body:** none  
**Expected:** `200` — `{ ..., "connectionStatus": "disconnected", ... }`

---

### 1.3 Get Zoom Connection Status
```
GET {{baseUrl}}/zoom-settings/status
Role: teacher
```
**Expected:** `200` — ZoomIntegration object or `null`

---

### 1.4 List All Zoom Integrations
```
GET {{baseUrl}}/zoom-settings/all
Role: super_admin
```
**Expected:** `200` — Array of ZoomIntegration objects with `teacher` relation

---

### 1.5 Get Zoom User Info
```
GET {{baseUrl}}/zoom-settings/user/:zoomUserId
Role: super_admin
```
**Expected:** `200` — Zoom user data from Zoom API or `null`

---

## 2. Live Sessions — `/live-sessions`

### 2.1 Create Session (without Zoom meeting)
```
POST {{baseUrl}}/live-sessions
Roles: teacher, admin, super_admin, qirat_manager
```
**Body (JSON):**
```json
{
  "studentId": "{{studentId}}",
  "scheduledStart": "2026-06-17T10:00:00.000Z",
  "scheduledEnd": "2026-06-17T11:00:00.000Z",
  "notes": "Quran revision session",
  "metadata": {
    "className": "Surah Al-Baqarah"
  }
}
```
**Expected:** `201` — `{ "id": "<uuid>", "status": "SCHEDULED", "zoomMeetingId": null, ... }`

---

### 2.2 Create Session with Zoom Meeting
```
POST {{baseUrl}}/live-sessions/with-zoom
Roles: teacher, admin, super_admin, qirat_manager
```
**Body (JSON):** (same as 2.1)
**Precondition:** Teacher must have a connected Zoom integration.  
**Expected:** `201` — `{ "id": "<uuid>", "zoomMeetingId": "...", "zoomJoinUrl": "...", "zoomStartUrl": "...", ... }`

---

### 2.3 List All Sessions (paginated, filterable)
```
GET {{baseUrl}}/live-sessions?page=1&limit=20&status=SCHEDULED&teacherId={{teacherId}}&studentId={{studentId}}&startDate=2026-06-01&endDate=2026-06-30&sortBy=scheduledStart&sortOrder=DESC
Roles: admin, super_admin, qirat_manager
```
**Query Params (all optional):**
| Param | Type | Default |
|---|---|---|
| `page` | int | 1 |
| `limit` | int | 20 |
| `teacherId` | uuid | — |
| `studentId` | uuid | — |
| `status` | enum | — |
| `sortBy` | string | `scheduledStart` |
| `sortOrder` | ASC/DESC | `DESC` |
| `startDate` | ISO string | — |
| `endDate` | ISO string | — |

**Expected:** `200` — `{ "data": [...], "meta": { "total": N, "page": 1, "limit": 20, "totalPages": N } }`

---

### 2.4 Get Upcoming Sessions
```
GET {{baseUrl}}/live-sessions/upcoming
GET {{baseUrl}}/live-sessions/upcoming?studentId={{studentId}}
Roles: teacher, student, admin, super_admin, qirat_manager
```
**Expected:** `200` — Array of SCHEDULED sessions with scheduledStart >= now

---

### 2.5 Get Live Sessions (currently LIVE)
```
GET {{baseUrl}}/live-sessions/live
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — Array of LIVE sessions

---

### 2.6 Get Today's Sessions
```
GET {{baseUrl}}/live-sessions/today
Roles: teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — Array of sessions scheduled for today

---

### 2.7 Get Session Stats
```
GET {{baseUrl}}/live-sessions/stats
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "total": N, "completed": N, "cancelled": N, "live": N, "scheduled": N }`

---

### 2.8 Get Teacher's Sessions
```
GET {{baseUrl}}/live-sessions/teacher?page=1&limit=10
Roles: teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — Paginated sessions for the authenticated teacher

---

### 2.9 Get Student's Sessions
```
GET {{baseUrl}}/live-sessions/student/:studentId?page=1&limit=10
Roles: student, parent, teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — Paginated sessions for the given student

---

### 2.10 Get Session by ID
```
GET {{baseUrl}}/live-sessions/:id
Roles: teacher, student, admin, super_admin, qirat_manager
```
**Expected:** `200` — Full session object with relations (teacher, student, schedule, attendances, sessionNotes)

---

### 2.11 Update Session
```
PATCH {{baseUrl}}/live-sessions/:id
Roles: teacher, admin, super_admin, qirat_manager
```
**Body (JSON) — partial update:**
```json
{
  "scheduledStart": "2026-06-17T14:00:00.000Z",
  "notes": "Updated notes"
}
```
**Expected:** `200` — Updated session object

---

### 2.12 Start Session
```
POST {{baseUrl}}/live-sessions/:id/start
Roles: teacher, admin, super_admin
```
**Expected:** `200` — Session with `status: "LIVE"`, `actualStart` set

---

### 2.13 Complete Session
```
POST {{baseUrl}}/live-sessions/:id/complete
Roles: teacher, admin, super_admin
```
**Precondition:** Session must be LIVE.  
**Expected:** `200` — Session with `status: "COMPLETED"`, `actualEnd` set, `durationMinutes` calculated

---

### 2.14 Cancel Session
```
POST {{baseUrl}}/live-sessions/:id/cancel
Roles: teacher, admin, super_admin
```
**Precondition:** Session must NOT be COMPLETED.  
**Expected:** `200` — Session with `status: "CANCELLED"`, Zoom meeting deleted (if any)

---

## 3. Session Attendance — `/session-attendance`

### 3.1 Get Student's Attendance Records
```
GET {{baseUrl}}/session-attendance/student/:studentId?page=1&limit=20
Roles: student, parent, teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "data": [...], "meta": { "total": N, "page": 1, "limit": 20, "totalPages": N } }`

---

### 3.2 Get Student's Attendance Stats
```
GET {{baseUrl}}/session-attendance/student/:studentId/stats
Roles: student, parent, teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "total": N, "present": N, "late": N, "absent": N, "leftEarly": N, "attendancePercentage": 75.0 }`

---

### 3.3 Get Session Attendance (all students)
```
GET {{baseUrl}}/session-attendance/session/:sessionId
Roles: teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — Array of attendance records with `student` relation

---

## 4. Session Notes — `/session-notes`

### 4.1 Create Session Note
```
POST {{baseUrl}}/session-notes
Role: teacher
```
**Body (JSON):**
```json
{
  "sessionId": "{{sessionId}}",
  "content": "Student showed great progress in Tajweed rules today."
}
```
**Expected:** `201` — `{ "id": "<uuid>", "sessionId": "...", "teacherId": "...", "content": "...", ... }`

---

### 4.2 Get Notes for a Session
```
GET {{baseUrl}}/session-notes/session/:sessionId
Roles: teacher, student, parent, admin, super_admin, qirat_manager
```
**Expected:** `200` — Array of notes with `teacher` relation

---

### 4.3 Update Session Note
```
PATCH {{baseUrl}}/session-notes/:noteId
Role: teacher
```
**Body (JSON):**
```json
{
  "content": "Updated note content"
}
```
**Expected:** `200` — Updated note object

---

### 4.4 Delete Session Note
```
DELETE {{baseUrl}}/session-notes/:noteId
Role: teacher
```
**Expected:** `200` — `{ "success": true }`

---

## 5. Parent Sessions — `/parent/sessions`

### 5.1 Get My Children's Sessions
```
GET {{baseUrl}}/parent/sessions
Role: parent
```
**Expected:** `200` — `{ "data": [...], "meta": { "total": N } }`
Returns sessions for all students linked to the authenticated parent.

---

## 6. Zoom Analytics — `/zoom-analytics`

### 6.1 Get Dashboard Analytics
```
GET {{baseUrl}}/zoom-analytics/dashboard
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "totalSessions": N, "completedSessions": N, "cancelledSessions": N, "liveSessions": N, "averageSessionDuration": N, "attendanceRate": 85.5, "totalStudents": N, "totalTeachers": N, "missedSessions": N, "activeSessions": N }`

---

### 6.2 Get My Teacher Analytics
```
GET {{baseUrl}}/zoom-analytics/teacher
Role: teacher
```
**Expected:** `200` — Teacher's analytics object

---

### 6.3 Get Teacher Analytics by ID
```
GET {{baseUrl}}/zoom-analytics/teacher/:teacherId
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — Analytics for the specified teacher

---

### 6.4 Get Student Analytics
```
GET {{baseUrl}}/zoom-analytics/student/:studentId
Roles: student, parent, teacher, admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "totalSessions": N, "sessionsAttended": N, "present": N, "late": N, "absent": N, "leftEarly": N, "attendanceRate": 85.5, "totalDuration": N, "averageDuration": N, "engagement": N }`

---

### 6.5 Get Monthly Trends
```
GET {{baseUrl}}/zoom-analytics/monthly?year=2026&month=6
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "month": 6, "year": 2026, "totalSessions": N, "completedSessions": N, "cancelledSessions": N, "averageDuration": N, "attendanceRate": N, "sessionsByDay": { "Monday": N, ... } }`

---

### 6.6 Get Overall Overview
```
GET {{baseUrl}}/zoom-analytics/overview
Roles: admin, super_admin, qirat_manager
```
**Expected:** `200` — `{ "totalSessions": N, "completedSessions": N, "cancelledSessions": N, "liveSessions": N, "scheduledSessions": N, "completionRate": N }`

---

## 7. Zoom Webhook — `/zoom/webhook`

> This endpoint does NOT require JWT auth. It uses HMAC signature verification via the `Authorization` header.

### 7.1 Zoom Webhook URL Validation (Challenge)
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):**
```json
{
  "event": "endpoint.url_validation",
  "payload": {
    "plainToken": "someRandomPlainToken"
  }
}
```
**Headers:**
```
Authorization: v0=<hmac-sha256-of-json-body>
```
**Expected:** `200` — `{ "plainToken": "someRandomPlainToken", "encryptedToken": "<sha256-hmac>" }`

---

### 7.2 Meeting Started Webhook
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):**
```json
{
  "event": "meeting.started",
  "payload": {
    "object": {
      "id": 123456789,
      "uuid": "abc123",
      "host_id": "teacherZoomUserId",
      "topic": "Quran Class",
      "start_time": "2026-06-17T10:00:00Z",
      "duration": 60
    },
    "event_ts": 1718611200000
  }
}
```
**Headers:**
```
Authorization: v0=<hmac-sha256-of-json-body>
```
**Expected:** `200` — `{ "status": true, "message": "Webhook processed" }`

---

### 7.3 Meeting Ended Webhook
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):**
```json
{
  "event": "meeting.ended",
  "payload": {
    "object": {
      "id": 123456789,
      "uuid": "abc123",
      "host_id": "teacherZoomUserId",
      "topic": "Quran Class",
      "start_time": "2026-06-17T10:00:00Z",
      "end_time": "2026-06-17T11:00:00Z",
      "duration": 60
    },
    "event_ts": 1718614800000
  }
}
```
**Expected:** `200` — `{ "status": true, "message": "Webhook processed" }`

---

### 7.4 Participant Joined Webhook
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):**
```json
{
  "event": "participant.joined",
  "payload": {
    "object": {
      "id": 123456789,
      "participant": {
        "user_id": "participantZoomId",
        "user_name": "Student Name",
        "email": "student@example.com",
        "join_time": "2026-06-17T10:05:00Z"
      }
    },
    "event_ts": 1718611500000
  }
}
```
**Expected:** `200` — `{ "status": true, "message": "Webhook processed" }`

---

### 7.5 Participant Left Webhook
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):**
```json
{
  "event": "participant.left",
  "payload": {
    "object": {
      "id": 123456789,
      "participant": {
        "user_id": "participantZoomId",
        "user_name": "Student Name",
        "email": "student@example.com",
        "leave_time": "2026-06-17T10:45:00Z"
      }
    },
    "event_ts": 1718613900000
  }
}
```
**Expected:** `200` — `{ "status": true, "message": "Webhook processed" }`

---

### 7.6 Invalid Signature Webhook
```
POST {{baseUrl}}/zoom/webhook
```
**Body (JSON):** any Zoom event payload  
**Headers:**
```
Authorization: v0=invalid-signature
```
**Expected:** `200` — `{ "status": false, "message": "Invalid signature" }`

---

## Test Flow (Recommended Order)

1. **Login** as `super_admin` to get a JWT token
2. **1.4** List all integrations to verify setup
3. **1.5** Check a Zoom user exists
4. **2.1** Create a live session (save `sessionId`)
5. **2.2** Create a session with Zoom (verify `zoomMeetingId` is populated)
6. **2.10** Get session by ID
7. **2.12** Start the session
8. **2.13** Complete the session
9. **2.14** Cancel another session

**Attendance Flow:**
10. **2.1** Create a session
11. **2.12** Start it
12. **3.3** Get attendance (empty initially)
13. Simulate webhooks (7.2–7.5) or manually use attendance service
14. **3.1** Get student attendance records
15. **3.2** Get attendance stats

**Notes Flow:**
16. **4.1** Create a session note (save `noteId`)
17. **4.2** Get notes for session
18. **4.3** Update note
19. **4.4** Delete note

**Analytics Flow:**
20. **6.1** Dashboard analytics
21. **6.2** Teacher analytics (self)
22. **6.4** Student analytics
23. **6.5** Monthly trends
24. **6.6** Overview

**Parent Flow:**
25. Login as `parent`, **5.1** Get children's sessions

**Zoom Settings Flow:**
26. **1.1** Connect Zoom account
27. **1.3** Check status
28. **1.2** Disconnect Zoom account

---

## Enums Reference

### LiveSessionStatus
| Value | Description |
|---|---|
| `SCHEDULED` | Session is planned |
| `LIVE` | Session is in progress |
| `COMPLETED` | Session ended normally |
| `CANCELLED` | Session was cancelled |

### AttendanceStatus
| Value | Description |
|---|---|
| `PRESENT` | Attended on time |
| `LATE` | Joined after start |
| `ABSENT` | Did not attend |
| `LEFT_EARLY` | Left before end |

### UserRole
| Value | Description |
|---|---|
| `super_admin` | Full access |
| `admin` | Admin access |
| `qirat_manager` | Qirat manager access |
| `teacher` | Teacher access |
| `student` | Student access (self only) |
| `parent` | Parent access (children only) |
