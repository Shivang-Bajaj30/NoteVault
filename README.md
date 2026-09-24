# 📚 NoteVault

A reputation-moderated study notes platform — students discover trusted notes, moderators earn publishing rights, and admins run verification and moderation from a full console.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + React Router, Tailwind, React Query, accessible Radix UI primitives |
| Backend | Spring Boot 3 (Java 21) + Spring Security + JWT |
| Database | MongoDB Atlas (Spring Data MongoDB) |
| Streaming | MongoDB event mirror by default; optional Kafka producer and Kafka Streams event counter |

## Run locally

### Backend (MongoDB required)

Set these environment variables before starting the backend (or add them to your IDE run configuration):

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=cluster1
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:*,https://*.onrender.com
```

```bash
cd backend
mvn spring-boot:run        # or: java -cp "target/classes;$(cat target/cp.txt)" com.notvault.backend.BackendApplication
```

The app connects to the `notevault` database. On a **fresh/empty** database it seeds demo data (4 accounts, 3 classes, 6 notes, a report, a moderator request). Mutations and event records are stored in MongoDB. Set `VITE_DEMO_MODE=true` in the frontend only to show shortcuts that authenticate against those seeded demo accounts; those are real backend logins, not local mock identities.

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` if the API is not at `http://localhost:8080`.

### Kafka event processing (optional)

The application persists every domain event to MongoDB. To mirror these records into Kafka, start a Kafka broker and set `KAFKA_BOOTSTRAP_SERVERS` and `NOTEVAULT_KAFKA_ENABLED=true` for the backend. Start the streams service with the same broker address and `NOTEVAULT_STREAMS_ENABLED=true`. Its topology consumes `notevault.events`, groups by `topic:type`, and writes running counts to `notevault.event-counts`. Create these topics with partitions/retention appropriate to your broker. Set `NOTEVAULT_STREAMS_HEALTH_URL` if the backend cannot reach the streams service at `http://localhost:8081`. Without a broker, the MongoDB mirror remains available; consumer lag is shown as unavailable until a metrics source is configured.

### Demo accounts (password: `password123`)

| Email | Role | What to try |
|---|---|---|
| admin@notevault.com | Admin | Review queue, reports, mod requests, analytics, audit log |
| aisha@notevault.com | Trusted moderator | Upload → publishes instantly |
| diego@notevault.com | Unproven moderator (2/5) | Upload → goes to pending; reach 5 approvals → auto-trusted |
| student@notevault.com | Student | Search, download, report notes |

## Frontend redesign

The interface includes a public landing page, authentication, student dashboard, note catalog, search, moderator uploads, and an admin console. All data flows through the configured backend API; API failures are surfaced instead of replaced with browser-local sample data.

Search currently uses backend keyword matching. AI chat, semantic retrieval, and signed download URLs are not implemented. Uploaded documents are stored in MongoDB GridFS and are downloaded through the authenticated backend API.

## Architecture

```
Controller (HTTP + RBAC)   →  Service (domain rules)   →  DataStore  →  MongoDB Atlas
     │                            │
     │ AuthContext (JWT)          │ TrustService — reputation rules in one place
     │                            │ NoteService — upload gating, review, delete
     │                            │ ReportService — reports + trust safety net
     │                            │ ModeratorVerificationService — approval workflow
     │                            │ ClassService — admin-only class creation
     └─ every mutation emits a stream event (audit-stream, note-events, ...)
```

**Trust flow** (`TrustService`): admin approves an upload → moderator gets +1 clean upload → at **5** the moderator flips to `isTrusted` → their uploads auto-publish. A **valid report** against a trusted moderator resets their trust to zero.

## API overview

| Endpoint | Role | Purpose |
|---|---|---|
| `POST /api/auth/signup` | public | Student account (or moderator request) |
| `POST /api/auth/login` | public | JWT login |
| `GET /api/notes?q=&classId=` | public | Catalog + keyword search (approved only) |
| `POST /api/notes` (multipart form: `file`, `title`, metadata) | moderator/admin | Store document in GridFS and create note (pending unless trusted) |
| `POST /api/notes/{id}/delete` | owner/admin | Soft delete |
| `POST /api/reports` | any user | Report a note |
| `POST /api/admin/notes/{id}/review` | admin | Approve/reject + trust engine |
| `POST /api/reports/{id}/resolve` | admin | Mark valid (trust reset) / dismissed |
| `POST /api/moderator-requests/{id}/review` | admin | Verify moderator |
| `GET /api/admin/analytics` | admin | Totals, uploads/subject, trust counts |
| `GET /api/admin/streams` · `/events` | admin | Durable event mirror and current publishing mode |
| `GET /api/admin/audit` | admin | Audit trail |

## Collections

`users`, `classes`, `notes`, `reports`, `moderatorRequests`, `auditLogs`, `streamEvents`

## Remaining integrations

- Atlas Vector Search embeddings for semantic search (`/api/notes/search` is the seam)
- Signed download URLs
- Kafka broker heartbeat and consumer lag metrics


