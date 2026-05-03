import httpx
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

GITHUB_API = "https://api.github.com"

def _headers() -> dict:
    token = os.getenv("GITHUB_TOKEN", "")
    h = {"Accept": "application/vnd.github.v3+json"}
    if token:
        h["Authorization"] = f"token {token}"
    return h

async def fetch_github_profile(username: str) -> dict:
    async with httpx.AsyncClient(timeout=12) as client:
        user_resp = await client.get(f"{GITHUB_API}/users/{username}", headers=_headers())
        if user_resp.status_code == 404:
            return {"error": "not_found"}
        if user_resp.status_code != 200:
            return {}
        user_data = user_resp.json()

        repos_resp = await client.get(
            f"{GITHUB_API}/users/{username}/repos",
            headers=_headers(),
            params={"per_page": 100, "sort": "pushed"},
        )
        repos = repos_resp.json() if repos_resp.status_code == 200 else []

    # Guard: repos must be a list
    if not isinstance(repos, list):
        repos = []

    languages: dict[str, int] = {}
    total_stars = 0
    total_forks = 0
    recent_pushes = 0  # repos pushed in last 6 months
    now = datetime.now(timezone.utc)

    for repo in repos:
        if repo.get("fork"):
            continue  # skip forks for quality signal
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        total_stars += repo.get("stargazers_count", 0)
        total_forks += repo.get("forks_count", 0)
        pushed = repo.get("pushed_at", "")
        if pushed:
            try:
                delta = (now - datetime.fromisoformat(pushed.replace("Z", "+00:00"))).days
                if delta <= 180:
                    recent_pushes += 1
            except Exception:
                pass

    top_languages = sorted(languages, key=lambda k: languages[k], reverse=True)[:5]
    repo_count = user_data.get("public_repos", 0)

    # Improved activity score: commits proxy via recent pushes, stars, repos
    activity_score = min(
        10.0,
        recent_pushes * 0.5
        + total_stars * 0.03
        + total_forks * 0.05
        + repo_count * 0.1
        + user_data.get("followers", 0) * 0.05,
    )

    return {
        "username": username,
        "repo_count": repo_count,
        "followers": user_data.get("followers", 0),
        "languages": top_languages,
        "language_counts": languages,
        "total_stars": total_stars,
        "total_forks": total_forks,
        "recent_pushes": recent_pushes,
        "activity_score": round(activity_score, 2),
        "bio": user_data.get("bio") or "",
        "avatar_url": user_data.get("avatar_url", ""),
    }
