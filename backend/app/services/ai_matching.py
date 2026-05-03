from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

EXPERIENCE_MAP = {"beginner": 1, "intermediate": 2, "advanced": 3}

def _skill_text(github_data: dict) -> str:
    langs = github_data.get("languages", [])
    # Weight languages by frequency using language_counts
    counts = github_data.get("language_counts", {})
    tokens = []
    for lang in langs:
        tokens.extend([lang] * max(1, counts.get(lang, 1)))
    return " ".join(tokens) if tokens else "none"

def compute_compatibility(user_a: dict, user_b: dict) -> dict:
    # 1. Skill similarity via TF-IDF cosine
    text_a = _skill_text(user_a["github"])
    text_b = _skill_text(user_b["github"])

    skill_sim = 0.0
    if not (text_a == "none" and text_b == "none"):
        try:
            tfidf = TfidfVectorizer().fit_transform([text_a, text_b])
            skill_sim = float(cosine_similarity(tfidf[0], tfidf[1])[0][0])
        except Exception:
            skill_sim = 0.0

    # 2. GitHub activity similarity
    act_a = min(user_a["github"].get("activity_score", 0), 10) / 10
    act_b = min(user_b["github"].get("activity_score", 0), 10) / 10
    activity_sim = 1 - abs(act_a - act_b)

    # 3. Trust score similarity
    trust_a = user_a["trust"].get("score", 0) / 10
    trust_b = user_b["trust"].get("score", 0) / 10
    trust_sim = 1 - abs(trust_a - trust_b)

    # 4. Experience level similarity
    exp_a = EXPERIENCE_MAP.get(user_a["profile"].get("experience_level", "beginner"), 1)
    exp_b = EXPERIENCE_MAP.get(user_b["profile"].get("experience_level", "beginner"), 1)
    exp_sim = 1 - abs(exp_a - exp_b) / 2

    score = 0.40 * skill_sim + 0.25 * activity_sim + 0.20 * trust_sim + 0.15 * exp_sim

    shared_langs = list(
        set(user_a["github"].get("languages", []))
        & set(user_b["github"].get("languages", []))
    )

    return {
        "compatibility_score": round(score * 100, 1),
        "breakdown": {
            "skill_similarity": round(skill_sim * 100, 1),
            "activity_similarity": round(activity_sim * 100, 1),
            "trust_similarity": round(trust_sim * 100, 1),
            "experience_similarity": round(exp_sim * 100, 1),
        },
        "shared_languages": shared_langs,
        "explanation": _build_explanation(score, skill_sim, activity_sim, shared_langs, user_a, user_b),
    }

def _build_explanation(
    score: float,
    skill_sim: float,
    activity_sim: float,
    shared_langs: list,
    user_a: dict,
    user_b: dict,
) -> str:
    name = user_b["profile"].get("name", "This user")
    parts = []

    if shared_langs:
        parts.append(f"strong {', '.join(shared_langs[:3])} overlap")
    elif skill_sim > 0.3:
        parts.append("complementary tech stack")

    act_b = user_b["github"].get("activity_score", 0)
    if act_b >= 7:
        parts.append("very active on GitHub")
    elif act_b >= 4:
        parts.append("regularly active on GitHub")

    trust_label = user_b["trust"].get("label", "Low")
    if trust_label == "High":
        parts.append("high trust score")

    exp_a = user_a["profile"].get("experience_level", "beginner")
    exp_b = user_b["profile"].get("experience_level", "beginner")
    if exp_a == exp_b:
        parts.append(f"same {exp_b} level")
    else:
        parts.append(f"{exp_b} experience")

    quality = "Excellent" if score >= 0.75 else "Good" if score >= 0.50 else "Moderate" if score >= 0.30 else "Low"
    detail = ", ".join(parts) if parts else "general compatibility"
    return f"{quality} match with {name} — {detail}."
