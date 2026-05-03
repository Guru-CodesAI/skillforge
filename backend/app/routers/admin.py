from fastapi import APIRouter, Request, HTTPException
from app.core.firebase import get_firestore

router = APIRouter(prefix="/admin", tags=["admin"])

def _require_admin(request: Request) -> str:
    """Verify token role from Firestore — never trust frontend."""
    uid = request.state.user["uid"]
    db = get_firestore()
    doc = db.collection("users").document(uid).get()
    if not doc.exists or doc.to_dict().get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return uid

@router.get("/users")
async def list_all_users(request: Request):
    _require_admin(request)
    db = get_firestore()
    users = []
    for doc in db.collection("users").stream():
        user = doc.to_dict()
        ts = db.collection("trust_scores").document(doc.id).get()
        gh = db.collection("github_profiles").document(doc.id).get()
        user["trust_score"] = ts.to_dict().get("score") if ts.exists else None
        user["github_analyzed"] = gh.exists
        users.append(user)
    return {"users": users, "total": len(users)}

@router.delete("/users/{user_id}")
async def remove_user(user_id: str, request: Request):
    admin_uid = _require_admin(request)
    if user_id == admin_uid:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin account.")
    db = get_firestore()
    for collection in ["users", "trust_scores", "github_profiles"]:
        db.collection(collection).document(user_id).delete()
    return {"message": f"User {user_id} removed successfully."}

@router.patch("/users/{user_id}/flag")
async def flag_user(user_id: str, request: Request):
    _require_admin(request)
    db = get_firestore()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    current = doc.to_dict().get("flagged", False)
    db.collection("users").document(user_id).update({"flagged": not current})
    return {"flagged": not current}

@router.get("/stats")
async def platform_stats(request: Request):
    _require_admin(request)
    db = get_firestore()
    users = list(db.collection("users").stream())
    trust_scores = [d.to_dict().get("score", 0) for d in db.collection("trust_scores").stream()]
    flagged = sum(1 for u in users if u.to_dict().get("flagged"))
    avg_trust = round(sum(trust_scores) / len(trust_scores), 2) if trust_scores else 0
    return {
        "total_users": len(users),
        "analyzed_users": len(trust_scores),
        "flagged_users": flagged,
        "average_trust_score": avg_trust,
    }
