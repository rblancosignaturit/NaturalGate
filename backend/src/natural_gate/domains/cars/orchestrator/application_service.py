"""Car domain application service."""

from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from natural_gate.domains.cars.models.models import Car
from natural_gate.shared.infrastructure.orm_models import CarORM


class CarService:
    """Application service for car-related use cases."""

    def list_cars(
        self,
        db: Session,
        brand: Optional[str] = None,
        car_type: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        available: Optional[bool] = None,
        location: Optional[str] = None,
    ) -> list[Car]:
        """Return filtered list of cars."""
        stmt = select(CarORM)
        if brand:
            stmt = stmt.where(CarORM.brand.ilike(brand))
        if car_type and car_type != "Todos":
            stmt = stmt.where(CarORM.car_type.ilike(car_type))
        if min_price is not None:
            stmt = stmt.where(CarORM.price_per_day >= min_price)
        if max_price is not None:
            stmt = stmt.where(CarORM.price_per_day <= max_price)
        if available is not None:
            stmt = stmt.where(CarORM.available == available)
        if location:
            stmt = stmt.where(CarORM.location.ilike(location))
        results = db.execute(stmt).scalars().all()
        return [Car.model_validate(r) for r in results]

    def get_car(self, db: Session, car_id: int) -> Optional[Car]:
        """Return a single car by ID."""
        result = db.execute(select(CarORM).where(CarORM.id == car_id)).scalar_one_or_none()
        return Car.model_validate(result) if result else None


car_service = CarService()
