import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GlowButton } from "../components/GlowButton";

const FEATURES = [
  { icon: "🔍", title: "GitHub Verification", desc: "Real skill scores from your actual repositories and commit history." },
  { icon: "🛡️", title: "Trust Scoring", desc: "0–10 trust score based on activity, completeness, and code quality." },
  { icon: "🤖", title: "AI Matching", desc: "TF-IDF cosine similarity finds teammates with the best skill overlap." },
];

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero__badge">AI-Powered · GitHub Verified · Trust Scored</div>
        <h1 className="hero__title">
          Find Your Perfect<br />
          <span className="hero__title--glow">Hackathon Team</span>
        </h1>
        <p className="hero__subtitle">
          SkillForge matches developers using real GitHub data, AI compatibility scoring,
          and verified trust scores — not just self-reported skills.
        </p>
        <div className="hero__cta">
          {user ? (
            <GlowButton onClick={() => navigate("/dashboard")}>Go to Dashboard →</GlowButton>
          ) : (
            <>
              <GlowButton onClick={() => navigate("/signup")}>Get Started Free</GlowButton>
              <GlowButton variant="ghost" onClick={() => navigate("/login")}>Sign In</GlowButton>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card glass-card">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Formula */}
      <section className="formula glass-card">
        <h3 className="card-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          AI Matching Formula
        </h3>
        <div className="formula__grid">
          {[
            { weight: "40%", label: "Skill Similarity", sub: "TF-IDF cosine" },
            { weight: "25%", label: "GitHub Activity", sub: "Recent pushes + stars" },
            { weight: "20%", label: "Trust Score", sub: "Profile quality" },
            { weight: "15%", label: "Experience Level", sub: "Beginner → Advanced" },
          ].map((item) => (
            <div key={item.label} className="formula__item">
              <span className="formula__weight">{item.weight}</span>
              <span className="formula__label">{item.label}</span>
              <span className="formula__sub">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
