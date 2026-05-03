from fastapi import APIRouter, Request, HTTPException
from app.core.limiter import limiter
from app.core.firebase import get_firestore
from app.services.github_service import fetch_github_profile
from app.services.trust_score import calculate_trust_score

router = APIRouter(prefix="/github", tags=["github"])

@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_github(request: Request):
    uid = request.state.user["uid"]
    db = get_firestore()

    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found. Create your profile first.")

    profile = user_doc.to_dict()
    github_username = profile.get("github_username", "").strip()
    if not github_username:
        raise HTTPException(status_code=400, detail="GitHub username is not set in your profile.")

    try:
        github_data = await fetch_github_profile(github_username)
    except Exception:
        raise HTTPException(status_code=503, detail="GitHub API is unavailable. Please try again later.")

    if not github_data:
        raise HTTPException(status_code=503, detail="Failed to fetch GitHub data. Please try again.")
    if github_data.get("error") == "not_found":
        raise HTTPException(status_code=404, detail=f"GitHub user '{github_username}' not found. Check your username.")

    trust = calculate_trust_score(github_data, profile)

    db.collection("github_profiles").document(uid).set({
        "user_id": uid,
        "languages": github_data["languages"],
        "language_counts": github_data["language_counts"],
        "repo_count": github_data["repo_count"],
        "activity_score": github_data["activity_score"],
        "total_stars": github_data["total_stars"],
        "total_forks": github_data["total_forks"],
        "recent_pushes": github_data["recent_pushes"],
        "avatar_url": github_data["avatar_url"],
        "bio": github_data["bio"],
    })
    db.collection("trust_scores").document(uid).set({
        "user_id": uid,
        "score": trust["score"],
        "label": trust["label"],
    })

    return {"github": github_data, "trust": trust}

@router.get("/profile/{user_id}")
async def get_github_profile(user_id: str, request: Request):
    db = get_firestore()
    doc = db.collection("github_profiles").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="GitHub profile not analyzed yet.")
    return doc.to_dict()
