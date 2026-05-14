from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from natural_gate.domains.stats.orchestrator.application_service import stats_service
from natural_gate.shared.infrastructure.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def get_stats(db: Session = Depends(get_db)) -> dict:
    return stats_service.get_stats(db=db)
