from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
from .database import get_db
from .models import User, UserRole
from .core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_tutor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.tutor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tutor access required")
    return current_user


def get_current_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student access required")
    return current_user


def get_optional_user_from_token(
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Used for video streaming endpoints that pass token as query param."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == payload.get("sub")).first()
