import { useState, useEffect } from "react";
import { getAdminUsers, getAdminStats, removeUser, flagUser } from "../services/skillforgeApi";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { TrustBadge } from "../components/TrustBadge";

type TrustFilter = "all" | "high" | "medium" | "low" | "unanalyzed";

export const AdminPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trustFilter, setTrustFilter] = useState<TrustFilter>("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([getAdminUsers(), getAdminStats()]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Access denied or error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove user "${name}"? This cannot be undone.`)) return;
    try {
      await removeUser(userId);
      setUsers((u) => u.filter((x) => x.id !== userId));
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to remove user.");
    }
  };

  const handleFlag = async (userId: string) => {
    try {
      const res = await flagUser(userId);
      setUsers((u) => u.map((x) => x.id === userId ? { ...x, flagged: res.data.flagged } : x));
    } catch {
      alert("Failed to flag user.");
    }
  };

  const filtered = users.filter((u) => {
    if (trustFilter === "all") return true;
    if (trustFilter === "unanalyzed") return u.trust_score == null;
    if (trustFilter === "high") return u.trust_score != null && u.trust_score >= 7;
    if (trustFilter === "medium") return u.trust_score != null && u.trust_score >= 4 && u.trust_score < 7;
    if (trustFilter === "low") return u.trust_score != null && u.trust_score < 4;
    return true;
  });

  if (loading) return <div className="loading-screen">Loading admin panel…</div>;
  if (error) return <div className="page-container"><p className="error-msg">{error}</p></div>;

  return (
    <div className="page-container">
      <h2 className="section-title">Admin Panel</h2>

      {stats && (
        <div className="stats-row">
          <GlassCard className="stat-card">
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-label">Total Users</span>
          </GlassCard>
          <GlassCard className="stat-card">
            <span className="stat-value">{stats.analyzed_users}</span>
            <span className="stat-label">Analyzed</span>
          </GlassCard>
          <GlassCard className="stat-card">
            <span className="stat-value">{stats.average_trust_score}</span>
            <span className="stat-label">Avg Trust</span>
          </GlassCard>
          <GlassCard className="stat-card">
            <span className="stat-value" style={{ color: "var(--danger)" }}>{stats.flagged_users ?? 0}</span>
            <span className="stat-label">Flagged</span>
          </GlassCard>
        </div>
      )}

      <GlassCard>
        <div className="admin-table-header">
          <h3 className="card-title" style={{ margin: 0 }}>All Users</h3>
          <div className="filter-tabs">
            {(["all", "high", "medium", "low", "unanalyzed"] as TrustFilter[]).map((f) => (
              <button
                key={f}
                className={`filter-tab ${trustFilter === f ? "filter-tab--active" : ""}`}
                onClick={() => setTrustFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-table-wrapper" style={{ marginTop: "1rem" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>GitHub</th>
                <th>Level</th>
                <th>Trust</th>
                <th>Analyzed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={u.flagged ? "row--flagged" : ""}>
                  <td>
                    {u.flagged && <span className="flag-indicator">🚩 </span>}
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td>@{u.github_username}</td>
                  <td>{u.experience_level}</td>
                  <td>
                    {u.trust_score != null
                      ? <TrustBadge
                          score={u.trust_score}
                          label={u.trust_score >= 7 ? "High" : u.trust_score >= 4 ? "Medium" : "Low"}
                        />
                      : <span className="muted">—</span>}
                  </td>
                  <td>{u.github_analyzed ? "✅" : "❌"}</td>
                  <td className="admin-actions">
                    <GlowButton
                      variant="ghost"
                      onClick={() => handleFlag(u.id)}
                      style={{ fontSize: "0.75rem", padding: "4px 10px", minWidth: "auto" }}
                    >
                      {u.flagged ? "Unflag" : "Flag"}
                    </GlowButton>
                    <GlowButton
                      variant="danger"
                      onClick={() => handleRemove(u.id, u.name)}
                    >
                      Remove
                    </GlowButton>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>
                    No users match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
