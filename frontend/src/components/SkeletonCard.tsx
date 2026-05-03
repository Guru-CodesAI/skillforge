export const SkeletonCard = () => (
  <div className="glass-card skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton skeleton--circle" />
      <div className="skeleton-lines">
        <div className="skeleton skeleton--line skeleton--w70" />
        <div className="skeleton skeleton--line skeleton--w50" />
      </div>
    </div>
    <div className="skeleton skeleton--line skeleton--w100" style={{ marginTop: "1rem" }} />
    <div className="skeleton skeleton--line skeleton--w80" />
    <div className="skeleton skeleton--line skeleton--w60" />
  </div>
);
