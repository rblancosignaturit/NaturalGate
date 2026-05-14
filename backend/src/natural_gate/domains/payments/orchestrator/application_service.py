import stripe

from sqlalchemy.orm import Session
from sqlalchemy import select

from natural_gate.core.config import settings
from natural_gate.core.exceptions import PaymentServiceError
from natural_gate.shared.infrastructure.orm_models import ReservationORM

stripe.api_key = settings.stripe_secret_key


class PaymentService:
    def create_intent(self, amount: int, currency: str, reservation_id: str | None) -> dict:
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                metadata={"reservation_id": reservation_id or "none"},
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency,
                "status": intent.status,
            }
        except stripe.error.StripeError as e:
            raise PaymentServiceError(str(e))
        except Exception as e:
            raise PaymentServiceError(f"Payment service error: {e}")

    def confirm_payment(self, db: Session, payment_intent_id: str, reservation_id: str) -> dict:
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if intent.status == "succeeded":
                res = db.execute(
                    select(ReservationORM).where(ReservationORM.id == reservation_id)
                ).scalar_one_or_none()
                if res:
                    res.payment_status = "paid"
                    if res.status == "confirmada":
                        res.status = "en_curso"
                    db.commit()
                return {
                    "success": True,
                    "payment_intent_id": intent.id,
                    "status": intent.status,
                    "amount": intent.amount,
                    "currency": intent.currency,
                    "reservation_id": reservation_id,
                }
            else:
                return {
                    "success": False,
                    "payment_intent_id": intent.id,
                    "status": intent.status,
                    "message": "Payment not completed yet",
                }
        except stripe.error.StripeError as e:
            raise PaymentServiceError(str(e))
        except Exception as e:
            raise PaymentServiceError(f"Payment service error: {e}")


payment_service = PaymentService()
