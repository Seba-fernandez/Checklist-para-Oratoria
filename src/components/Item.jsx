export default function Item({ texto, checked, onToggle }) {
  return (
    <button type="button" className="check-item" aria-pressed={checked} onClick={onToggle}>
      <span className="check-box" aria-hidden="true">
        {checked && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <span className="check-label">{texto}</span>
    </button>
  );
}
