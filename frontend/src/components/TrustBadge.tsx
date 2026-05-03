interface Props {
  score: number;
  label: string;
}

export const TrustBadge = ({ score, label }: Props) => {
  const color =
    label === "High" ? "#22c55e" : label === "Medium" ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="trust-badge"
      style={{ borderColor: color, color, boxShadow: `0 0 8px ${color}55` }}
    >
      {label} · {score}/10
    </span>
  );
};
