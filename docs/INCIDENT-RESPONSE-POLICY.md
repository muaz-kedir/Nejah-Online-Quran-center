# Incident Management & Response Policy

**Application:** Nejah Online Quran Center
**Version:** 1.0
**Effective Date:** July 12, 2026

---

## 1. Purpose

This policy defines the process for detecting, responding to, and recovering from security incidents affecting the Nejah Online Quran Center platform, its users, and their data.

---

## 2. Incident Classification

| Severity | Definition | Examples | Response Time |
|---|---|---|---|
| **P1 — Critical** | Confirmed data breach or complete service compromise | Unauthorized access to user data; leaked OAuth tokens; database breach | Immediate (within 1 hour) |
| **P2 — High** | Active exploitation or significant security weakness | Vulnerable endpoint being exploited; compromised admin account | Within 4 hours |
| **P3 — Medium** | Potential security issue requiring investigation | Suspicious API activity; failed authentication spikes; anomalous webhook patterns | Within 24 hours |
| **P4 — Low** | Minor security concern or hardening opportunity | Dependency vulnerability; configuration improvement | Within 7 days |

---

## 3. Incident Response Process

### Phase 1: Detection & Reporting

**Detection Sources:**
- Automated logging (NestJS Logger)
- Render/Vercel infrastructure alerts
- Zoom webhook event anomalies
- User reports via support@nejahquran.com
- npm audit dependency alerts

**Reporting:**
- All suspected incidents reported to support@nejahquran.com immediately
- Include: description, timestamps, affected systems, any error messages

### Phase 2: Triage & Assessment

| Action | Owner |
|---|---|
| Verify the incident is real (not false positive) | Development Team |
| Classify severity (P1–P4) | Development Team |
| Identify affected systems and data | Development Team |
| Determine if user notification is required | Development Team |

### Phase 3: Containment

| Severity | Containment Actions |
|---|---|
| **P1** | Revoke compromised credentials; disable affected endpoints; isolate services |
| **P2** | Rotate affected secrets; block malicious IPs; patch vulnerable code |
| **P3** | Increase monitoring; investigate scope; prepare patches |
| **P4** | Schedule fix; no immediate containment needed |

**Immediate Containment Capabilities:**
- Revoke all Zoom OAuth tokens (bulk disconnect via admin API)
- Rotate JWT_SECRET (invalidates all active sessions)
- Rotate ZOOM_CLIENT_SECRET (invalidates app authorization)
- Rotate ZOOM_WEBHOOK_SECRET_TOKEN (blocks webhook processing until updated)
- Disable specific API endpoints via code hotfix

### Phase 4: Notification

| Stakeholder | When | Method |
|---|---|---|
| **Affected users** | Within 72 hours of confirmed breach | Email to registered address |
| **Zoom Trust & Safety** | If Zoom integration is compromised | marketplace@zoom.us |
| **Data Protection Authority** | If PII breach (GDPR requirement) | Per jurisdictional requirements |

**Notification Content:**
- What happened and when
- What data was affected
- What we have done to contain it
- What users should do (if anything)
- Contact information for questions

### Phase 5: Remediation

1. Deploy fix via hotfix branch → merge to `main` → auto-deploy
2. Verify fix in production
3. Update monitoring and logging if needed
4. Document lessons learned

### Phase 6: Post-Incident Review

Within 7 days of resolution:

| Review Item | Output |
|---|---|
| Root cause analysis | Written report with timeline |
| Impact assessment | Number of affected users, data types, duration |
| Effectiveness of response | What worked, what didn't |
| Prevention measures | Code changes, policy updates, tool additions |
| Update to this policy | Revised procedures if needed |

---

## 4. Specific Incident Playbooks

### 4.1 Zoom Token Compromise

1. Immediately disconnect all affected teacher Zoom accounts via `/api/zoom-settings/disconnect`
2. Generate new `ZOOM_WEBHOOK_SECRET_TOKEN` and update in Render
3. Force re-authorization for all teachers
4. Review webhook logs for unauthorized meeting creation
5. Notify affected teachers individually

### 4.2 Database Breach

1. Verify database access controls and connection encryption
2. Audit recent database queries and access logs
3. Rotate `DATABASE_URL` if credentials are compromised
4. Identify scope of data exposure
5. Notify affected users within 72 hours
6. File breach report if required by applicable law

### 4.3 Unauthorized API Access

1. Identify the compromised credentials (JWT, API key, etc.)
2. Rotate the compromised secret immediately
3. Review audit logs for scope of unauthorized access
4. Assess whether data was exfiltrated
5. Implement additional rate limiting or access controls

### 4.4 Dependency Vulnerability

1. Assess severity via `npm audit` and CVE databases
2. Determine if vulnerability is exploitable in your deployment
3. If critical/high: patch within 24–72 hours
4. If medium/low: schedule in next development cycle
5. Document mitigation steps taken

---

## 5. Communication Templates

### User Notification Email

```
Subject: Important Security Notice — Nejah Online Quran Center

Dear [User Name],

We are writing to inform you of a security incident that may have affected 
your account.

What happened: [Brief description]
When it occurred: [Date range]
What data was affected: [Types of data]
What we have done: [Actions taken]
What you should do: [Recommended user actions]

If you have questions, contact us at support@nejahquran.com.

We take the security of your data seriously and apologize for any concern 
this may cause.

— Nejah Online Quran Center Team
```

---

## 6. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Development Team** | Detection, triage, containment, remediation, post-incident review |
| **System Administrators** | Infrastructure security, credential rotation, access management |
| **Support Team** | User communication, incident reporting intake |

---

## 7. Policy Review

This policy is reviewed after every P1/P2 incident and at minimum annually. Updates are documented with version history.

---

**Contact:** support@nejahquran.com
**Emergency:** support@nejahquran.com (mark subject as "URGENT — Security Incident")
**Last Updated:** July 12, 2026
