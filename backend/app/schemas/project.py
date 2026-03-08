from datetime import datetime
from pydantic import BaseModel
from app.schemas.user import UserOut


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    github_repo: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    github_repo: str | None = None


class MemberOut(BaseModel):
    id: int
    user: UserOut
    role_in_project: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    github_repo: str | None
    owner_id: int
    owner: UserOut
    created_at: datetime
    updated_at: datetime
    members: list[MemberOut] = []

    model_config = {"from_attributes": True}


class ProjectSummary(BaseModel):
    id: int
    title: str
    status: str
    owner_id: int
    created_at: datetime
    task_count: int = 0
    done_count: int = 0

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
    role_in_project: str = "member"
