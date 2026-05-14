"""Unit tests for reservation domain."""

import pytest

from natural_gate.core.exceptions import BusinessRuleError, ResourceNotFoundError
from natural_gate.domains.reservations.orchestrator.application_service import ReservationService


@pytest.fixture
def reservation_service() -> ReservationService:
    return ReservationService()


def test_create_reservation_success(reservation_service: ReservationService, db_session) -> None:
    res = reservation_service.create_reservation(
        db=db_session,
        car_id=2,
        customer_name="Test User",
        email="test@example.com",
        phone="+34 600 000 000",
        pickup_date="2026-06-01",
        return_date="2026-06-05",
        pickup_location="Aeropuerto de Valencia",
    )
    assert res.status == "confirmada"
    assert res.total_price == 180


def test_create_reservation_car_not_found(reservation_service: ReservationService, db_session) -> None:
    with pytest.raises(ResourceNotFoundError):
        reservation_service.create_reservation(
            db=db_session,
            car_id=999,
            customer_name="Test",
            email="test@example.com",
            phone="123",
            pickup_date="2026-06-01",
            return_date="2026-06-05",
            pickup_location="Valencia",
        )


def test_create_reservation_invalid_dates(reservation_service: ReservationService, db_session) -> None:
    with pytest.raises(BusinessRuleError):
        reservation_service.create_reservation(
            db=db_session,
            car_id=2,
            customer_name="Test",
            email="test@example.com",
            phone="123",
            pickup_date="2026-06-05",
            return_date="2026-06-01",
            pickup_location="Valencia",
        )


def test_search_reservations(reservation_service: ReservationService, db_session) -> None:
    results = reservation_service.search_reservations(db=db_session, query="maria")
    assert len(results) >= 1
    assert all("maria" in r.email.lower() for r in results)


def test_cancel_reservation(reservation_service: ReservationService, db_session) -> None:
    res = reservation_service.cancel_reservation(db=db_session, res_id="RES-A1B2C3")
    assert res.status == "cancelada"


def test_cancel_reservation_not_found(reservation_service: ReservationService, db_session) -> None:
    with pytest.raises(ResourceNotFoundError):
        reservation_service.cancel_reservation(db=db_session, res_id="RES-UNKNOWN")
