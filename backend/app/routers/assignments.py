from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import User, StudentWeekTechnique, Technique, Week, UserRole
from ..schemas import AssignTechniquesRequest, AssignmentOut
from ..dependencies import get_current_user, get_current_tutor

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=List[AssignmentOut], status_code=status.HTTP_201_CREATED)
def assign_techniques(
    data: AssignTechniquesRequest,
    db: Session = Depends(get_db),
    tutor: User = Depends(get_current_tutor),
):
    student = db.query(User).filter(User.id == data.student_id, User.role == UserRole.student).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    week = db.query(Week).filter(Week.id == data.week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    created = []
    for technique_id in data.technique_ids:
        technique = db.query(Technique).filter(Technique.id == technique_id).first()
        if not technique:
            raise HTTPException(status_code=404, detail=f"Technique {technique_id} not found")
        existing = db.query(StudentWeekTechnique).filter(
            StudentWeekTechnique.student_id == data.student_id,
            StudentWeekTechnique.week_id == data.week_id,
            StudentWeekTechnique.technique_id == technique_id,
        ).first()
        if not existing:
            assignment = StudentWeekTechnique(
                id=uuid.uuid4(),
                student_id=data.student_id,
                week_id=data.week_id,
                technique_id=technique_id,
                assigned_by=tutor.id,
            )
            db.add(assignment)
            created.append(assignment)

    db.commit()
    for a in created:
        db.refresh(a)
    return created


@router.get("/student/{student_id}/week/{week_id}", response_model=List[AssignmentOut])
def get_student_week_assignments(
    student_id: uuid.UUID,
    week_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(StudentWeekTechnique).filter(
        StudentWeekTechnique.student_id == student_id,
        StudentWeekTechnique.week_id == week_id,
    ).all()


@router.get("/my/week/{week_id}", response_model=List[AssignmentOut])
def my_week_assignments(
    week_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(StudentWeekTechnique).filter(
        StudentWeekTechnique.student_id == current_user.id,
        StudentWeekTechnique.week_id == week_id,
    ).all()


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_assignment(
    assignment_id: uuid.UUID,
    db: Session = Depends(get_db),
    _tutor: User = Depends(get_current_tutor),
):
    assignment = db.query(StudentWeekTechnique).filter(StudentWeekTechnique.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
