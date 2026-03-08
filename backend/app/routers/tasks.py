import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.services.activity import log_action

router = APIRouter(tags=["Tasks"])
logger = logging.getLogger(__name__)


def _get_project_membership(project_id: int, user: User, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    if user.role == "admin" or project.owner_id == user.id:
        return project
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Acesso negado a este projeto.")
    return project


def _load_task(task_id: int, db: Session) -> Task:
    task = db.query(Task).options(selectinload(Task.assignee)).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    return task


# ── List tasks ───────────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/tasks", response_model=list[TaskOut])
def list_tasks(
    project_id: int,
    status: str | None = None,
    priority: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista tarefas de um projeto com filtros opcionais."""
    _get_project_membership(project_id, current_user, db)
    query = db.query(Task).options(selectinload(Task.assignee)).filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    return query.order_by(Task.created_at.desc()).all()


# ── Create task ───────────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/tasks", response_model=TaskOut, status_code=201)
def create_task(
    project_id: int,
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma tarefa no projeto."""
    _get_project_membership(project_id, current_user, db)

    if payload.assignee_id:
        assignee_member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == payload.assignee_id,
        ).first()
        project = db.query(Project).filter(Project.id == project_id).first()
        if not assignee_member and (project and project.owner_id != payload.assignee_id):
            raise HTTPException(status_code=400, detail="Responsável não é membro deste projeto.")

    task = Task(
        **payload.model_dump(),
        project_id=project_id,
        created_by=current_user.id,
    )
    db.add(task)
    db.flush()
    log_action(db, current_user.id, "created", "task", task.id, project_id, f"Tarefa '{task.title}'")
    db.commit()
    db.refresh(task)
    logger.info(f"Tarefa criada id={task.id} no projeto={project_id}")
    return _load_task(task.id, db)


# ── Get task ──────────────────────────────────────────────────────────────────

@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna detalhes de uma tarefa."""
    task = _load_task(task_id, db)
    _get_project_membership(task.project_id, current_user, db)
    return task


# ── Update task ───────────────────────────────────────────────────────────────

@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza uma tarefa (status, prioridade, responsável, etc.)."""
    task = _load_task(task_id, db)
    _get_project_membership(task.project_id, current_user, db)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    log_action(db, current_user.id, "updated", "task", task.id, task.project_id)
    db.commit()
    db.refresh(task)
    return _load_task(task.id, db)


# ── Delete task ───────────────────────────────────────────────────────────────

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove uma tarefa."""
    task = _load_task(task_id, db)
    _get_project_membership(task.project_id, current_user, db)
    log_action(db, current_user.id, "deleted", "task", task.id, task.project_id, f"Tarefa '{task.title}'")
    db.delete(task)
    db.commit()
