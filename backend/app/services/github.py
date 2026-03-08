import logging
import httpx
from app.core.config import get_settings
from app.core.cache import cache_get, cache_set

logger = logging.getLogger(__name__)
settings = get_settings()

GITHUB_CACHE_TTL = 300  # 5 minutes


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return h


def get_commits(owner: str, repo: str, per_page: int = 20) -> list[dict]:
    """Fetch recent commits from a GitHub repository."""
    cache_key = f"github:commits:{owner}:{repo}"
    cached = cache_get(cache_key)
    if cached is not None:
        logger.info(f"Cache hit for {cache_key}")
        return cached

    url = f"{settings.GITHUB_API_URL}/repos/{owner}/{repo}/commits"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers=_headers(), params={"per_page": per_page})
            resp.raise_for_status()
            commits = [
                {
                    "sha": c["sha"][:7],
                    "message": c["commit"]["message"].split("\n")[0],
                    "author": c["commit"]["author"]["name"],
                    "date": c["commit"]["author"]["date"],
                    "url": c["html_url"],
                }
                for c in resp.json()
            ]
            cache_set(cache_key, commits, ttl=GITHUB_CACHE_TTL)
            return commits
    except httpx.HTTPStatusError as e:
        logger.warning(f"GitHub API error [{e.response.status_code}] for {owner}/{repo}: {e}")
        return []
    except Exception as e:
        logger.error(f"GitHub API exception for {owner}/{repo}: {e}")
        return []
