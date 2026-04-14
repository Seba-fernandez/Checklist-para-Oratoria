import { useState } from 'react';
import { bloques } from './data/bloques';
import Header from './components/Header';
import Bloque from './components/Bloque';
import Diagnostico from './components/Diagnostico';
import Resultado from './components/Resultado';

export default function App() {
  const [checks, setChecks]            = useState({});
  const [diag, setDiag]                = useState({ problema: '', ejemplo: '', correccion: '' });
  const [mostrarResultado, setMostrar] = useState(false);

  function toggle(blockId, itemIdx) {
    const key = `${blockId}-${itemIdx}`;
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function evaluar() {
    const total = Object.values(checks).filter(Boolean).length;
    if (total === 0) { alert('Marcá al menos un punto antes de evaluar.'); return; }
    setMostrar(true);
    setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function resetAll() {
    setChecks({});
    setDiag({ problema: '', ejemplo: '', correccion: '' });
    setMostrar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      <Header />

      {bloques.map(b => (
        <Bloque key={b.id} bloque={b} checks={checks} onToggle={toggle} />
      ))}

      <Diagnostico
        valores={diag}
        onChange={(k, v) => setDiag(prev => ({ ...prev, [k]: v }))}
      />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={resetAll} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted)', borderRadius: 10, padding: '0.75rem 1.2rem',
          fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', cursor: 'pointer'
        }}>
          ↺ Limpiar
        </button>
        <button onClick={evaluar} style={{
          flex: 1, background: 'var(--accent)', border: 'none', color: 'white',
          borderRadius: 10, padding: '0.85rem', fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
        }}>
          Ver diagnóstico con IA →
        </button>
      </div>

      <div id="resultado">
        {mostrarResultado && <Resultado checks={checks} diag={diag} />}
      </div>

    </div>
  );
}
