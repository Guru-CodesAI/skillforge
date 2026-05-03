import { useState, useEffect } from "react";
import { getProfile, analyzeGitHub } from "../services/skillforgeApi";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { TrustBadge } from "../components/TrustBadge";

export const DashboardPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [githubData, setGithubData] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await analyzeGitHub();
      setGithubData(res.data.github);
      setTrust(res.data.trust);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="section-title">Dashboard</h2>

      {profile && (
        <GlassCard className="dashboard-profile">
          <div className="profile-header">
            {githubData?.avatar_url && (
              <img src={githubData.avatar_url} alt="avatar" className="avatar" />
            )}
            <div>
              <h3>{profile.name}</h3>
              <p className="muted">{profile.email}</p>
              <p className="muted">@{profile.github_username} · {profile.experience_level}</p>
            </div>
            {trust && <TrustBadge score={trust.score} label={trust.label} />}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="card-title">GitHub Analysis</h3>
        {githubData ? (
          <div className="github-stats">
            <div className="stat"><span className="stat-value">{githubData.repo_count}</span><span className="stat-label">Repos</span></div>
            <div className="stat"><span className="stat-value">{githubData.total_stars}</span><span className="stat-label">Stars</span></div>
            <div className="stat"><span className="stat-value">{githubData.activity_score}</span><span className="stat-label">Activity</span></div>
            <div className="stat"><span className="stat-value">{githubData.followers}</span><span className="stat-label">Followers</span></div>
          </div>
        ) : (
          <p className="muted">Run analysis to see your GitHub stats.</p>
        )}
        {githubData?.languages?.length > 0 && (
          <div className="lang-tags">
            {githubData.languages.map((l: string) => (
              <span key={l} className="lang-tag">{l}</span>
            ))}
          </div>
        )}
        {error && <p className="error-msg">{error}</p>}
        <GlowButton onClick={handleAnalyze} loading={analyzing} style={{ marginTop: "1rem" }}>
          {githubData ? "Re-analyze GitHub" : "Analyze GitHub"}
        </GlowButton>
      </GlassCard>
    </div>
  );
};
