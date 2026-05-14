"""Natural Gate Backend — FastAPI entry point."""

from fastapi import FastAPI

from natural_gate.domains.cars.api import router as cars_router
from natural_gate.domains.reservations.api import router as reservations_router
from natural_gate.domains.payments.api import router as payments_router
from natural_gate.domains.stats.api import router as stats_router

app = FastAPI(
    title="Natural Coches",
    description="Car rental e-commerce API with Stripe payments",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(cars_router.router)
app.include_router(reservations_router.router)
app.include_router(payments_router.router)
app.include_router(stats_router.router)


@app.get("/")
def root() -> dict:
    """Service entry point that redirects discovery to Swagger UI."""
    return {
        "service": "Natural Coches Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": ["/api/cars", "/api/reservations", "/api/payments", "/api/stats"],
    }


@app.get("/api/spec")
def get_spec() -> dict:
    """Returns a simplified API spec for downstream consumers."""
    return {
        "endpoints": [
            {"method": "GET", "path": "/api/cars", "description": "List cars with filters."},
            {"method": "GET", "path": "/api/cars/{car_id}", "description": "Get car by ID."},
            {"method": "POST", "path": "/api/reservations", "description": "Create reservation."},
            {"method": "GET", "path": "/api/reservations/search", "description": "Search reservations."},
            {"method": "POST", "path": "/api/reservations/{res_id}/cancel", "description": "Cancel reservation."},
            {"method": "POST", "path": "/api/payments/intent", "description": "Create Stripe payment intent."},
            {"method": "POST", "path": "/api/payments/confirm", "description": "Confirm payment."},
            {"method": "GET", "path": "/api/stats", "description": "Overall statistics."},
        ]
    }
