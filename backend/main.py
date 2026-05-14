"""
Smart Gateway — Backend API
A simple FastAPI service with sample endpoints for the Smart Gateway demo.
Run: uvicorn main:app --host 0.0.0.0 --port 8080
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import random

app = FastAPI(
    title="Smart Gateway Backend",
    description="Demo API behind Cloudflare Tunnel for the Smart Gateway project",
    version="1.0.0",
)

# ─── Fake data ───────────────────────────────────────────────────────────────

USERS = [
    {"id": 1, "name": "Ana García", "email": "ana@example.com", "role": "admin", "active": True, "created": "2025-11-01"},
    {"id": 2, "name": "Marc López", "email": "marc@example.com", "role": "editor", "active": True, "created": "2026-01-15"},
    {"id": 3, "name": "Laura Martí", "email": "laura@example.com", "role": "viewer", "active": False, "created": "2025-06-20"},
    {"id": 4, "name": "Jordi Pérez", "email": "jordi@example.com", "role": "editor", "active": True, "created": "2026-03-10"},
    {"id": 5, "name": "Marta Soler", "email": "marta@example.com", "role": "admin", "active": True, "created": "2025-09-05"},
]

PRODUCTS = [
    {"id": 1, "name": "Cloudflare Pro Plan", "category": "services", "price": 20.0, "stock": 999, "active": True},
    {"id": 2, "name": "SSL Certificate", "category": "security", "price": 0.0, "stock": 999, "active": True},
    {"id": 3, "name": "Workers Bundled", "category": "compute", "price": 5.0, "stock": 999, "active": True},
    {"id": 4, "name": "R2 Storage 10GB", "category": "storage", "price": 0.015, "stock": 999, "active": True},
    {"id": 5, "name": "DDoS Protection", "category": "security", "price": 0.0, "stock": 999, "active": False},
]

ORDERS = [
    {"id": 101, "user_id": 1, "product_id": 1, "quantity": 1, "total": 20.0, "status": "completed", "date": "2026-04-01"},
    {"id": 102, "user_id": 2, "product_id": 3, "quantity": 2, "total": 10.0, "status": "completed", "date": "2026-04-05"},
    {"id": 103, "user_id": 4, "product_id": 4, "quantity": 5, "total": 0.075, "status": "pending", "date": "2026-05-10"},
    {"id": 104, "user_id": 1, "product_id": 2, "quantity": 1, "total": 0.0, "status": "completed", "date": "2026-05-12"},
    {"id": 105, "user_id": 5, "product_id": 1, "quantity": 1, "total": 20.0, "status": "cancelled", "date": "2026-05-13"},
]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Smart Gateway Backend",
        "version": "1.0.0",
        "endpoints": ["/api/users", "/api/products", "/api/orders", "/api/stats"],
    }


# --- Users ---

@app.get("/api/users")
def list_users(
    active: bool | None = Query(None, description="Filter by active status"),
    role: str | None = Query(None, description="Filter by role: admin, editor, viewer"),
    since: str | None = Query(None, description="Created after this date (YYYY-MM-DD)"),
):
    results = USERS
    if active is not None:
        results = [u for u in results if u["active"] == active]
    if role:
        results = [u for u in results if u["role"] == role.lower()]
    if since:
        results = [u for u in results if u["created"] >= since]
    return {"count": len(results), "users": results}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    user = next((u for u in USERS if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --- Products ---

@app.get("/api/products")
def list_products(
    category: str | None = Query(None, description="Filter by category"),
    active: bool | None = Query(None, description="Filter by active status"),
    max_price: float | None = Query(None, description="Max price filter"),
):
    results = PRODUCTS
    if category:
        results = [p for p in results if p["category"] == category.lower()]
    if active is not None:
        results = [p for p in results if p["active"] == active]
    if max_price is not None:
        results = [p for p in results if p["price"] <= max_price]
    return {"count": len(results), "products": results}


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- Orders ---

@app.get("/api/orders")
def list_orders(
    status: str | None = Query(None, description="Filter: completed, pending, cancelled"),
    user_id: int | None = Query(None, description="Filter by user ID"),
    since: str | None = Query(None, description="Orders after this date (YYYY-MM-DD)"),
):
    results = ORDERS
    if status:
        results = [o for o in results if o["status"] == status.lower()]
    if user_id is not None:
        results = [o for o in results if o["user_id"] == user_id]
    if since:
        results = [o for o in results if o["date"] >= since]
    return {"count": len(results), "orders": results}


@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    order = next((o for o in ORDERS if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# --- Stats ---

@app.get("/api/stats")
def get_stats():
    total_revenue = sum(o["total"] for o in ORDERS if o["status"] == "completed")
    active_users = sum(1 for u in USERS if u["active"])
    pending_orders = sum(1 for o in ORDERS if o["status"] == "pending")
    
    return {
        "total_users": len(USERS),
        "active_users": active_users,
        "total_products": len(PRODUCTS),
        "total_orders": len(ORDERS),
        "pending_orders": pending_orders,
        "total_revenue": round(total_revenue, 2),
        "avg_order_value": round(total_revenue / max(1, len([o for o in ORDERS if o["status"] == "completed"])), 2),
    }


@app.get("/api/stats/revenue")
def get_revenue(period: str | None = Query("month", description="day, week, month")):
    # Simulated revenue breakdown
    if period == "day":
        data = [{"date": f"2026-05-{10+i:02d}", "revenue": round(random.uniform(5, 50), 2)} for i in range(5)]
    elif period == "week":
        data = [{"week": f"2026-W{18+i}", "revenue": round(random.uniform(30, 200), 2)} for i in range(4)]
    else:
        data = [{"month": f"2026-{i:02d}", "revenue": round(random.uniform(100, 500), 2)} for i in range(1, 6)]
    return {"period": period, "data": data}


# ─── OpenAPI spec endpoint (for the Worker to read) ─────────────────────────

@app.get("/api/spec")
def get_spec():
    """Returns a simplified API spec for Claude to understand available endpoints."""
    return {
        "endpoints": [
            {
                "method": "GET",
                "path": "/api/users",
                "description": "List users. Filters: active (bool), role (admin|editor|viewer), since (YYYY-MM-DD)",
            },
            {
                "method": "GET",
                "path": "/api/users/{user_id}",
                "description": "Get a specific user by ID (1-5)",
            },
            {
                "method": "GET",
                "path": "/api/products",
                "description": "List products. Filters: category (services|security|compute|storage), active (bool), max_price (float)",
            },
            {
                "method": "GET",
                "path": "/api/products/{product_id}",
                "description": "Get a specific product by ID (1-5)",
            },
            {
                "method": "GET",
                "path": "/api/orders",
                "description": "List orders. Filters: status (completed|pending|cancelled), user_id (int), since (YYYY-MM-DD)",
            },
            {
                "method": "GET",
                "path": "/api/orders/{order_id}",
                "description": "Get a specific order by ID (101-105)",
            },
            {
                "method": "GET",
                "path": "/api/stats",
                "description": "Get overall statistics: users, products, orders, revenue",
            },
            {
                "method": "GET",
                "path": "/api/stats/revenue",
                "description": "Get revenue breakdown. Filter: period (day|week|month)",
            },
        ]
    }
