"""Car domain models."""

from pydantic import BaseModel, ConfigDict, Field


class Car(BaseModel):
    """Represents a vehicle available for rent."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    brand: str
    model: str
    year: int
    car_type: str = Field(..., alias="type")
    seats: int
    fuel: str
    transmission: str
    price_per_day: int
    color: str
    description: str
    equipment: list[str]
    mileage_policy: str
    image_emoji: str
    location: str = ""
    available: bool = True
