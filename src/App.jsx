import { useEffect, useState } from 'react';
import { bloques } from './data/bloques';
import Header from './components/Header';
import Bloque from './components/Bloque';
import Diagnostico from './components/Diagnostico';
import Resultado from './components/Resultado';
import Historial from './components/Historial';

export default function App() {
  const [checks, setChecks]            = useState({});
  const [diag, setDiag]                = useState({ problema: '', ejemplo: '', correccion: '' });
  const [mostrarResultado, setMostrar] = useState(false);
  const [tituloLectura, setTituloLectura] = useState('');

  /* ── HISTORIAL ──────────────────────────────────
     Carga desde localStorage al abrir.
     Se guarda automáticamente cada vez que cambia.
  ────────────────────────────────────────────────*/
  const [sesiones, setSesiones] = useState(() => {
    try {
      const guardado = localStorage.getItem('oratoria-historial');
      if (!guardado) return [];
      const parsed = JSON.parse(guardado);

      // Migración: sesiones viejas sin `scores` → se los generamos
      // a partir de los items guardados (ej: "[Claridad] Cuesta entender...")
      return parsed.map(s => {
        if (s.scores) return s; // ya tiene, no tocar
        const scores = bloques.map(b => {
          const count = (s.items || []).filter(it => it.startsWith(`[${b.name}]`)).length;
          return { name: b.name, count, total: b.items.length };
        });
        return { ...s, scores };
      });
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('oratoria-historial', JSON.stringify(sesiones));
  }, [sesiones]);

  function guardarSesion(sesion) {
    setSesiones(prev => [{ ...sesion, id: Date.now() }, ...prev]);
  }

  function borrarSesion(id) {
    setSesiones(prev => prev.filter(s => s.id !== id));
  }
  /* ── FIN HISTORIAL ──────────────────────────── */

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
    setTituloLectura('');
    setMostrar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      {/* Layout: 2 columnas en desktop, 1 en mobile */}
      <style>{`
        .app-layout {
          display: grid;
          grid-template-columns: minmax(0, 680px) 300px;
          gap: 2rem;
          max-width: 1040px;
          margin: 0 auto;
          align-items: start;
        }
        @media (max-width: 800px) {
          .app-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="app-layout">
        {/* ====== COLUMNA IZQUIERDA: todo lo que ya existía ====== */}
        <main>
          {/* Input de título de lectura */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <label style={{
              fontSize: '0.7rem', color: 'var(--gold)', letterSpacing: '0.12em',
              textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem'
            }}>
              Lectura actual
            </label>
            <input
              type="text"
              placeholder='Ej: "El Principito — Cap. 3"'
              value={tituloLectura}
              onChange={e => setTituloLectura(e.target.value)}
              style={{
                width: '100%', maxWidth: 400,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)',
                fontFamily: 'DM Serif Display, serif', fontSize: '1rem',
                padding: '0.6rem 0.9rem', outline: 'none', textAlign: 'center'
              }}
            />
          </div>

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
            {mostrarResultado && (
              <Resultado checks={checks} diag={diag} onGuardar={guardarSesion} tituloLectura={tituloLectura} />
            )}
          </div>
        </main>

        {/* ====== COLUMNA DERECHA: historial ====== */}
        <Historial sesiones={sesiones} onBorrar={borrarSesion} />
      </div>
    </>
  );
}
