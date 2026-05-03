from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, UserRole
from ..schemas import UserOut
from ..dependencies import get_current_tutor

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/students", response_model=List[UserOut])
def list_students(
    db: Session = Depends(get_db),
    _tutor: User = Depends(get_current_tutor),
):
    return db.query(User).filter(User.role == UserRole.student).order_by(User.name).all()
