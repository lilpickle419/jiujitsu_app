from __future__ import annotations
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
from .models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    name: str


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}


class TechniqueCategoryCreate(BaseModel):
    name: str


class TechniqueCategoryOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class TechniqueCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: UUID
    reference_url: Optional[str] = None


class TechniqueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    reference_url: Optional[str] = None


class TechniqueOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    category: TechniqueCategoryOut
    reference_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class WeekOut(BaseModel):
    id: UUID
    week_number: int
    year: int
    start_date: date
    end_date: date

    model_config = {"from_attributes": True}


class AssignTechniquesRequest(BaseModel):
    student_id: UUID
    week_id: UUID
    technique_ids: List[UUID]


class AssignmentOut(BaseModel):
    id: UUID
    week: WeekOut
    technique: TechniqueOut
    assigned_at: datetime

    model_config = {"from_attributes": True}


class JournalEntryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    notes: Optional[str] = None
    reference_url: Optional[str] = None


class JournalEntryOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    notes: Optional[str]
    reference_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    rating: int
    notes: Optional[str] = None
    requires_resubmission: bool = False

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: UUID
    rating: int
    notes: Optional[str]
    requires_resubmission: bool
    feedback_video_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class SubmissionOut(BaseModel):
    id: UUID
    student_id: UUID
    week: WeekOut
    technique: TechniqueOut
    uploaded_at: datetime
    review: Optional[ReviewOut] = None

    model_config = {"from_attributes": True}


class StudentWeekSummary(BaseModel):
    student: UserOut
    week: WeekOut
    assignments: List[AssignmentOut]
    submissions: List[SubmissionOut]
