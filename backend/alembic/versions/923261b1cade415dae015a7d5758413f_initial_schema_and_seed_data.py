"""Initial schema and seed data

Revision ID: 923261b1cade415dae015a7d5758413f
Revises: 
Create Date: 2026-05-14 00:00:00.000000

"""

import os
import sys
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.orm import Session

# Ensure src is on path so natural_gate imports resolve during alembic upgrade
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from natural_gate.shared.infrastructure.seed import seed_cars, seed_reservations

# revision identifiers, used by Alembic.
revision: str = "923261b1cade415dae015a7d5758413f"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cars",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("brand", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("fuel", sa.String(), nullable=False),
        sa.Column("transmission", sa.String(), nullable=False),
        sa.Column("price_per_day", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("equipment", sa.JSON(), nullable=True),
        sa.Column("mileage_policy", sa.String(), nullable=False),
        sa.Column("image_emoji", sa.String(), nullable=False),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("available", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "reservations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("car_id", sa.Integer(), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("pickup_date", sa.String(), nullable=False),
        sa.Column("return_date", sa.String(), nullable=False),
        sa.Column("pickup_location", sa.String(), nullable=False),
        sa.Column("total_price", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("payment_status", sa.String(), nullable=False),
        sa.Column("created_at", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["car_id"], ["cars.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    bind = op.get_bind()
    session = Session(bind=bind)
    seed_cars(session)
    seed_reservations(session)


def downgrade() -> None:
    op.drop_table("reservations")
    op.drop_table("cars")
