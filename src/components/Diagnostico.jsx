export default function Diagnostico({ valores, onChange }) {
  const campos = [
    { key: 'problema',   label: 'Problema principal detectado', placeholder: 'Ej: bajo la voz al terminar oraciones',        type: 'input'    },
    { key: 'ejemplo',    label: 'Ejemplo concreto del audio',   placeholder: 'Ej: en el minuto 1:20 corté la frase sin pausa', type: 'input'    },
    { key: 'correccion', label: 'Corrección para próxima lectura', placeholder: 'Ej: marcar con lápiz cada coma antes de leer', type: 'textarea' },
  ];

  const fieldStyle = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 7, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.85rem', padding: '0.55rem 0.75rem', outline: 'none', resize: 'none'
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem'
    }}>
      <div style={{
        padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)',
        fontFamily: 'DM Serif Display, serif', fontSize: '1rem'
      }}>
        📋 Diagnóstico Final{' '}
        <span style={{ color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', fontWeight: 300 }}>
          (opcional pero útil)
        </span>
      </div>
      <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {campos.map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label style={{
              fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em',
              textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem'
            }}>
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                rows={2}
                placeholder={placeholder}
                style={fieldStyle}
                value={valores[key]}
                onChange={e => onChange(key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                placeholder={placeholder}
                style={fieldStyle}
                value={valores[key]}
                onChange={e => onChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
