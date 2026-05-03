import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..dependencies import get_current_user, get_optional_user_from_token
from ..models import Submission, StudentWeekTechnique, User, UserRole, Week
from ..schemas import SubmissionOut

router = APIRouter(prefix="/submissions", tags=["submissions"])

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/avi"}


def _submission_path(student_id: uuid.UUID, week_id: uuid.UUID, technique_id: uuid.UUID, ext: str) -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    folder = upload_dir / str(student_id) / str(week_id)
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{technique_id}{ext}"


@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def upload_submission(
    week_id: uuid.UUID,
    technique_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can submit videos")

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Only video files are accepted")

    assignment = db.query(StudentWeekTechnique).filter(
        StudentWeekTechnique.student_id == current_user.id,
        StudentWeekTechnique.week_id == week_id,
        StudentWeekTechnique.technique_id == technique_id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="This technique is not assigned to you for this week")

    existing = db.query(Submission).filter(
        Submission.student_id == current_user.id,
        Submission.week_id == week_id,
        Submission.technique_id == technique_id,
    ).first()

    if existing and existing.review and not existing.review.requires_resubmission:
        raise HTTPException(status_code=400, detail="This submission has already been reviewed. Re-upload is only allowed when the tutor marks it for resubmission.")

    ext = Path(file.filename).suffix.lower() if file.filename else ".mp4"
    dest = _submission_path(current_user.id, week_id, technique_id, ext)

    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    if existing:
        if existing.review:
            db.delete(existing.review)
        existing.video_path = str(dest)
        from sqlalchemy.sql import func
        existing.uploaded_at = func.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        submission = Submission(
            id=uuid.uuid4(),
            student_id=current_user.id,
            week_id=week_id,
            technique_id=technique_id,
            video_path=str(dest),
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission


@router.get("/student/{student_id}/week/{week_id}", response_model=List[SubmissionOut])
def get_student_week_submissions(
    student_id: uuid.UUID,
    week_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Submission).filter(
        Submission.student_id == student_id,
        Submission.week_id == week_id,
    ).all()


@router.get("/my/week/{week_id}", response_model=List[SubmissionOut])
def my_week_submissions(
    week_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Submission).filter(
        Submission.student_id == current_user.id,
        Submission.week_id == week_id,
    ).all()


@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role == UserRole.student and current_user.id != sub.student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return sub


@router.get("/{submission_id}/video")
def stream_video(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user_from_token),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role == UserRole.student and current_user.id != sub.student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    path = Path(sub.video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(path, media_type="video/mp4")
