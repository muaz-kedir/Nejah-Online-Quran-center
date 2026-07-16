# Secure Software Development Lifecycle (SSDLC)

**Application:** Nejah Online Quran Center
**Platform:** https://nejah-quran.vercel.app
**API:** https://nejah-online-quran-center.onrender.com
**Document Version:** 1.0
**Effective Date:** July 12, 2026
**Classification:** Public — Zoom App Marketplace Submission

---

## 1. Overview

Nejah Online Quran Center follows a structured Secure Software Development Lifecycle (SSDLC) that integrates security practices into every phase of development. This document outlines the policies, procedures, and controls applied throughout the development, deployment, and maintenance of the application.

---

## 2. Development Phases & Security Controls

### 2.1 Planning & Design

- **Threat Modeling:** Security considerations are evaluated during feature design, including authentication flows, data storage, and third-party integrations (Zoom OAuth, webhooks).
- **Least Privilege Principle:** API endpoints enforce role-based access control (RBAC). Each endpoint explicitly declares required roles (TEACHER, STUDENT, PARENT, ADMIN, SUPER_ADMIN).
- **Data Classification:** Sensitive data (OAuth tokens, passwords, PII) is classified and handled according to its sensitivity level.

### 2.2 Development

| Control | Implementation |
|---|---|
| **Language & Framework** | TypeScript with NestJS — static typing eliminates entire classes of runtime errors |
| **Input Validation** | All API inputs validated via `class-validator` DTOs with whitelist stripping |
| **Parameterized Queries** | All database interactions use TypeORM repositories — no raw SQL concatenation |
| **Authentication** | JWT-based with bcrypt password hashing (12+ rounds) |
| **Authorization** | Custom `JwtAuthGuard` + `RolesGuard` decorators enforce RBAC at controller level |
| **Secrets Management** | All credentials stored as environment variables; never committed to source control |
| **Dependency Hygiene** | Dependencies audited via `npm audit` before deployment; known vulnerabilities tracked |

### 2.3 Code Review & Version Control

- **Branch Protection:** Production branch (`main`) receives merges only from reviewed feature branches.
- **Peer Review:** All code changes require review before merge. Commits are atomic and descriptive.
- **Commit History:** Full audit trail maintained via Git with signed commits.

### 2.4 Encryption & Data Protection

| Data Type | Protection Method |
|---|---|
| **OAuth Access Tokens** | AES-256-GCM encryption at rest via `EncryptionService` |
| **OAuth Refresh Tokens** | AES-256-GCM encryption at rest via `EncryptionService` |
| **User Passwords** | bcrypt hashing with 12+ salt rounds |
| **JWT Tokens** | HMAC-SHA256 signing with configurable secret |
| **Data in Transit** | TLS 1.2+ enforced (Render + Vercel infrastructure) |
| **Zoom Webhook Signatures** | HMAC-SHA256 verification with `crypto.timingSafeEqual` |

### 2.5 Zoom Integration Security

- **OAuth Flow:** Authorization Code Flow with CSRF-protected state parameters (32-byte random, single-use, 10-minute TTL).
- **Token Storage:** Encrypted tokens stored per-teacher; automatic disconnection on refresh failure.
- **Webhook Verification:** Every inbound webhook verified via `x-zm-signature` header using HMAC-SHA256. Unverified requests rejected with 200 OK (no processing).
- **Scope Limitation:** Minimum required Zoom scopes: `user:read:admin`, `meeting:write:admin`, `meeting:read:admin`.

### 2.6 Testing

- **Static Analysis:** TypeScript compiler (`tsc --noEmit`) validates type safety on every build.
- **Dependency Scanning:** `npm audit` identifies known CVEs in third-party packages.
- **Build Verification:** Automated `nest build` confirms successful compilation before deployment.
- **Integration Testing:** OAuth flow, webhook handling, and API endpoints verified in staging environment.

### 2.7 Deployment & Infrastructure

- **CI/CD:** Automated build pipeline via Render (backend) and Vercel (frontend).
- **Environment Isolation:** Development and production credentials are separate.
- **HTTPS Enforcement:** All production traffic over TLS.
- **Raw Body Preservation:** Webhook endpoint preserves raw request body for signature verification.
- **Rate Limiting:** `@nestjs/throttler` applied globally; webhook endpoint excluded with `@SkipThrottle()`.

### 2.8 Monitoring & Incident Response

- **Logging:** Structured logging via NestJS `Logger` for all webhook events, API errors, and authentication failures.
- **Error Handling:** Unhandled exceptions caught and logged; no stack traces exposed to clients.
- **Incident Response:** Documented policy for detection, containment, notification, and remediation.
- **Token Revocation:** Admins can disconnect any teacher's Zoom integration instantly via API.

---

## 3. Dependency & Vulnerability Management

- All dependencies pinned in `package.json` with caret ranges.
- `npm audit` run during each build cycle.
- Vulnerabilities classified by severity (low/moderate/high/critical).
- Critical and high vulnerabilities patched within 30 days of disclosure.
- Current status: 37 known vulnerabilities (3 low, 22 moderate, 12 high) — all in transitive dependencies; none in directly controlled application code.

---

## 4. Compliance & Privacy

- **Privacy Policy:** Publicly available at https://nejah-quran.vercel.app/privacy-policy
- **Terms of Service:** Publicly available at https://nejah-quran.vercel.app/terms-of-service
- **Data Minimization:** Only data required for educational functionality is collected.
- **User Rights:** Users can request data access, correction, or deletion via support@nejahquran.com.
- **Data Retention:** OAuth tokens deleted on disconnect; session records retained for educational purposes.

---

## 5. Continuous Improvement

Security practices are reviewed quarterly and updated based on:
- New vulnerability disclosures in dependencies
- Zoom Platform API changes and security advisories
- OWASP Top 10 updates
- User feedback and incident reports

---

**Prepared by:** Nejah Development Team
**Contact:** support@nejahquran.com
**Last Updated:** July 12, 2026
