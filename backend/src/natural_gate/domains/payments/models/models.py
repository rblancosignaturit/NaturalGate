from pydantic import BaseModel, Field
from typing import Optional


class PaymentIntentRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Amount in cents")
    currency: str = "eur"
    reservation_id: Optional[str] = None


class PaymentConfirmRequest(BaseModel):
    payment_intent_id: str
    reservation_id: str


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str
    status: str
