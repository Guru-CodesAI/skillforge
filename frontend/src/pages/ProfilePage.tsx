import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, createProfile } from "../services/skillforgeApi";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";

const LEVELS = ["beginner", "intermediate", "advanced"];

export const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    github_username: "",
    experience_level: "beginner",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setForm((f) => ({ ...f, ...res.data })))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await createProfile(form);
      setStatus("saved");
      setMessage("Profile saved!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      setStatus("error");
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setMessage(detail.map((d: any) => d.msg).join(", "));
      } else {
        setMessage(detail || err.message || "Failed to save profile. Is the backend running on port 8080?");
      }
    }
  };

  return (
    <div className="page-container">
      <GlassCard className="profile-card">
        <h2 className="section-title">Your Profile</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input className="input" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
          <input className="input" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="input" name="github_username" placeholder="GitHub Username" value={form.github_username} onChange={handleChange} required />
          <select className="input" name="experience_level" value={form.experience_level} onChange={handleChange}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          {message && <p className={status === "error" ? "error-msg" : "success-msg"}>{message}</p>}
          <GlowButton type="submit" loading={status === "loading"}>Save Profile</GlowButton>
        </form>
      </GlassCard>
    </div>
  );
};
