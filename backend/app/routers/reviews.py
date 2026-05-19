import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..dependencies import get_current_tutor, get_optional_user_from_token
from ..models import Review, Submission, User, UserRole
from ..schemas import ReviewCreate, ReviewOut

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/avi"}

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/submission/{submission_id}", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    submission_id: uuid.UUID,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    tutor: User = Depends(get_current_tutor),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.review:
        raise HTTPException(status_code=400, detail="Submission already has a review. Use PUT to update.")

    review = Review(
        id=uuid.uuid4(),
        submission_id=submission_id,
        tutor_id=tutor.id,
        rating=data.rating,
        notes=data.notes,
        requires_resubmission=data.requires_resubmission,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: uuid.UUID,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    tutor: User = Depends(get_current_tutor),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.rating = data.rating
    review.notes = data.notes
    review.requires_resubmission = data.requires_resubmission
    db.commit()
    db.refresh(review)
    return review


@router.get("/submission/{submission_id}", response_model=ReviewOut)
def get_review(
    submission_id: uuid.UUID,
    db: Session = Depends(get_db),
    _tutor: User = Depends(get_current_tutor),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub or not sub.review:
        raise HTTPException(status_code=404, detail="Review not found")
    return sub.review


@router.post("/{review_id}/feedback-video", response_model=ReviewOut)
async def upload_feedback_video(
    review_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tutor: User = Depends(get_current_tutor),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail="Only video files are accepted")

    upload_dir = Path(settings.UPLOAD_DIR) / "feedback"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower() if file.filename else ".mp4"
    dest = upload_dir / f"{review_id}{ext}"

    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    review.feedback_video_path = str(dest)
    db.commit()
    db.refresh(review)
    return review


@router.get("/{review_id}/feedback-video")
def serve_feedback_video(
    review_id: uuid.UUID,
    db: Session = Depends(get_db),
    token: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_user_from_token),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if current_user.role == UserRole.student and review.submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not review.feedback_video_path:
        raise HTTPException(status_code=404, detail="No feedback video uploaded")

    path = Path(review.feedback_video_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(path, media_type="video/mp4")
