import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.cache import cache_get, cache_set
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogOut

router = APIRouter(tags=["Dashboard & Logs"])
logger = logging.getLogger(__name__)


@router.get("/activity", response_model=list[ActivityLogOut])
def get_activity(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna histórico de atividades do usuário autenticado."""
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/projects/{project_id}/activity", response_model=list[ActivityLogOut])
def get_project_activity(
    project_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna histórico de atividades de um projeto."""
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.project_id == project_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/dashboard")
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna métricas gerais do usuário para o dashboard."""
    cache_key = f"dashboard:{current_user.id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    # Projects the user owns or is a member of
    owned_ids = [
        p.id for p in db.query(Project.id).filter(Project.owner_id == current_user.id).all()
    ]
    member_ids = [
        m.project_id for m in
        db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).all()
    ]
    all_project_ids = list(set(owned_ids + member_ids))

    total_projects = len(all_project_ids)
    active_projects = db.query(Project).filter(
        Project.id.in_(all_project_ids), Project.status == "active"
    ).count()

    # Tasks across all user's projects
    tasks_q = db.query(Task).filter(Task.project_id.in_(all_project_ids))
    total_tasks = tasks_q.count()
    todo = tasks_q.filter(Task.status == "todo").count()
    in_progress = tasks_q.filter(Task.status == "in_progress").count()
    done = tasks_q.filter(Task.status == "done").count()

    result = {
        "user": {"id": current_user.id, "name": current_user.name, "role": current_user.role},
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "owned": len(owned_ids),
        },
        "tasks": {
            "total": total_tasks,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
            "completion_rate": round(done / total_tasks * 100, 1) if total_tasks else 0,
        },
    }
    cache_set(cache_key, result, ttl=60)
    return result
