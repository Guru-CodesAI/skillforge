from fastapi import APIRouter, Request, HTTPException
from app.core.limiter import limiter
from app.core.firebase import get_firestore
from app.services.ai_matching import compute_compatibility

router = APIRouter(prefix="/matching", tags=["matching"])

def _load_user_bundle(db, uid: str) -> dict:
    try:
        profile_doc = db.collection("users").document(uid).get()
        github_doc = db.collection("github_profiles").document(uid).get()
        trust_doc = db.collection("trust_scores").document(uid).get()
        if not profile_doc.exists:
            return {}
        return {
            "profile": profile_doc.to_dict(),
            "github": github_doc.to_dict() if github_doc.exists else {},
            "trust": trust_doc.to_dict() if trust_doc.exists else {"score": 0, "label": "Low"},
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@router.get("/recommendations")
@limiter.limit("20/minute")
async def get_recommendations(request: Request):
    uid = request.state.user["uid"]
    db = get_firestore()

    my_bundle = _load_user_bundle(db, uid)
    if not my_bundle:
        raise HTTPException(status_code=404, detail="Complete your profile first.")
    if not my_bundle.get("github"):
        raise HTTPException(status_code=400, detail="Run GitHub analysis before getting recommendations.")

    results = []
    for doc in db.collection("users").stream():
        other_uid = doc.id
        if other_uid == uid:
            continue
        other_bundle = _load_user_bundle(db, other_uid)
        if not other_bundle or not other_bundle.get("github"):
            continue
        try:
            compatibility = compute_compatibility(my_bundle, other_bundle)
        except Exception:
            continue
        results.append({
            "user_id": other_uid,
            "name": other_bundle["profile"].get("name"),
            "email": other_bundle["profile"].get("email"),
            "github_username": other_bundle["profile"].get("github_username"),
            "experience_level": other_bundle["profile"].get("experience_level"),
            "avatar_url": other_bundle["github"].get("avatar_url", ""),
            "languages": other_bundle["github"].get("languages", []),
            "trust_score": other_bundle["trust"].get("score", 0),
            "trust_label": other_bundle["trust"].get("label", "Low"),
            **compatibility,
        })

    results.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return {"recommendations": results[:10]}
