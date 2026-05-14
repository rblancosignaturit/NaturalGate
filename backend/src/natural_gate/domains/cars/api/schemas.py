"""Car request and response schemas."""

from pydantic import BaseModel


class CarListResponse(BaseModel):
    """Response wrapper for a list of cars."""

    count: int
    cars: list[dict]
