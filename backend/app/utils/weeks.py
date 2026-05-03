from datetime import date, timedelta
from sqlalchemy.orm import Session
from .. import models
import uuid


def get_iso_week_bounds(year: int, week: int) -> tuple[date, date]:
    jan4 = date(year, 1, 4)
    start_of_week1 = jan4 - timedelta(days=jan4.weekday())
    monday = start_of_week1 + timedelta(weeks=week - 1)
    sunday = monday + timedelta(days=6)
    return monday, sunday


def get_or_create_week(db: Session, year: int, week_number: int) -> models.Week:
    week = db.query(models.Week).filter(
        models.Week.year == year,
        models.Week.week_number == week_number,
    ).first()
    if not week:
        start_date, end_date = get_iso_week_bounds(year, week_number)
        week = models.Week(
            id=uuid.uuid4(),
            week_number=week_number,
            year=year,
            start_date=start_date,
            end_date=end_date,
        )
        db.add(week)
        db.commit()
        db.refresh(week)
    return week


def get_current_week(db: Session) -> models.Week:
    iso = date.today().isocalendar()
    return get_or_create_week(db, iso.year, iso.week)


def get_next_week(db: Session) -> models.Week:
    next_monday = date.today() + timedelta(days=(7 - date.today().weekday()))
    iso = next_monday.isocalendar()
    return get_or_create_week(db, iso.year, iso.week)
