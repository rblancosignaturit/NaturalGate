"""Shared pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from natural_gate.main import app
from natural_gate.shared.infrastructure.database import get_db
from natural_gate.shared.infrastructure.orm_models import Base
from natural_gate.shared.infrastructure.seed import seed_cars, seed_reservations


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh SQLite in-memory database seeded with sample data."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    seed_cars(session)
    seed_reservations(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """Return a TestClient with DB dependency overridden."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
