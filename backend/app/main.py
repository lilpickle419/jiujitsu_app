from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, users, techniques, weeks, assignments, submissions, reviews

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jiu-Jitsu Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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


@app.get("/health")
def health():
    return {"status": "ok"}
