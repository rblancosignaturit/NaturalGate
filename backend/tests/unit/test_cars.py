"""Unit tests for car domain."""

import pytest

from natural_gate.domains.cars.models.models import Car
from natural_gate.domains.cars.orchestrator.application_service import CarService


@pytest.fixture
def car_service() -> CarService:
    return CarService()


def test_list_cars_no_filter(car_service: CarService, db_session) -> None:
    cars = car_service.list_cars(db=db_session)
    assert len(cars) == 8


def test_list_cars_by_brand(car_service: CarService, db_session) -> None:
    cars = car_service.list_cars(db=db_session, brand="BMW")
    assert len(cars) == 1
    assert cars[0].brand == "BMW"


def test_list_cars_by_type(car_service: CarService, db_session) -> None:
    cars = car_service.list_cars(db=db_session, car_type="SUV")
    assert len(cars) == 2


def test_list_cars_by_price_range(car_service: CarService, db_session) -> None:
    cars = car_service.list_cars(db=db_session, min_price=70, max_price=90)
    assert all(70 <= c.price_per_day <= 90 for c in cars)


def test_get_car_found(car_service: CarService, db_session) -> None:
    car = car_service.get_car(db=db_session, car_id=1)
    assert car is not None
    assert car.id == 1


def test_get_car_not_found(car_service: CarService, db_session) -> None:
    car = car_service.get_car(db=db_session, car_id=999)
    assert car is None
