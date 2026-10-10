import { useEffect, useState } from 'react';
import { bloques } from '../data/bloques';

// Las llamadas a la IA pasan por nuestra función serverless (/api/diagnostico).
// La API key y los prompts viven en el servidor, nunca en el navegador.
async function pedirIA(payload) {
  const res = await fetch('/api/diagnostico', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data.texto || '';
}

export default function Resultado({ checks, diag, onGuardar, tituloLectura, sesionesAnteriores }) {
  const [respuesta, setRespuesta]   = useState('');
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [guardado, setGuardado]     = useState(false);

  // Calcular scores para las barras
  const scores = bloques
    .map(b => ({
      ...b,
      count: b.items.filter((_, i) => checks[`${b.id}-${i}`]).length
    }))
    .sort((a, b) => b.count - a.count);

  // Armar lista de ítems marcados con nombre de bloque
  const itemsMarcados = bloques.flatMap(b =>
    b.items
      .map((texto, i) => ({ bloque: b.name, texto, marcado: !!checks[`${b.id}-${i}`] }))
      .filter(x => x.marcado)
  );

  useEffect(() => {
    if (itemsMarcados.length === 0) return;

    async function llamarIA() {
      setCargando(true);
      setRespuesta('');
      setError('');

      try {
        const texto = await pedirIA({ tipo: 'diagnostico', items: itemsMarcados, diag });
        setRespuesta(texto);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }

    llamarIA();
  }, []);

  // ── GUARDAR EN HISTORIAL ──────────────────────
  // Hace una 2da llamada a Claude con contexto de oratoria profesional.
  // Le pasa el diagnóstico actual + historial previo para que evalúe
  // con criterio real de oratoria, no solo contando errores.
  async function handleGuardar() {
    if (guardando || guardado) return;
    setGuardando(true);

    try {
      const listaItems = itemsMarcados.map(it => `[${it.bloque}] ${it.texto}`);
      const scoresActuales = bloques.map(b => ({
        name: b.name,
        count: b.items.filter((_, idx) => checks[`${b.id}-${idx}`]).length,
        total: b.items.length
      }));

      let texto = (await pedirIA({
        tipo: 'progreso',
        items: itemsMarcados,
        scores: scoresActuales,
        titulo: tituloLectura,
        diagnostico: respuesta,
        historial: sesionesAnteriores || [],
      })).trim();

      // Limpieza defensiva
      texto = texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      let parsed;
      try {
        parsed = JSON.parse(texto);
      } catch {
        parsed = { area: 'Sin clasificar', resumen: texto.slice(0, 200), progreso: null };
      }

      const notas = [diag.problema, diag.ejemplo, diag.correccion]
        .filter(Boolean)
        .join(' • ');

      onGuardar({
        titulo: tituloLectura || `Lectura ${Date.now()}`,
        fecha: new Date().toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit'
        }),
        area: parsed.area || 'Sin clasificar',
        resumen: parsed.resumen || '',
        items: listaItems,
        notas,
        scores: scoresActuales,
        progreso: parsed.progreso || null
      });

      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      alert('No se pudo guardar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  }
  // ── FIN GUARDAR ──────────────────────────────

  // Renderizar markdown básico (**negrita**, saltos de línea)
  function renderTexto(texto) {
    return texto.split('\n').map((linea, i) => {
      const partes = linea.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} style={{ marginBottom: linea === '' ? '0.5rem' : '0.3rem', lineHeight: 1.7 }}>
          {partes.map((parte, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{parte}</strong>
              : parte
          )}
        </p>
      );
    });
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
              Diagnóstico con IA
            </div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem' }}>
              Análisis de tu grabación
            </div>
          </div>
        </div>

        {/* Barras resumen */}
        <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {scores.map(b => {
            const pct = Math.round((b.count / b.items.length) * 100);
            return (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                <span style={{ width: 90, color: 'var(--muted)', flexShrink: 0 }}>{b.icon} {b.name}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: b.color, borderRadius: 99, transition: 'width 0.6s ease' }}/>
                </div>
                <span style={{ width: 20, textAlign: 'right', color: 'var(--muted)' }}>{b.count}</span>
              </div>
            );
          })}
        </div>

        {/* Respuesta IA */}
        <div style={{ padding: '1.2rem' }}>
          {error ? (
            <div style={{
              background: 'rgba(232,64,64,0.08)', border: '1px solid rgba(232,64,64,0.2)',
              borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#f87171'
            }}>
              ⚠️ {error}
            </div>
          ) : cargando && respuesta === '' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
              <span style={{ animation: 'pulse 1.2s infinite' }}>⏳</span> Analizando tu grabación...
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
          ) : (
            <div style={{ fontSize: '0.88rem', color: '#ccc' }}>
              {renderTexto(respuesta)}
              {cargando && <span style={{ opacity: 0.5, animation: 'pulse 1s infinite' }}>▌</span>}
            </div>
          )}
        </div>

      </div>

      {/* Botón guardar — solo aparece cuando ya hay respuesta */}
      {respuesta && !cargando && !error && (
        <div style={{ padding: '0.75rem 0 0', textAlign: 'right' }}>
          <button
            onClick={handleGuardar}
            disabled={guardando || guardado}
            style={{
              background: guardado ? '#34d399' : 'var(--gold)',
              color: '#0f0f0f',
              border: 'none',
              borderRadius: 8,
              padding: '0.6rem 1.2rem',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: guardando || guardado ? 'not-allowed' : 'pointer',
              opacity: guardando ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {guardando ? '⏳ Guardando...' : guardado ? '✓ Guardado' : '📑 Guardar en historial'}
          </button>
        </div>
      )}

    </div>
  );
}
