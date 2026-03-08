from pydantic import BaseModel
from app.schemas.user import UserOut


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


class LoginForm(BaseModel):
    email: str
    password: str
