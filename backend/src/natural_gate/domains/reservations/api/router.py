from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from natural_gate.core.exceptions import ResourceNotFoundError, BusinessRuleError
from natural_gate.domains.cars.models.models import Car
from natural_gate.domains.reservations.api.schemas import ReservationCreateRequest
from natural_gate.domains.reservations.orchestrator.application_service import reservation_service
from natural_gate.shared.infrastructure.database import get_db
from natural_gate.shared.infrastructure.orm_models import CarORM
from sqlalchemy import select

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


def _enrich(res, db: Session) -> dict:
    car = db.execute(select(CarORM).where(CarORM.id == res.car_id)).scalar_one_or_none()
    d = res.model_dump()
    d["car"] = Car.model_validate(car).model_dump(by_alias=True) if car else {}
    return d


@router.post("")
def create_reservation(
    payload: ReservationCreateRequest, db: Session = Depends(get_db)
) -> dict:
    try:
        res = reservation_service.create_reservation(
            db=db,
            car_id=payload.car_id,
            customer_name=payload.customer_name,
            email=payload.email,
            phone=payload.phone,
            pickup_date=payload.pickup_date,
            return_date=payload.return_date,
            pickup_location=payload.pickup_location,
        )
        return _enrich(res, db)
    except (ResourceNotFoundError, BusinessRuleError) as e:
        raise HTTPException(
            status_code=400 if isinstance(e, BusinessRuleError) else 404, detail=str(e)
        )


@router.get("/search")
def search_reservations(
    q: Optional[str] = Query(None), db: Session = Depends(get_db)
) -> list[dict]:
    results = reservation_service.search_reservations(db=db, query=q)
    return [_enrich(r, db) for r in results]


@router.post("/{res_id}/cancel")
def cancel_reservation(res_id: str, db: Session = Depends(get_db)) -> dict:
    try:
        res = reservation_service.cancel_reservation(db=db, res_id=res_id)
        return _enrich(res, db)
    except (ResourceNotFoundError, BusinessRuleError) as e:
        raise HTTPException(
            status_code=400 if isinstance(e, BusinessRuleError) else 404, detail=str(e)
        )
