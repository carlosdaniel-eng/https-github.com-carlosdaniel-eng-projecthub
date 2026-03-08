import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.logging import setup_logging
from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.tasks import router as tasks_router
from app.routers.dashboard import router as dashboard_router

settings = get_settings()
setup_logging("DEBUG" if settings.DEBUG else "INFO")
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    # Import all models so SQLAlchemy can create tables
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Banco de dados pronto.")
    yield
    logger.info("Encerrando aplicação.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST do **ProjectHub** — plataforma de gerenciamento de projetos em nuvem.\n\n"
        "Desenvolvido com FastAPI, PostgreSQL (Supabase), Docker e GitHub Actions.\n\n"
        "**Autenticação:** use `/auth/login` para obter o token JWT e clique em 'Authorize' acima."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── Middlewares ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware ────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"← {response.status_code} {request.url.path}")
    return response


# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro não tratado em {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)


@app.get("/health", tags=["Health"])
def health():
    """Verifica se a API está no ar."""
    return {"status": "ok", "version": settings.APP_VERSION}
