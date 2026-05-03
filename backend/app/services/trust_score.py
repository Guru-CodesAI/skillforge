def calculate_trust_score(github_data: dict, profile: dict) -> dict:
    # Activity component (0–5): weighted by recent pushes + stars + forks
    raw_activity = (
        github_data.get("recent_pushes", 0) * 0.4
        + github_data.get("total_stars", 0) * 0.02
        + github_data.get("total_forks", 0) * 0.03
        + github_data.get("repo_count", 0) * 0.05
    )
    activity = min(5.0, raw_activity)

    # Profile completeness component (0–5)
    fields = ["name", "email", "github_username", "experience_level"]
    filled = sum(1 for f in fields if profile.get(f))
    completeness = (filled / len(fields)) * 4.0
    if github_data.get("languages"):
        completeness = min(5.0, completeness + 0.5)
    if github_data.get("bio"):
        completeness = min(5.0, completeness + 0.5)

    score = round(activity + completeness, 2)
    label = "High" if score >= 7 else "Medium" if score >= 4 else "Low"

    return {
        "score": score,
        "label": label,
        "activity_component": round(activity, 2),
        "completeness_component": round(completeness, 2),
    }
