# 📚 NoteVault

A reputation-moderated study notes platform with an **AI Study Tutor & Chatbot** — students discover trusted notes, chat with an AI assistant to analyze documents, practice with generated quizzes and flashcards, while moderators earn publishing rights and admins verify content.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + React Router, Tailwind, React Query, accessible Radix UI primitives |
| Backend | Python 3.12 (FastAPI + Uvicorn + PyJWT + BCrypt) |
| Database & Storage | MongoDB Atlas (PyMongo) + GridFS document store |
| AI Study Engine | Google Gemini (`google-generativeai`) + Smart Academic NLP Fallback |
| Event Observability | Direct MongoDB durable event log & audit trail (Kafka streams retired) |

## Run locally

### Backend (Python)

1. Make sure Python 3.10+ is installed.
2. Navigate to `backend` and install requirements:

```bash
cd backend
pip install -r requirements.txt
```

3. Ensure `.env` is configured (or copy `backend/.env.example` to `backend/.env`):

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=cluster1
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key-here   # Optional; intelligent fallback runs offline
```

4. Run the Python backend:

```bash
python main.py
```

The API starts on `http://localhost:8080/api` (Swagger docs available at `http://localhost:8080/docs`). On startup, demo accounts and sample classes are automatically verified and seeded.

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Set `VITE_API_BASE_URL=http://localhost:8080/api` in `frontend/.env.local`.

### AI Study Chatbot & Content Generator

The Python backend provides full conversational and study generation endpoints:
- **Interactive Chatbot (`POST /api/notes/{id}/chat`)**: Multi-turn Q&A grounded in the note's text and metadata.
- **Study Analysis (`POST /api/notes/{id}/study/analyze`)**: Generates executive summaries, key concepts, and structured outlines.
- **Practice Quizzes (`POST /api/notes/{id}/study/quiz`)**: Generates 4-option multiple-choice questions with answers and detailed explanations.
- **Flashcards (`POST /api/notes/{id}/study/flashcards`)**: Spaced-repetition study cards with flip review.
- **General Study Chat (`POST /api/chat`)**: Cross-subject academic companion.

### Demo accounts (password: `password123`)

| Email | Role | What to try |
|---|---|---|
| admin@notevault.com | Admin | Review queue, reports, mod requests, analytics, AI engine observability |
| aisha@notevault.com | Trusted moderator | Upload → publishes instantly (cleanUploadCount >= 5) |
| diego@notevault.com | Unproven moderator (2/5) | Upload → goes to pending; reach 5 approvals → auto-trusted |
| student@notevault.com | Student | Search notes, study with AI Chatbot, take quizzes, flip flashcards |

## API overview

| Endpoint | Role | Purpose |
|---|---|---|
| `POST /api/auth/signup` | public | Student account (or moderator request) |
| `POST /api/auth/login` | public | JWT login |
| `GET /api/notes?q=&classId=` | public | Catalog + keyword search (approved only) |
| `POST /api/notes` (multipart form) | moderator/admin | Store document in GridFS and create note |
| `GET /api/notes/{id}/file` | public/owner | Download original document from GridFS |
| `POST /api/notes/{id}/chat` | public | Chat with AI about the note |
| `POST /api/notes/{id}/study/analyze` | public | Generate deep study breakdown |
| `POST /api/notes/{id}/study/quiz` | public | Generate practice multiple-choice quiz |
| `POST /api/notes/{id}/study/flashcards` | public | Generate study flashcards |
| `POST /api/notes/{id}/delete` | owner/admin | Soft delete note |
| `POST /api/reports` | any user | Report a note |
| `POST /api/admin/notes/{id}/review` | admin | Approve/reject + trust engine |
| `POST /api/reports/{id}/resolve` | admin | Mark valid (trust reset) / dismissed |
| `POST /api/moderator-requests/{id}/review` | admin | Verify moderator |
| `GET /api/admin/analytics` | admin | Totals, uploads/subject, trust counts |
| `GET /api/admin/streams` · `/events` | admin | Durable event mirror and AI engine status |
