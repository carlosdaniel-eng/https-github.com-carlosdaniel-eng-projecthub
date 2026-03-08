from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog


def log_action(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    project_id: int | None = None,
    detail: str | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        project_id=project_id,
        detail=detail,
    )
    db.add(entry)
    db.flush()
    return entry
