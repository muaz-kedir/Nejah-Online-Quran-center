# Architecture & Flow Diagrams

**Application:** Nejah Online Quran Center
**Version:** 1.0
**Date:** July 12, 2026

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "User Devices"
        A1[Teacher Browser]
        A2[Student Browser]
        A3[Admin Browser]
    end

    subgraph "Frontend — Vercel"
        B1[React SPA<br/>TanStack Router<br/>Tailwind CSS]
        B2[Zoom Meeting SDK<br/>Embedded Classroom]
    end

    subgraph "Backend — Render"
        C1[NestJS API Server]
        C2[JWT Auth Guard]
        C3[Role-Based Access Control]
        C4[Encryption Service<br/>AES-256-GCM]
        C5[Webhook Handler<br/>HMAC-SHA256 Verification]
    end

    subgraph "Database — Neon"
        D1[PostgreSQL]
        D2[zoom_integrations<br/>Encrypted Tokens]
        D3[zoom_platform_config]
        D4[class_sessions]
        D5[student_attendance]
        D6[processed_webhooks<br/>Deduplication]
        D7[users / teachers<br/>RBAC Roles]
    end

    subgraph "Zoom Platform"
        E1[Zoom OAuth API<br/>zoom.us/oauth]
        E2[Zoom REST API v2<br/>api.zoom.us]
        E3[Zoom Webhooks<br/>Event Subscriptions]
        E4[Zoom Meeting SDK<br/>Embed JS]
    end

    A1 & A2 & A3 -->|HTTPS| B1
    B1 -->|HTTPS API Calls| C1
    B2 -->|WebSocket / HTTPS| E4
    C1 --> C2 --> C3
    C1 --> C4
    C1 --> C5
    C1 -->|SQL Queries| D1
    D1 --> D2 & D3 & D4 & D5 & D6 & D7
    C1 -->|HTTPS| E1
    C1 -->|HTTPS| E2
    E3 -->|POST Webhook| C5
    C1 -.->|OAuth Tokens Encrypted| C4
    C4 -.->|Encrypted Storage| D2
```

---

## 2. OAuth Authorization Code Flow

```mermaid
sequenceDiagram
    participant T as Teacher
    participant FE as Frontend<br/>(Vercel)
    participant BE as Backend API<br/>(Render)
    participant DB as PostgreSQL<br/>(Neon)
    participant Z as Zoom OAuth<br/>(zoom.us)

    Note over T,Z: Teacher connects their Zoom account

    T->>FE: Click "Connect Zoom" in Settings
    FE->>BE: GET /api/zoom/oauth/connect<br/>Authorization: Bearer {jwt}
    BE->>BE: Verify JWT + Teacher role
    BE->>BE: Generate CSRF state (32 bytes)<br/>Store state → teacherId mapping
    BE->>BE: Build Zoom auth URL with<br/>client_id, redirect_uri, scope, state
    BE-->>FE: Return { url: "https://zoom.us/oauth/authorize?..." }
    FE->>Z: Redirect browser to Zoom

    Z->>T: Show OAuth consent screen<br/>Scopes: user:read, meeting:write, meeting:read
    T->>Z: Click "Allow"

    Z->>BE: GET /api/zoom/oauth/callback<br/>?code={auth_code}&state={csrf_state}

    BE->>BE: Validate state parameter<br/>(single-use, 10-min TTL)
    BE->>Z: POST /oauth/token<br/>grant_type=authorization_code<br/>Basic Auth: client_id:client_secret
    Z-->>BE: { access_token, refresh_token,<br/>expires_in, scope }

    BE->>BE: Fetch user profile from Zoom API<br/>GET /v2/users/me
    Z-->>BE: { id, email, first_name, last_name }

    BE->>BE: Encrypt tokens (AES-256-GCM)
    BE->>DB: UPSERT zoom_integrations<br/>(teacherId, zoomUserId, zoomEmail,<br/>accessTokenEncrypted, refreshTokenEncrypted,<br/>tokenExpiresAt, connectionStatus='connected')
    BE->>DB: UPDATE teachers<br/>(zoomConnected=true, zoomEmail, zoomUserId)

    BE-->>FE: Redirect to ?zoom=connected
    FE->>T: Show "Zoom Connected" status
```

---

## 3. Live Class Meeting Creation Flow

```mermaid
sequenceDiagram
    participant T as Teacher
    participant FE as Frontend
    participant BE as Backend API
    participant DB as PostgreSQL
    participant Z as Zoom REST API

    Note over T,Z: Teacher starts a scheduled class session

    T->>FE: Click "Start Session"
    FE->>BE: POST /api/live-sessions/:id/start<br/>Authorization: Bearer {jwt}

    BE->>BE: Verify JWT + Teacher role
    BE->>DB: Find session by ID
    DB-->>BE: { classSession, teacherId }

    alt No meeting link provided
        BE->>DB: Query zoom_integrations<br/>WHERE teacherId = ? AND status = 'connected'
        DB-->>BE: { accessTokenEncrypted, refreshTokenEncrypted }

        BE->>BE: Decrypt access token (AES-256-GCM)

        alt Token expired
            BE->>Z: POST /oauth/token<br/>grant_type=refresh_token
            Z-->>BE: { new_access_token, new_refresh_token }
            BE->>BE: Re-encrypt new tokens
            BE->>DB: UPDATE zoom_integrations<br/>(new encrypted tokens, expiry)
        end

        BE->>Z: POST /v2/users/me/meetings<br/>Authorization: Bearer {access_token}<br/>{ topic, type: 2, start_time, duration }
        Z-->>BE: { id, join_url, start_url, password }

        BE->>DB: UPDATE class_sessions<br/>(meetingLink, zoomMeetingId,<br/>zoomPassword, status=LIVE)

        BE-->>FE: { joinUrl, startUrl }
    else Manual meeting link
        BE->>DB: UPDATE class_sessions<br/>(meetingLink=provided,<br/>status=LIVE)
        BE-->>FE: { joinUrl: provided }
    end

    FE->>T: Open Zoom classroom<br/>(embedded or new tab)
```

---

## 4. Webhook Event Processing Flow

```mermaid
sequenceDiagram
    participant Z as Zoom Webhooks<br/>(Event Subscriptions)
    participant BE as Backend<br/>Webhook Controller
    participant SVC as Webhook Service
    participant DB as PostgreSQL

    Note over Z,DB: Zoom sends meeting events

    Z->>BE: POST /zoom/webhook<br/>Headers: x-zm-signature, x-zm-request-timestamp<br/>Body: { event, payload }

    alt event = "endpoint.url_validation"
        BE->>BE: Extract plainToken from payload
        BE->>BE: encryptedToken = HMAC-SHA256<br/>(ZOOM_WEBHOOK_SECRET_TOKEN, plainToken)
        BE-->>Z: { plainToken, encryptedToken }
        Note over Z: Zoom validates endpoint ownership
    else All other events
        BE->>BE: Extract signature + timestamp headers
        BE->>BE: Compute expected signature:<br/>HMAC-SHA256(secret, "v0:{timestamp}:{raw_body}")
        BE->>BE: Compare with x-zm-signature<br/>using crypto.timingSafeEqual

        alt Signature invalid
            BE-->>Z: { status: "rejected" }
        else Signature valid
            BE->>BE: Build eventId = "{event}_{meetingId}_{eventTs}"
            BE->>DB: Check processed_webhooks<br/>WHERE eventId = ?
            DB-->>BE: null (not processed yet)

            BE-->>Z: { status: "success" }
            Note over BE: Return 200 immediately

            BE->>DB: INSERT INTO processed_webhooks<br/>(eventId, eventType, receivedAt)

            alt event = "meeting.started"
                BE->>DB: UPDATE class_sessions<br/>SET status = LIVE,<br/>actualStartTime = NOW()<br/>WHERE zoomMeetingId = ?
            else event = "meeting.ended"
                BE->>DB: UPDATE class_sessions<br/>SET status = COMPLETED,<br/>actualEndTime = NOW()<br/>WHERE zoomMeetingId = ?
                BE->>BE: Calculate duration
                BE->>DB: UPDATE class_sessions<br/>SET durationMinutes = ?
            else event = "meeting.participant_joined"
                BE->>DB: INSERT/UPDATE student_attendance<br/>SET joinTime = NOW()
            else event = "meeting.participant_left"
                BE->>DB: UPDATE student_attendance<br/>SET leaveTime = NOW(),<br/>durationMinutes = ?
            end
        end
    end
```

---

## 5. Teacher Data Flow — Token Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected: New teacher account

    Disconnected --> PendingOAuth: Click "Connect Zoom"
    PendingOAuth --> Connected: OAuth callback succeeds<br/>(tokens encrypted & stored)
    PendingOAuth --> Disconnected: OAuth denied<br/>or state expired

    Connected --> TokenRefreshing: Access token expires<br/>(checked on each API call)
    TokenRefreshing --> Connected: Refresh succeeds<br/>(new tokens encrypted)
    TokenRefreshing --> Disconnected: Refresh fails<br/>(tokens deleted)

    Connected --> Disconnected: Teacher clicks<br/>"Disconnect Zoom"
    Connected --> Disconnected: Admin disconnects<br/>teacher

    Disconnected --> [*]: Tokens deleted<br/>Zoom link removed

    state Connected {
        [*] --> Active
        Active --> Active: Create/manage meetings
        Active --> Active: Track attendance
    }
```

---

## 6. Database Entity Relationships

```mermaid
erDiagram
    TEACHERS ||--o| ZOOM_INTEGRATIONS : "has zoom connection"
    TEACHERS ||--o{ CLASS_SESSIONS : "teaches"
    CLASS_SESSIONS ||--o{ STUDENT_ATTENDANCE : "has attendees"
    STUDENTS ||--o{ STUDENT_ATTENDANCE : "attends"
    CLASS_SESSIONS ||--o{ LIVE_SESSIONS : "extends"
    ZOOM_PLATFORM_CONFIG ||--|| ZOOM_INTEGRATIONS : "platform settings"
    PROCESSED_WEBHOOKS ||--|| CLASS_SESSIONS : "dedup events"

    TEACHERS {
        uuid id PK
        string fullName
        string email UK
        boolean zoomConnected
        string zoomUserId
        string zoomEmail
        datetime zoomConnectedAt
    }

    ZOOM_INTEGRATIONS {
        uuid id PK
        uuid teacherId FK "unique"
        string zoomUserId
        string zoomEmail
        string connectionStatus
        text accessTokenEncrypted "AES-256-GCM"
        text refreshTokenEncrypted "AES-256-GCM"
        datetime tokenExpiresAt
        datetime connectedAt
        datetime disconnectedAt
    }

    CLASS_SESSIONS {
        uuid id PK
        uuid teacherId FK
        string classTitle
        string status "LIVE|COMPLETED|SCHEDULED"
        string meetingLink
        string zoomMeetingId
        string zoomPassword
        datetime actualStartTime
        datetime actualEndTime
        int durationMinutes
    }

    STUDENT_ATTENDANCE {
        uuid id PK
        uuid studentId FK
        uuid classSessionId FK
        string attendanceStatus
        datetime joinTime
        datetime leaveTime
        int durationMinutes
    }

    PROCESSED_WEBHOOKS {
        uuid id PK
        string eventId UK
        string eventType
        datetime receivedAt
        datetime expiresAt "auto-purge 30d"
    }
```

---

## 7. Infrastructure Topology

```mermaid
graph LR
    subgraph "Internet"
        U[Users]
        ZM[Zoom Marketplace]
        ZW[Zoom Webhooks]
    end

    subgraph "Vercel — Frontend CDN"
        FE[React SPA<br/>Static Assets<br/>Edge Network]
    end

    subgraph "Render — Backend"
        API[NestJS Server<br/>Port 3000]
        ENV[Environment Variables<br/>ZOOM_CLIENT_ID<br/>ZOOM_CLIENT_SECRET<br/>ZOOM_WEBHOOK_SECRET_TOKEN<br/>ZOOM_REDIRECT_URI<br/>JWT_SECRET<br/>DATABASE_URL<br/>ENCRYPTION_KEY]
    end

    subgraph "Neon — Database"
        PG[(PostgreSQL<br/>Encrypted Connections)]
    end

    subgraph "Zoom APIs"
        ZOAUTH[OAuth Endpoint<br/>zoom.us/oauth]
        ZAPI[REST API v2<br/>api.zoom.us/v2]
        ZSDK[Meeting SDK<br/>Zoom Web SDK]
    end

    U -->|HTTPS| FE
    U -->|HTTPS| API
    ZM -->|HTTPS| API
    ZW -->|POST /zoom/webhook| API
    FE -->|HTTPS| API
    API -->|TLS| PG
    API -->|HTTPS| ZOAUTH
    API -->|HTTPS| ZAPI
    FE -.->|Load SDK| ZSDK
    ENV -.-> API
    API -.->|Read/Write| PG
```

---

## 8. Prompt for Flowchart Tool

Copy and paste this prompt into any AI flowchart tool (Mermaid Live, draw.io AI, Lucidchart AI, Eraser.io, etc.):

```
Generate an architectural diagram for a Zoom-integrated Quran education platform with these components:

LAYERS (top to bottom):

1. CLIENT LAYER:
   - Teacher Browser (React SPA on Vercel)
   - Student Browser (React SPA on Vercel)
   - Admin Browser (React SPA on Vercel)

2. CDN LAYER:
   - Vercel Edge Network (static assets, HTTPS)

3. API LAYER:
   - NestJS Backend Server (Render, port 3000)
   - JWT Authentication Guard
   - Role-Based Access Control (SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT)
   - Encryption Service (AES-256-GCM)
   - Webhook Handler (HMAC-SHA256 signature verification)

4. DATABASE LAYER:
   - PostgreSQL on Neon (encrypted connections)
   - Tables: zoom_integrations (encrypted tokens), class_sessions, student_attendance, processed_webhooks, users, teachers

5. ZOOM PLATFORM:
   - Zoom OAuth API (zoom.us/oauth) — Authorization Code Flow
   - Zoom REST API v2 (api.zoom.us) — Meetings, Users, Reports, ZAK tokens
   - Zoom Webhooks (Event Subscriptions) — meeting.started, meeting.ended, participant_joined, participant_left
   - Zoom Meeting SDK (Embed JS) — In-app classroom

CONNECTIONS:
- Users → HTTPS → Vercel CDN → HTTPS → NestJS API
- NestJS API → TLS → PostgreSQL
- NestJS API → HTTPS → Zoom OAuth (token exchange)
- NestJS API → HTTPS → Zoom REST API (meeting management)
- Zoom Webhooks → POST → NestJS /zoom/webhook (signature verified)
- Vercel → Load → Zoom Meeting SDK JS

SECURITY ANNOTATIONS:
- All traffic: TLS 1.2+
- OAuth tokens: AES-256-GCM encrypted at rest
- Webhooks: HMAC-SHA256 signature + timing-safe comparison
- Authentication: JWT with bcrypt passwords
- CSRF: OAuth state parameter (32-byte, single-use, 10-min TTL)
```
