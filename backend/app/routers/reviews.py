import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_tutor
from ..models import Review, Submission, User
from ..schemas import ReviewCreate, ReviewOut

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
