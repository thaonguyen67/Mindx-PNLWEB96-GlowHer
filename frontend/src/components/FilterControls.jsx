import { useState, useId } from 'react';
import './FilterControls.css';

export function FilterCheck({ checked, onChange, label }) {
  return (
    <label className={`filter-check${checked ? ' checked' : ''}`} onClick={onChange}>
      <span className="check-box">
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}

export function FilterGroup({ label, hint, children, last, defaultOpen = true, activeCount = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={`filter-group${last ? ' last' : ''}${open ? ' open' : ''}`}>
      <button
        type="button"
        className="filter-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="filter-label">
          {label}
          {hint && <span className="filter-label-hint"> ({hint})</span>}
        </span>
        <span className="filter-toggle-right">
          {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
          <svg
            className={`filter-chev${open ? ' open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div id={panelId} className="filter-panel" hidden={!open}>
        <div className="filter-options">{children}</div>
      </div>
    </div>
  );
}
