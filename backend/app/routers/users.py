from fastapi import APIRouter, Request, HTTPException
from app.core.firebase import get_firestore
from app.models.schemas import UserProfileCreate, UserProfileResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/profile", response_model=UserProfileResponse)
async def create_or_update_profile(request: Request, body: UserProfileCreate):
    uid = request.state.user["uid"]
    db = get_firestore()

    # Check if doc exists to preserve role
    existing = db.collection("users").document(uid).get()
    role = "user"
    if existing.exists:
        role = existing.to_dict().get("role", "user")

    profile_data = {
        "id": uid,
        "name": body.name,
        "email": body.email,
        "github_username": body.github_username,
        "experience_level": body.experience_level,
        "role": role,
    }

    db.collection("users").document(uid).set(profile_data)
    return UserProfileResponse(**profile_data)

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(request: Request):
    uid = request.state.user["uid"]
    db = get_firestore()
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = doc.to_dict()
    try:
        ts_doc = db.collection("trust_scores").document(uid).get()
        if ts_doc.exists:
            data["trust_score"] = ts_doc.to_dict().get("score")
    except Exception:
        pass
    return UserProfileResponse(**data)
