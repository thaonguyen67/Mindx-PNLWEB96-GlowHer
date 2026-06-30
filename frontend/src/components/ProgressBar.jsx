export default function ProgressBar({ completed, total, showLabel = true }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="prog-bar-wrap">
      {showLabel && (
        <div className="prog-bar-row">
          <span className="prog-bar-label">{completed} / {total}</span>
          <span className="prog-bar-pct">{pct}%</span>
        </div>
      )}
      <div className="prog-bar-track">
        <div className="prog-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
