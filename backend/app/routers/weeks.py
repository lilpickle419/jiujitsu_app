from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Week
from ..schemas import WeekOut
from ..dependencies import get_current_user
from ..utils.weeks import get_current_week, get_next_week

router = APIRouter(prefix="/weeks", tags=["weeks"])


@router.get("/current", response_model=WeekOut)
def current_week(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return get_current_week(db)


@router.get("/next", response_model=WeekOut)
def next_week(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return get_next_week(db)


@router.get("", response_model=List[WeekOut])
def list_weeks(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(Week).order_by(Week.year.desc(), Week.week_number.desc()).all()


@router.get("/{week_id}", response_model=WeekOut)
def get_week(
    week_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    from fastapi import HTTPException
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    return week
