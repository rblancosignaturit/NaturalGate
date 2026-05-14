from sqlalchemy.orm import Session
from sqlalchemy import select

from natural_gate.shared.infrastructure.orm_models import CarORM, ReservationORM


class StatsService:
    def get_stats(self, db: Session) -> dict:
        reservations = db.execute(select(ReservationORM)).scalars().all()
        cars = db.execute(select(CarORM)).scalars().all()
        completed = [r for r in reservations if r.status == "completada"]
        active = [r for r in reservations if r.status in ("confirmada", "en_curso")]
        paid = [r for r in reservations if r.payment_status == "paid"]
        total_revenue = sum(r.total_price for r in completed)
        completed_count = len(completed)
        return {
            "total_cars": len(cars),
            "available_cars": sum(1 for c in cars if c.available),
            "total_reservations": len(reservations),
            "active_reservations": len(active),
            "paid_reservations": len(paid),
            "pending_payments": len(reservations) - len(paid),
            "total_revenue": round(total_revenue, 2),
            "avg_reservation_value": round(total_revenue / max(1, completed_count), 2),
        }


stats_service = StatsService()
