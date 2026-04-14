export default function Header() {
  return (
    <header style={{ maxWidth: 680, margin: '0 auto 2.5rem', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', background: '#1e1a14',
        border: '1px solid var(--gold)', color: 'var(--gold)',
        fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase',
        padding: '0.3rem 0.9rem', borderRadius: 99, marginBottom: '1.1rem'
      }}>
        Curso de Oratoria · Autoevaluación
      </div>
      <h1 style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
        fontWeight: 400, lineHeight: 1.2, marginBottom: '0.7rem'
      }}>
        Checklist de <span style={{ color: 'var(--gold)' }}>Escucha Activa</span>
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
        Marcá los puntos que detectás como problema en tu grabación.<br/>
        Al final te doy el foco principal para tu próxima lectura.
      </p>
    </header>
  );
}
