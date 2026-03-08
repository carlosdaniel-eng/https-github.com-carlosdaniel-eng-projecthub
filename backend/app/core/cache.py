import json
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is None and settings.REDIS_URL:
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis conectado com sucesso.")
        except Exception as e:
            logger.warning(f"Redis indisponível, cache desativado: {e}")
            _redis_client = None
    return _redis_client


def cache_get(key: str) -> Any | None:
    r = get_redis()
    if not r:
        return None
    try:
        value = r.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.warning(f"Erro ao ler cache [{key}]: {e}")
        return None


def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.set(key, json.dumps(value), ex=ttl or settings.CACHE_TTL_SECONDS)
    except Exception as e:
        logger.warning(f"Erro ao gravar cache [{key}]: {e}")


def cache_delete(key: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.delete(key)
    except Exception as e:
        logger.warning(f"Erro ao deletar cache [{key}]: {e}")


def cache_delete_pattern(pattern: str) -> None:
    r = get_redis()
    if not r:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception as e:
        logger.warning(f"Erro ao deletar padrão de cache [{pattern}]: {e}")
