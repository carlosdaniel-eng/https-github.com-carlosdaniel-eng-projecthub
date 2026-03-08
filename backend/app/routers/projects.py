import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.cache import cache_get, cache_set, cache_delete_pattern
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    ProjectSummary, AddMemberRequest, MemberOut,
)
from app.services.activity import log_action
from app.services.github import get_commits

router = APIRouter(prefix="/projects", tags=["Projects"])
logger = logging.getLogger(__name__)


def _get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.query(Project).options(
        selectinload(Project.owner),
        selectinload(Project.members).selectinload(ProjectMember.user),
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    return project


def _assert_member_or_owner(project: Project, user: User, require_owner: bool = False):
    if project.owner_id == user.id or user.role == "admin":
        return
    if require_owner:
        raise HTTPException(status_code=403, detail="Apenas o dono pode realizar esta ação.")
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Acesso negado a este projeto.")


# ── List ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ProjectSummary])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista projetos do usuário (próprios + onde é membro)."""
    cache_key = f"projects:user:{current_user.id}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    owned = db.query(Project).filter(Project.owner_id == current_user.id).all()
    member_project_ids = [
        m.project_id for m in
        db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
    ]
    member_projects = db.query(Project).filter(
        Project.id.in_(member_project_ids),
        Project.owner_id != current_user.id,
    ).all()

    all_projects = owned + member_projects
    result = []
    for p in all_projects:
        task_count = db.query(Task).filter(Task.project_id == p.id).count()
        done_count = db.query(Task).filter(Task.project_id == p.id, Task.status == "done").count()
        result.append(ProjectSummary(
            id=p.id, title=p.title, status=p.status,
            owner_id=p.owner_id, created_at=p.created_at,
            task_count=task_count, done_count=done_count,
        ))

    serialized = [r.model_dump(mode="json") for r in result]
    cache_set(cache_key, serialized)
    return result


# ── Create ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria um novo projeto."""
    project = Project(**payload.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.flush()
    # Auto-add owner as member
    db.add(ProjectMember(project_id=project.id, user_id=current_user.id, role_in_project="owner"))
    log_action(db, current_user.id, "created", "project", project.id, project.id, f"Projeto '{project.title}'")
    db.commit()
    db.refresh(project)
    cache_delete_pattern(f"projects:user:{current_user.id}")
    logger.info(f"Projeto criado id={project.id} por user={current_user.id}")
    return _get_project_or_404(project.id, db)


# ── Get ──────────────────────────────────────────────────────────────────────

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna detalhes de um projeto."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user)
    return project


# ── Update ───────────────────────────────────────────────────────────────────

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza dados do projeto (apenas dono ou admin)."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user, require_owner=True)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    log_action(db, current_user.id, "updated", "project", project.id, project.id)
    db.commit()
    db.refresh(project)
    cache_delete_pattern(f"projects:user:{current_user.id}")
    return _get_project_or_404(project_id, db)


# ── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove o projeto (apenas dono ou admin)."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user, require_owner=True)
    log_action(db, current_user.id, "deleted", "project", project.id, None, f"Projeto '{project.title}'")
    db.delete(project)
    db.commit()
    cache_delete_pattern(f"projects:user:{current_user.id}")
    logger.info(f"Projeto deletado id={project_id} por user={current_user.id}")


# ── Members ──────────────────────────────────────────────────────────────────

@router.post("/{project_id}/members", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def add_member(
    project_id: int,
    payload: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Adiciona um membro ao projeto (apenas dono ou admin)."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user, require_owner=True)

    if not db.get(User, payload.user_id):
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Usuário já é membro deste projeto.")

    member = ProjectMember(
        project_id=project_id,
        user_id=payload.user_id,
        role_in_project=payload.role_in_project,
    )
    db.add(member)
    log_action(db, current_user.id, "added_member", "project", project_id, project_id)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove um membro do projeto."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user, require_owner=True)

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")
    db.delete(member)
    db.commit()


# ── GitHub Commits ───────────────────────────────────────────────────────────

@router.get("/{project_id}/github", response_model=list[dict])
def github_commits(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna commits do repositório GitHub vinculado ao projeto."""
    project = _get_project_or_404(project_id, db)
    _assert_member_or_owner(project, current_user)

    if not project.github_repo:
        raise HTTPException(status_code=400, detail="Este projeto não tem repositório GitHub configurado.")

    # Expected format: "owner/repo"
    parts = project.github_repo.strip("/").split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Formato de repositório inválido. Use 'owner/repo'.")

    return get_commits(parts[-2], parts[-1])
