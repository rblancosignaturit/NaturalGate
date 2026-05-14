from pydantic import BaseModel, Field


class ReservationCreateRequest(BaseModel):
    car_id: int
    customer_name: str
    email: str
    phone: str
    pickup_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    pickup_location: str


class ReservationResponse(BaseModel):
    reservation: dict
