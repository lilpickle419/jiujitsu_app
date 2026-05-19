from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine
from . import models
from .routers import auth, users, techniques, weeks, assignments, submissions, reviews, journal
from .core.config import settings

models.Base.metadata.create_all(bind=engine)

with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS feedback_video_path VARCHAR"
    ))
    _conn.commit()

app = FastAPI(title="Jiu-Jitsu Dashboard API")

allowed_origins = ["http://localhost:5173"]
if settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(techniques.router)
app.include_router(weeks.router)
app.include_router(assignments.router)
app.include_router(submissions.router)
app.include_router(reviews.router)
app.include_router(journal.router)


@app.get("/health")
def health():
    return {"status": "ok"}
