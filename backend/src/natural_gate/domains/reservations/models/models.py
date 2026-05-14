from pydantic import BaseModel, ConfigDict, Field


class Reservation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    car_id: int
    customer_name: str
    email: str
    phone: str
    pickup_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    pickup_location: str
    total_price: int
    status: str  # confirmada, en_curso, completada, cancelada
    payment_status: str  # pending, paid, refunded
    created_at: str
