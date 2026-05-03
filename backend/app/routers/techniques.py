from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from ..models import Technique, TechniqueCategory, User
from ..schemas import TechniqueCreate, TechniqueOut, TechniqueCategoryCreate, TechniqueCategoryOut
from ..dependencies import get_current_user, get_current_tutor

router = APIRouter(prefix="/techniques", tags=["techniques"])


@router.get("/categories", response_model=List[TechniqueCategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(TechniqueCategory).order_by(TechniqueCategory.name).all()


@router.post("/categories", response_model=TechniqueCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: TechniqueCategoryCreate,
    db: Session = Depends(get_db),
    _tutor: User = Depends(get_current_tutor),
):
    if db.query(TechniqueCategory).filter(TechniqueCategory.name == data.name).first():
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = TechniqueCategory(id=uuid.uuid4(), name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("", response_model=List[TechniqueOut])
def list_techniques(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(Technique).order_by(Technique.name).all()


@router.post("", response_model=TechniqueOut, status_code=status.HTTP_201_CREATED)
def create_technique(
    data: TechniqueCreate,
    db: Session = Depends(get_db),
    tutor: User = Depends(get_current_tutor),
):
    if not db.query(TechniqueCategory).filter(TechniqueCategory.id == data.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    technique = Technique(
        id=uuid.uuid4(),
        name=data.name,
        description=data.description,
        category_id=data.category_id,
        reference_url=data.reference_url,
        created_by=tutor.id,
    )
    db.add(technique)
    db.commit()
    db.refresh(technique)
    return technique


@router.get("/{technique_id}", response_model=TechniqueOut)
def get_technique(
    technique_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    t = db.query(Technique).filter(Technique.id == technique_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Technique not found")
    return t
