# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Jiu-Jitsu training dashboard with two roles:
- **Tutor** (1, pre-seeded): assigns techniques to students per week, reviews their video submissions
- **Student** (many, self-register): views weekly assignments, uploads practice videos, receives feedback

Stack: FastAPI + PostgreSQL backend, React + Vite + Tailwind CSS frontend.

## Running locally

**Prerequisites:** Docker, Python 3.11+, Node 18+

### 1. Start the database
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit if needed
python seed.py                # creates tutor account + default categories
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Default credentials
- Tutor: `tutor@jitsu.com` / `tutor123`
- Students self-register at `/register`

## Architecture

### Backend (`backend/app/`)

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, router registration, `create_all` on startup |
| `models.py` | All SQLAlchemy ORM models |
| `schemas.py` | All Pydantic request/response schemas |
| `dependencies.py` | `get_current_user`, `get_current_tutor`, `get_current_student` FastAPI deps |
| `database.py` | Engine, `SessionLocal`, `get_db` dependency |
| `core/config.py` | `Settings` (pydantic-settings, reads `.env`) |
| `core/security.py` | JWT encode/decode, bcrypt password hashing |
| `utils/weeks.py` | ISO week calculation, `get_or_create_week`, `get_current_week`, `get_next_week` |

Routers in `routers/`: `auth`, `users`, `techniques`, `weeks`, `assignments`, `submissions`, `reviews`.

### Database schema (key relationships)

```
users ──< student_week_techniques >── weeks
                   │
              techniques
                   
users (student) ──< submissions >── weeks + techniques
submissions ──── reviews (1:1)
```

- **`student_week_techniques`**: tutor assigns a technique to a student for a specific week (unique per student+week+technique)
- **`submissions`**: one per student+week+technique; re-upload replaces `video_path` and deletes the associated review
- **`reviews`**: one per submission; `requires_resubmission=true` unlocks student re-upload

### Video files

Stored at `backend/uploads/{student_id}/{week_id}/{technique_id}.{ext}`.  
Served via `GET /submissions/{id}/video?token={jwt}` (token passed as query param for `<video src>` compatibility).

### Frontend (`frontend/src/`)

| Path | Purpose |
|------|---------|
| `api/` | One file per resource; `client.ts` is the Axios instance with auth interceptor |
| `api/types.ts` | Shared TypeScript interfaces matching backend schemas |
| `context/AuthContext.tsx` | Auth state (user, token), `useAuth()` hook |
| `components/ProtectedRoute.tsx` | Redirects unauthenticated or wrong-role users |
| `pages/student/Dashboard.tsx` | Current week's assignments + video upload |
| `pages/student/History.tsx` | Past weeks, lazy-loaded on expand |
| `pages/tutor/Dashboard.tsx` | All students with current-week submission stats |
| `pages/tutor/StudentDetail.tsx` | Per-student week view: assign techniques, watch videos, submit reviews |
| `pages/tutor/TechniqueLibrary.tsx` | Browse/create techniques and categories |

### Auth flow

1. Login → `POST /auth/login` returns JWT + role
2. Token stored in `localStorage`; attached to all requests via Axios interceptor
3. React Router role-based redirect: students → `/student`, tutor → `/tutor`
4. 401 response → auto-logout and redirect to `/login`

### Week model

Weeks follow ISO 8601 (Monday–Sunday). `get_or_create_week` lazily creates week rows on first access. The tutor assigns techniques to future weeks (typically "next week") in advance.

## Key constraints

- A student can only re-upload a video if the existing review has `requires_resubmission = true`. Re-uploading deletes the old review.
- A submission is unique per `(student, week, technique)`.
- Only the tutor can assign/remove techniques and create/update reviews.
- `seed.py` is idempotent — safe to run multiple times.
