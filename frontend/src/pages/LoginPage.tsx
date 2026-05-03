import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <GlassCard className="auth-card">
        <h1 className="auth-title">⚡ SkillForge</h1>
        <p className="auth-subtitle">Sign in to find your perfect hackathon team</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-msg">{error}</p>}
          <GlowButton type="submit" loading={loading}>Sign In</GlowButton>
        </form>
        <p className="auth-switch">
          No account? <Link to="/signup">Sign Up</Link>
        </p>
      </GlassCard>
    </div>
  );
};
