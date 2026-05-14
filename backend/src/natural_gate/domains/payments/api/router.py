from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from natural_gate.core.exceptions import PaymentServiceError
from natural_gate.domains.payments.models.models import PaymentIntentRequest, PaymentConfirmRequest
from natural_gate.domains.payments.orchestrator.application_service import payment_service
from natural_gate.shared.infrastructure.database import get_db

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/intent")
def create_payment_intent(request: PaymentIntentRequest) -> dict:
    try:
        return payment_service.create_intent(
            amount=request.amount,
            currency=request.currency,
            reservation_id=request.reservation_id,
        )
    except PaymentServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm")
def confirm_payment(request: PaymentConfirmRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return payment_service.confirm_payment(
            db=db,
            payment_intent_id=request.payment_intent_id,
            reservation_id=request.reservation_id,
        )
    except PaymentServiceError as e:
        raise HTTPException(status_code=400, detail=str(e))
