# Release Notes

**Application:** Nejah Online Quran Center
**App Type:** General App (User-Managed)
**Current Version:** 1.0.0
**Release Date:** July 12, 2026

---

## Application Summary

Nejah Online Quran Center is a Quran education management platform that enables teachers to conduct live Quran classes via Zoom integration. The platform handles scheduling, attendance tracking, student progress monitoring, and parent communication. Zoom integration allows teachers to individually connect their personal Zoom accounts to create and manage class meetings automatically.

---

## Version 1.0.0 — Initial Release

### Zoom Integration Features

| Feature | Description |
|---|---|
| **OAuth Authorization Code Flow** | Teachers connect their personal Zoom accounts via OAuth 2.0. Each teacher individually authorizes the app through Zoom's consent screen. Tokens are encrypted (AES-256-GCM) and stored per-teacher. |
| **Automatic Meeting Creation** | When a teacher starts a scheduled class session, the app automatically creates a Zoom meeting using the teacher's connected account. No manual link creation required. |
| **Webhook Event Subscriptions** | Real-time event processing for meeting lifecycle events: `meeting.started`, `meeting.ended`, `meeting.participant_joined`, `meeting.participant_left`. |
| **Automatic Attendance Tracking** | Student join/leave times are recorded automatically via Zoom webhook events. Duration and attendance status calculated without manual input. |
| **Token Refresh Management** | OAuth tokens are automatically refreshed before expiry. If refresh fails, the teacher is marked as disconnected and notified to reconnect. |
| **Embedded Classroom** | Zoom Meeting SDK integration for in-app classroom experience. Students can join meetings directly from the platform without switching to the Zoom app. |
| **ZAK Token Generation** | Teachers receive ZAK tokens for seamless host authentication when joining meetings through the embedded classroom. |
| **Admin Dashboard** | Administrators can view all teacher Zoom connections, manually connect/disconnect teachers, and monitor integration health. |
| **Teacher Health Check** | Teachers can verify their Zoom connection status and token validity from the settings page. |

### Authentication & Security

| Feature | Description |
|---|---|
| **JWT Authentication** | Stateless authentication using JSON Web Tokens with configurable expiry. |
| **Role-Based Access Control** | Five roles (SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT) with endpoint-level permission enforcement. |
| **OAuth CSRF Protection** | OAuth state parameters are 32-byte cryptographically random values, single-use, with 10-minute expiry. |
| **Webhook Signature Verification** | All inbound webhooks verified using HMAC-SHA256 with timing-safe comparison. |
| **Encrypted Token Storage** | OAuth access and refresh tokens encrypted at rest using AES-256-GCM. |

### Platform Features

| Feature | Description |
|---|---|
| **Class Scheduling** | Teachers and admins can schedule recurring or one-time class sessions with assigned students. |
| **Student Enrollment** | Students register and are assigned to classes by administrators. |
| **Progress Tracking** | Teachers record student evaluations and progress notes per session. |
| **Parent Portal** | Parents can view their children's attendance, sessions, and progress. |
| **Homework Management** | Teachers assign homework; students submit and receive feedback. |
| **Notifications** | In-app notifications for session reminders, homework, and announcements. |
| **Multi-Language Support** | English and Arabic language support with RTL layout. |
| **Dark Mode** | Full dark theme support across all pages. |

---

## Zoom Scopes Used

| Scope | Purpose |
|---|---|
| `user:read:admin` | Read teacher's Zoom profile during OAuth callback |
| `meeting:write:admin` | Create, update, and delete meetings for scheduled classes |
| `meeting:read:admin` | Retrieve meeting details and participant attendance reports |

---

## Supported Zoom Events

| Event | Purpose |
|---|---|
| `meeting.started` | Marks class session as LIVE; records actual start time |
| `meeting.ended` | Marks class session as COMPLETED; calculates duration |
| `meeting.participant_joined` | Records student join time for attendance |
| `meeting.participant_left` | Records student leave time; calculates attendance duration |

---

## Infrastructure

| Component | Technology | Hosting |
|---|---|---|
| Frontend | React, TanStack Router, Tailwind CSS | Vercel (HTTPS enforced) |
| Backend | NestJS, TypeORM, TypeScript | Render (HTTPS enforced) |
| Database | PostgreSQL | Neon (encrypted connections) |
| Zoom Integration | OAuth 2.0, REST API v2, Meeting SDK, Webhooks | Zoom Platform |

---

## Known Limitations

1. **Meeting Duration:** Limited by the host's Zoom plan (40 minutes for Basic accounts on group meetings).
2. **Webhook Processing:** Events are processed asynchronously after returning 200 to Zoom. There may be a brief delay (1-3 seconds) before attendance records update.
3. **Token Refresh:** Requires the teacher's Zoom account to remain active. If the teacher's Zoom account is suspended or deleted, tokens become invalid and the teacher is auto-disconnected.
4. **Concurrent Meetings:** Each teacher can only host one meeting at a time through their connected Zoom account.

---

## Future Enhancements (Planned)

- Cloud recording integration
- Breakout room support
- Recurring meeting management
- Student Zoom account linking (for breakout rooms)
- Meeting chat archival
- Post-session summary auto-generation

---

## Support

- **Email:** support@nejahquran.com
- **Website:** https://nejah-quran.vercel.app
- **Privacy Policy:** https://nejah-quran.vercel.app/privacy-policy
- **Terms of Service:** https://nejah-quran.vercel.app/terms-of-service
- **Zoom Integration Guide:** https://nejah-quran.vercel.app/zoom-guide

---

**Prepared for:** Zoom App Marketplace Review Team
**Contact:** support@nejahquran.com
**Last Updated:** July 12, 2026
