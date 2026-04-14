export default function Item({ texto, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.55rem 0.5rem', borderRadius: '8px', cursor: 'pointer',
        background: checked ? 'rgba(232,64,64,0.06)' : 'transparent',
        border: `1px solid ${checked ? 'rgba(232,64,64,0.15)' : 'transparent'}`,
        transition: 'all 0.15s'
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--accent)' : 'var(--surface2)',
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.15s'
      }}>
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{
        fontSize: '0.88rem',
        color: checked ? 'var(--accent)' : '#ccc',
        textDecoration: checked ? 'line-through' : 'none',
        textDecorationColor: 'rgba(232,64,64,0.4)',
        transition: 'color 0.15s'
      }}>
        {texto}
      </span>
    </div>
  );
}
