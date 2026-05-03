interface Props {
  score: number; // 0–100
}

export const CompatibilityRing = ({ score }: Props) => {
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#06b6d4" : score >= 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="compat-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="compat-ring__label" style={{ color }}>{score}%</span>
    </div>
  );
};
