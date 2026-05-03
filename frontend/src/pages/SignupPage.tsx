import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../services/authService";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";

export const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/profile");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <GlassCard className="auth-card">
        <h1 className="auth-title">⚡ SkillForge</h1>
        <p className="auth-subtitle">Create your developer profile</p>
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-msg">{error}</p>}
          <GlowButton type="submit" loading={loading}>Create Account</GlowButton>
        </form>
        <p className="auth-switch">
          Have an account? <Link to="/login">Sign In</Link>
        </p>
      </GlassCard>
    </div>
  );
};
