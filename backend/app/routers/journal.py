import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_student
from ..models import JournalEntry, User
from ..schemas import JournalEntryCreate, JournalEntryOut

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=List[JournalEntryOut])
def list_entries(
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    return (
        db.query(JournalEntry)
        .filter(JournalEntry.student_id == student.id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )


@router.post("", response_model=JournalEntryOut, status_code=status.HTTP_201_CREATED)
def create_entry(
    data: JournalEntryCreate,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    entry = JournalEntry(
        id=uuid.uuid4(),
        student_id=student.id,
        name=data.name,
        description=data.description,
        notes=data.notes,
        reference_url=data.reference_url,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=JournalEntryOut)
def update_entry(
    entry_id: uuid.UUID,
    data: JournalEntryCreate,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    entry.name = data.name
    entry.description = data.description
    entry.notes = data.notes
    entry.reference_url = data.reference_url
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student),
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.student_id == student.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    db.delete(entry)
    db.commit()
