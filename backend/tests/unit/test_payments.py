"""Unit tests for payment domain."""

import pytest

from natural_gate.domains.payments.models.models import PaymentIntentRequest


def test_payment_intent_request_validation() -> None:
    req = PaymentIntentRequest(amount=1000, currency="eur", reservation_id="RES-123")
    assert req.amount == 1000
    assert req.currency == "eur"


def test_payment_intent_request_defaults() -> None:
    req = PaymentIntentRequest(amount=500)
    assert req.currency == "eur"
    assert req.reservation_id is None
