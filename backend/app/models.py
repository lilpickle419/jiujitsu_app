import enum
import uuid
from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, DateTime, Enum as SAEnum,
    ForeignKey, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class UserRole(str, enum.Enum):
    student = "student"
    tutor = "tutor"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assignments = relationship(
        "StudentWeekTechnique", back_populates="student", foreign_keys="StudentWeekTechnique.student_id"
    )
    submissions = relationship(
        "Submission", back_populates="student", foreign_keys="Submission.student_id"
    )
    reviews = relationship("Review", back_populates="tutor")
    created_techniques = relationship("Technique", back_populates="created_by_user")


class TechniqueCategory(Base):
    __tablename__ = "technique_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)

    techniques = relationship("Technique", back_populates="category")


class Technique(Base):
    __tablename__ = "techniques"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey("technique_categories.id"), nullable=False)
    reference_url = Column(String)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("TechniqueCategory", back_populates="techniques")
    created_by_user = relationship("User", back_populates="created_techniques")
    assignments = relationship("StudentWeekTechnique", back_populates="technique")


class Week(Base):
    __tablename__ = "weeks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    __table_args__ = (UniqueConstraint("week_number", "year"),)

    assignments = relationship("StudentWeekTechnique", back_populates="week")
    submissions = relationship("Submission", back_populates="week")


class StudentWeekTechnique(Base):
    __tablename__ = "student_week_techniques"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week_id = Column(UUID(as_uuid=True), ForeignKey("weeks.id"), nullable=False)
    technique_id = Column(UUID(as_uuid=True), ForeignKey("techniques.id"), nullable=False)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("student_id", "week_id", "technique_id"),)

    student = relationship("User", back_populates="assignments", foreign_keys=[student_id])
    tutor = relationship("User", foreign_keys=[assigned_by])
    week = relationship("Week", back_populates="assignments")
    technique = relationship("Technique", back_populates="assignments")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    week_id = Column(UUID(as_uuid=True), ForeignKey("weeks.id"), nullable=False)
    technique_id = Column(UUID(as_uuid=True), ForeignKey("techniques.id"), nullable=False)
    video_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("student_id", "week_id", "technique_id"),)

    student = relationship("User", back_populates="submissions", foreign_keys=[student_id])
    week = relationship("Week", back_populates="submissions")
    technique = relationship("Technique")
    review = relationship("Review", back_populates="submission", uselist=False, cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id"), unique=True, nullable=False)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    notes = Column(Text)
    requires_resubmission = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5"),)

    submission = relationship("Submission", back_populates="review")
    tutor = relationship("User", back_populates="reviews")
