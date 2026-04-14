import Item from './Item';

export default function Bloque({ bloque, checks, onToggle }) {
  const count = bloque.items.filter((_, i) => checks[`${bloque.id}-${i}`]).length;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: '1.2rem'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)'
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%',
          background: bloque.color, flexShrink: 0, display: 'inline-block'
        }}/>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1rem', flex: 1 }}>
          {bloque.icon} Bloque {bloque.id}: {bloque.name}
        </span>
        <span style={{
          fontSize: '0.75rem', borderRadius: 99, padding: '0.2rem 0.6rem',
          background: count > 0 ? 'var(--accent)' : 'var(--surface2)',
          color: count > 0 ? 'white' : 'var(--muted)',
          fontWeight: count > 0 ? 600 : 400, transition: 'all 0.2s'
        }}>
          {count}/{bloque.items.length}
        </span>
      </div>
      <div style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
        {bloque.items.map((texto, i) => (
          <Item
            key={i}
            texto={texto}
            checked={!!checks[`${bloque.id}-${i}`]}
            onToggle={() => onToggle(bloque.id, i)}
          />
        ))}
      </div>
    </div>
  );
}
