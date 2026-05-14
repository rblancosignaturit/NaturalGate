"""SQLAlchemy ORM models for PostgreSQL persistence."""

from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, ForeignKey

from natural_gate.shared.infrastructure.database import Base


class CarORM(Base):
    """SQLAlchemy representation of a car."""

    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    car_type = Column("type", String, nullable=False)
    seats = Column(Integer, nullable=False)
    fuel = Column(String, nullable=False)
    transmission = Column(String, nullable=False)
    price_per_day = Column(Integer, nullable=False)
    color = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    equipment = Column(JSON, default=list)
    mileage_policy = Column(String, nullable=False)
    image_emoji = Column(String, nullable=False)
    location = Column(String, default="")
    available = Column(Boolean, default=True)


class ReservationORM(Base):
    """SQLAlchemy representation of a reservation."""

    __tablename__ = "reservations"

    id = Column(String, primary_key=True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    pickup_date = Column(String, nullable=False)
    return_date = Column(String, nullable=False)
    pickup_location = Column(String, nullable=False)
    total_price = Column(Integer, nullable=False)
    status = Column(String, nullable=False)
    payment_status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
