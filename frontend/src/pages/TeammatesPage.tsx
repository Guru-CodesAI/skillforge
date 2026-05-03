import { useState, useEffect } from "react";
import { getRecommendations } from "../services/skillforgeApi";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { TrustBadge } from "../components/TrustBadge";
import { CompatibilityRing } from "../components/CompatibilityRing";
import { SkeletonCard } from "../components/SkeletonCard";

export const TeammatesPage = () => {
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  useEffect(() => {
    getRecommendations()
      .then((r) => setTeammates(r.data.recommendations))
      .catch((e) => setError(e.response?.data?.detail || "Could not load recommendations. Make sure your GitHub is analyzed."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? teammates : teammates.filter((t) => t.experience_level === filter);

  return (
    <div className="page-container">
      <div className="teammates-header">
        <h2 className="section-title">AI Teammate Recommendations</h2>
        <div className="filter-tabs">
          {(["all", "beginner", "intermediate", "advanced"] as const).map((lvl) => (
            <button
              key={lvl}
              className={`filter-tab ${filter === lvl ? "filter-tab--active" : ""}`}
              onClick={() => setFilter(lvl)}
            >
              {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="teammates-grid">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((t) => (
              <GlassCard key={t.user_id} className="teammate-card">
                <div className="teammate-header">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="avatar" />
                  ) : (
                    <div className="avatar avatar--placeholder">{t.name?.[0]}</div>
                  )}
                  <div className="teammate-info">
                    <h3>{t.name}</h3>
                    <p className="muted">@{t.github_username}</p>
                    <p className="muted">{t.experience_level}</p>
                  </div>
                  <CompatibilityRing score={t.compatibility_score} />
                </div>

                <div className="lang-tags" style={{ margin: "0.75rem 0" }}>
                  {t.languages?.map((l: string) => (
                    <span key={l} className="lang-tag">{l}</span>
                  ))}
                </div>

                <TrustBadge score={t.trust_score} label={t.trust_label} />

                <p className="explanation">{t.explanation}</p>

                <div className="breakdown">
                  {Object.entries(t.breakdown || {}).map(([key, val]) => (
                    <div key={key} className="breakdown-item">
                      <span>{key.replace(/_/g, " ")}</span>
                      <div className="breakdown-bar">
                        <div className="breakdown-fill" style={{ width: `${val}%` }} />
                      </div>
                      <span>{val as number}%</span>
                    </div>
                  ))}
                </div>

                <GlowButton
                  variant="ghost"
                  onClick={() => window.open(`mailto:${t.email}?subject=SkillForge%20-%20Hackathon%20Team%20Invite`)}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  ✉ Contact Teammate
                </GlowButton>
              </GlassCard>
            ))}
        {!loading && filtered.length === 0 && !error && (
          <p className="muted">No teammates found for this filter.</p>
        )}
      </div>
    </div>
  );
};
