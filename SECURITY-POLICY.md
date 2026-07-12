# Security Policy

**Application:** Nejah Online Quran Center
**Version:** 1.0
**Effective Date:** July 12, 2026

---

## 1. Authentication & Access Control

| Control | Detail |
|---|---|
| **Password Storage** | bcrypt with 12+ salt rounds |
| **Session Management** | JWT tokens with configurable expiry |
| **Multi-Factor Auth** | Not currently implemented; planned for future release |
| **RBAC** | Five roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT |
| **API Authentication** | Bearer token required on all non-public endpoints |
| **OAuth Integration** | Per-teacher Authorization Code Flow; tokens encrypted at rest |

---

## 2. Data Protection

### 2.1 Encryption Standards

| Data | Method | Standard |
|---|---|---|
| OAuth tokens at rest | AES-256-GCM | NIST approved |
| Passwords | bcrypt | Industry standard |
| JWT signatures | HMAC-SHA256 | RFC 7515 |
| Webhook verification | HMAC-SHA256 | Zoom specification |
| Data in transit | TLS 1.2+ | Infrastructure-enforced |

### 2.2 Data Classification

| Classification | Examples | Handling |
|---|---|---|
| **Highly Sensitive** | OAuth tokens, passwords | Encrypted at rest, access-logged |
| **Sensitive** | Email addresses, student records | Access-controlled, role-restricted |
| **Internal** | Session schedules, attendance records | Available to authorized roles |
| **Public** | App name, public pages | No restrictions |

---

## 3. Network Security

- All production traffic served over HTTPS (TLS 1.2+)
- Backend API hosted on Render with DDoS protection
- Frontend hosted on Vercel with edge network protection
- Webhook endpoint accepts only POST requests from Zoom IPs
- Rate limiting applied via `@nestjs/throttler`

---

## 4. Webhook Security

1. **Signature Verification:** Every inbound webhook verified using HMAC-SHA256 with timing-safe comparison.
2. **Timestamp Validation:** Rejects requests with missing `x-zm-request-timestamp` header.
3. **Secret Token Required:** Webhooks rejected entirely if `ZOOM_WEBHOOK_SECRET_TOKEN` is not configured.
4. **Event Deduplication:** Processed event IDs tracked in `processed_webhooks` table; duplicates discarded.
5. **Background Processing:** Webhook handler returns 200 immediately; event processing occurs asynchronously.

---

## 5. Vulnerability Management

| Severity | Response Time | Action |
|---|---|---|
| Critical | 24 hours | Hotfix deployed; affected users notified |
| High | 72 hours | Patch scheduled; affected scope assessed |
| Medium | 30 days | Addressed in next development cycle |
| Low | 90 days | Addressed opportunistically |

- `npm audit` runs on every build
- TypeScript compiler catches type-safety issues at build time
- No known vulnerabilities in directly controlled application code

---

## 6. Incident Response

1. **Detection:** Automated logging, error monitoring, webhook event tracking
2. **Triage:** Severity assessed within 24 hours of detection
3. **Containment:** Affected credentials revoked; services isolated if necessary
4. **Notification:** Users notified within 72 hours for confirmed breaches (GDPR compliance)
5. **Remediation:** Root cause addressed; patches deployed via hotfix
6. **Review:** Post-incident analysis conducted within 7 days

---

## 7. Access to Production

| Action | Requirement |
|---|---|
| Code deployment | Merge to `main` branch via reviewed PR |
| Environment variables | Managed via Render dashboard; access restricted to administrators |
| Database access | Managed via hosted provider; encrypted connections only |
| Zoom app credentials | Stored in environment variables; never in source code |

---

## 8. Third-Party Services

| Service | Purpose | Security |
|---|---|---|
| Zoom Video Communications | OAuth, Meetings, Webhooks | OAuth 2.0 + HMAC signature verification |
| Render | Backend hosting | TLS, environment variable encryption |
| Vercel | Frontend hosting | Edge network, TLS |
| Neon | PostgreSQL database | Encrypted connections, access controls |

---

**Contact:** support@nejahquran.com
**Last Updated:** July 12, 2026
