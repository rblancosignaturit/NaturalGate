"""Initialize database: create tables and seed data."""

from natural_gate.shared.infrastructure.database import engine, Base
from natural_gate.shared.infrastructure.orm_models import CarORM, ReservationORM
from natural_gate.shared.infrastructure.seed import seed_cars, seed_reservations
from sqlalchemy.orm import Session


def init_db() -> None:
    """Create all tables and seed sample data."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Seed data if tables are empty
    with Session(engine) as session:
        car_count = session.query(CarORM).count()
        if car_count == 0:
            seed_cars(session)
            seed_reservations(session)
            print("Database seeded successfully.")
        else:
            print("Database already seeded, skipping.")


if __name__ == "__main__":
    init_db()
