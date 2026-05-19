import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, SessionLocal
from . import models
from .routers import auth, users, techniques, weeks, assignments, submissions, reviews, journal
from .core.config import settings
from .core.security import get_password_hash

models.Base.metadata.create_all(bind=engine)

with engine.connect() as _conn:
    _conn.execute(text(
        "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS feedback_video_path VARCHAR"
    ))
    _conn.commit()

def _seed():
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.email == settings.TUTOR_EMAIL).first():
            db.add(models.User(
                id=uuid.uuid4(),
                email=settings.TUTOR_EMAIL,
                name=settings.TUTOR_NAME,
                hashed_password=get_password_hash(settings.TUTOR_PASSWORD),
                role=models.UserRole.tutor,
            ))
        for name in ["Guard", "Guard Passing", "Takedown", "Escape",
                     "Submission", "Mount", "Back Control", "Side Control"]:
            if not db.query(models.TechniqueCategory).filter(models.TechniqueCategory.name == name).first():
                db.add(models.TechniqueCategory(id=uuid.uuid4(), name=name))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

_seed()

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
