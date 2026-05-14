from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from natural_gate.core.exceptions import ResourceNotFoundError, BusinessRuleError
from natural_gate.domains.reservations.models.models import Reservation
from natural_gate.shared.infrastructure.orm_models import CarORM, ReservationORM


class ReservationService:
    def create_reservation(
        self,
        db: Session,
        car_id: int,
        customer_name: str,
        email: str,
        phone: str,
        pickup_date: str,
        return_date: str,
        pickup_location: str,
    ) -> Reservation:
        car = db.execute(select(CarORM).where(CarORM.id == car_id)).scalar_one_or_none()
        if not car:
            raise ResourceNotFoundError("Car not found")

        pickup = datetime.strptime(pickup_date, "%Y-%m-%d")
        ret = datetime.strptime(return_date, "%Y-%m-%d")
        if ret <= pickup:
            raise BusinessRuleError("Return date must be after pickup date.")

        days = (ret - pickup).days
        total = days * car.price_per_day

        reservation = Reservation(
            id=f"RES-{uuid.uuid4().hex[:6].upper()}",
            car_id=car_id,
            customer_name=customer_name,
            email=email,
            phone=phone,
            pickup_date=pickup_date,
            return_date=return_date,
            pickup_location=pickup_location,
            total_price=total,
            status="confirmada",
            payment_status="pending",
            created_at=datetime.now().isoformat(),
        )
        orm = ReservationORM(**reservation.model_dump())
        db.add(orm)
        db.commit()
        return reservation

    def search_reservations(self, db: Session, query: Optional[str]) -> list[Reservation]:
        if not query or not query.strip():
            return []
        q = query.strip().lower()
        stmt = select(ReservationORM).where(
            (ReservationORM.email.ilike(f"%{q}%")) | (ReservationORM.id.ilike(f"%{q}%"))
        )
        results = db.execute(stmt).scalars().all()
        return [Reservation.model_validate(r) for r in results]

    def cancel_reservation(self, db: Session, res_id: str) -> Reservation:
        orm = db.execute(
            select(ReservationORM).where(ReservationORM.id == res_id)
        ).scalar_one_or_none()
        if not orm:
            raise ResourceNotFoundError("Reservation not found")
        if orm.status not in ("confirmada",):
            raise BusinessRuleError("Only confirmed reservations can be cancelled.")
        orm.status = "cancelada"
        db.commit()
        return Reservation.model_validate(orm)


reservation_service = ReservationService()
