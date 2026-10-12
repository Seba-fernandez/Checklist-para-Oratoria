import { useEffect, useState } from 'react';
import { bloques } from '../data/bloques';

async function pedirIA(payload) {
  const response = await fetch('/api/diagnostico', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `No se pudo completar el análisis (${response.status}).`);
  return data.texto || '';
}

export default function Resultado({ checks, diag, onGuardar, tituloLectura, sesionesAnteriores }) {
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [intento, setIntento] = useState(0);

  const scores = bloques.map(bloque => ({
    ...bloque,
    count: bloque.items.filter((_, index) => checks[`${bloque.id}-${index}`]).length,
  }));
  const itemsMarcados = bloques.flatMap(bloque => bloque.items
    .map((texto, index) => ({ bloque: bloque.name, texto, marcado: !!checks[`${bloque.id}-${index}`] }))
    .filter(item => item.marcado));

  useEffect(() => {
    let vigente = true;
    async function analizar() {
      setCargando(true);
      setError('');
      try {
        const texto = await pedirIA({ tipo: 'diagnostico', items: itemsMarcados, diag });
        if (vigente) setRespuesta(texto);
      } catch (exception) {
        if (vigente) setError(exception.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }
    analizar();
    return () => { vigente = false; };
  }, [intento]);

  async function handleGuardar() {
    if (guardando || guardado) return;
    setGuardando(true);
    setErrorGuardado('');
    try {
      let texto = (await pedirIA({
        tipo: 'progreso',
        items: itemsMarcados,
        scores: scores.map(({ name, count, items }) => ({ name, count, total: items.length })),
        titulo: tituloLectura,
        diagnostico: respuesta,
        historial: sesionesAnteriores || [],
      })).trim();
      texto = texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      let parsed;
      try { parsed = JSON.parse(texto); }
      catch { parsed = { area: 'Sin clasificar', resumen: texto.slice(0, 200), progreso: null }; }

      onGuardar({
        titulo: tituloLectura || `Lectura ${Date.now()}`,
        fecha: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
        area: parsed.area || 'Sin clasificar',
        resumen: parsed.resumen || '',
        items: itemsMarcados.map(item => `[${item.bloque}] ${item.texto}`),
        notas: [diag.problema, diag.ejemplo, diag.correccion].filter(Boolean).join(' · '),
        scores: scores.map(({ name, count, items }) => ({ name, count, total: items.length })),
        progreso: parsed.progreso || null,
      });
      setGuardado(true);
      window.setTimeout(() => setGuardado(false), 2500);
    } catch (exception) {
      setErrorGuardado(exception.message);
    } finally {
      setGuardando(false);
    }
  }

  function renderTexto(texto) {
    return texto.split('\n').map((linea, index) => {
      const partes = linea.split(/\*\*(.+?)\*\*/g);
      return <p key={index}>{partes.map((parte, partIndex) => partIndex % 2 ? <strong key={partIndex}>{parte}</strong> : parte)}</p>;
    });
  }

  return (
    <section className="result-wrap" aria-labelledby="resultado-title">
      <article className="result-card">
        <header className="result-head">
          <span className="result-stamp" aria-hidden="true">声</span>
          <div>
            <div className="result-overline">Una guía para seguir practicando</div>
            <h2 className="result-title" id="resultado-title">Tu diagnóstico</h2>
          </div>
        </header>

        <div className="result-scores" aria-label="Resumen de puntos por área">
          {scores.map(bloque => {
            const porcentaje = Math.round((bloque.count / bloque.items.length) * 100);
            return (
              <div className="result-score" key={bloque.id}>
                <span>{bloque.name}</span>
                <div className="score-track"><div className="score-fill" style={{ width: `${porcentaje}%` }} /></div>
                <span>{bloque.count}</span>
              </div>
            );
          })}
        </div>

        <div className="result-copy">
          {error ? (
            <div className="result-error" role="alert">
              <p>{error}</p>
              <button type="button" className="button button-quiet" onClick={() => setIntento(value => value + 1)}>Reintentar análisis</button>
            </div>
          ) : cargando ? (
            <div className="result-loading"><span className="loading-dot" aria-hidden="true" /> Analizando tu escucha…</div>
          ) : renderTexto(respuesta)}
          {errorGuardado && <p className="result-error" role="alert">No se pudo guardar: {errorGuardado}</p>}
        </div>
      </article>

      {respuesta && !cargando && !error && (
        <div className="save-row">
          <button type="button" className="button button-save" onClick={handleGuardar} disabled={guardando || guardado}>
            {guardando ? 'Guardando…' : guardado ? 'Guardado en tu historial' : 'Guardar esta práctica'}
          </button>
        </div>
      )}
    </section>
  );
}
