#!/usr/bin/env python3
"""Run once to seed the database with a tutor account and default categories."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models
from app.core.security import get_password_hash
from app.core.config import settings
import uuid


def seed():
    models.Base.metadata.create_all(bind=engine)
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
            print(f"Created tutor: {settings.TUTOR_EMAIL} / {settings.TUTOR_PASSWORD}")

        default_categories = [
            "Guard", "Guard Passing", "Takedown", "Escape",
            "Submission", "Mount", "Back Control", "Side Control",
        ]
        for name in default_categories:
            if not db.query(models.TechniqueCategory).filter(models.TechniqueCategory.name == name).first():
                db.add(models.TechniqueCategory(id=uuid.uuid4(), name=name))
                print(f"Created category: {name}")

        db.commit()
        print("Seed complete.")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
