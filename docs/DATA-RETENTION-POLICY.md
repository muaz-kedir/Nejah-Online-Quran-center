# Data Retention & Protection Policy

**Application:** Nejah Online Quran Center
**Version:** 1.0
**Effective Date:** July 12, 2026

---

## 1. Data We Collect

| Category | Data | Source | Purpose |
|---|---|---|---|
| **Account** | Name, email, password hash, role | User registration | Authentication, authorization |
| **Zoom Integration** | Zoom User ID, Zoom email | OAuth flow | Link teacher to Zoom account |
| **Zoom Tokens** | Access token (encrypted), refresh token (encrypted), expiry | OAuth flow | Create/manage meetings, track attendance |
| **Class Sessions** | Schedule, topic, meeting link, meeting ID, status, timestamps | Teacher/admin actions | Class management |
| **Attendance** | Student join/leave times, duration, status | Zoom webhooks | Attendance tracking |
| **Webhook Events** | Event type, meeting ID, participant data, timestamps | Zoom webhooks | Real-time session tracking |
| **Webhook Dedup** | Event IDs, timestamps | Webhook processing | Prevent duplicate processing |

---

## 2. How Long We Keep Data

| Data Type | Retention Period | Deletion Trigger |
|---|---|---|
| User account (name, email, role) | Duration of account + 30 days | Account deletion request |
| Password hash | Duration of account | Account deletion |
| Zoom OAuth tokens | Until teacher disconnects | Disconnect or refresh failure |
| Zoom User ID link | Until teacher disconnects | Disconnect |
| Class session records | 2 years | Scheduled purge |
| Attendance records | 2 years | Scheduled purge |
| Webhook dedup records | 30 days | Automatic cron purge |
| Audit logs | 1 year | Scheduled purge |

---

## 3. Zoom Token Lifecycle

```
[Teacher connects Zoom]
    → Access token + refresh token encrypted (AES-256-GCM) and stored
    → Zoom User ID linked to teacher account

[During normal operation]
    → Access token used for API calls (meeting creation, management)
    → Tokens auto-refreshed before expiry
    → If refresh fails → teacher marked as disconnected → tokens deleted

[Teacher disconnects]
    → All tokens permanently deleted
    → Zoom User ID link removed
    → Connection status set to "disconnected"
    → Class session records retained for history
```

---

## 4. User Rights

### 4.1 Right to Access

Users may request a copy of all personal data held about them by emailing support@nejahquran.com. Response within 30 days.

### 4.2 Right to Rectification

Users may request correction of inaccurate data via the Profile page or by contacting support.

### 4.3 Right to Erasure

Users may request complete deletion of their account and associated data:

1. Email support@nejahquran.com with subject "Data Deletion Request"
2. Include: full name, email address, role
3. We process the request within 30 days
4. Confirmation sent upon completion

**What is deleted:**
- Account credentials
- Personal information
- Zoom tokens and integration links
- Attendance records linked to the user

**What may be retained:**
- Anonymized session records (for aggregate reporting)
- Financial records (if applicable, per legal requirements)

### 4.4 Right to Data Portability

Users may request their data in a machine-readable format (JSON) by contacting support.

---

## 5. Data Protection Measures

| Measure | Implementation |
|---|---|
| **Encryption at rest** | AES-256-GCM for OAuth tokens; bcrypt for passwords |
| **Encryption in transit** | TLS 1.2+ (infrastructure-enforced) |
| **Access control** | Role-based; minimal privilege per endpoint |
| **Database security** | Parameterized queries (TypeORM); no raw SQL |
| **Secrets management** | Environment variables only; never in source code |
| **Audit logging** | All webhook events, API errors, auth failures logged |
| **Backup** | Managed by hosting provider (Neon/Render) |

---

## 6. Third-Party Data Sharing

| Recipient | Data Shared | Purpose | Legal Basis |
|---|---|---|---|
| Zoom Video Communications | User email, meeting data | OAuth authorization, meeting management | User consent (OAuth approval) |
| Render (hosting) | Application data (encrypted) | Backend hosting | Contract |
| Neon (database) | Application data (encrypted) | Database hosting | Contract |
| Vercel (hosting) | Frontend assets only | Frontend hosting | Contract |

**We do not sell personal data to any third party.**

---

## 7. Children's Data

The Service is used for Quran education. For students under 13 (or applicable age of digital consent):
- Accounts are created and managed by parents/guardians
- We do not collect data directly from children without parental consent
- Parents may request deletion of their child's data at any time

---

## 8. Policy Updates

This policy is reviewed quarterly and updated as needed. Material changes are posted on this page with an updated effective date.

---

**Contact:** support@nejahquran.com
**Last Updated:** July 12, 2026
