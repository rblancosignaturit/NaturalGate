"""Application-specific exceptions."""


class NaturalGateException(Exception):
    """Base exception for the application."""

    pass


class ResourceNotFoundError(NaturalGateException):
    """Raised when a requested resource does not exist."""

    pass


class BusinessRuleError(NaturalGateException):
    """Raised when a business rule is violated."""

    pass


class PaymentServiceError(NaturalGateException):
    """Raised when the payment provider fails."""

    pass
