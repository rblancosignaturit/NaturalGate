from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from natural_gate.domains.cars.orchestrator.application_service import car_service
from natural_gate.shared.infrastructure.database import get_db

router = APIRouter(prefix="/api/cars", tags=["cars"])


@router.get("")
def list_cars(
    db: Session = Depends(get_db),
    brand: Optional[str] = Query(None),
    car_type: Optional[str] = Query(None, alias="type"),
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    available: Optional[bool] = Query(None),
    location: Optional[str] = Query(None),
) -> list[dict]:
    cars = car_service.list_cars(
        db=db,
        brand=brand,
        car_type=car_type,
        min_price=min_price,
        max_price=max_price,
        available=available,
        location=location,
    )
    return [c.model_dump(by_alias=True) for c in cars]


@router.get("/{car_id}")
def get_car(car_id: int, db: Session = Depends(get_db)) -> dict:
    car = car_service.get_car(db=db, car_id=car_id)
    if car is None:
        raise HTTPException(status_code=404, detail="Car not found")
    return car.model_dump(by_alias=True)
