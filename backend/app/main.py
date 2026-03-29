from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.routers import auth, projects, tasks, dashboard, users

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.1.0",
    description="Plataforma de gerenciamento de projetos em nuvem — UNIFOR 2025",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.1.0"}
