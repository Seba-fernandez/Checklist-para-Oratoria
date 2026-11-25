import { useEffect, useMemo, useState } from 'react';
import { bloques } from '../data/bloques';
import { evaluar, FUENTES } from '../motor/index.js';
import useRevelado from '../hooks/useRevelado';

const TITULOS = {
  AREA: 'Área crítica',
  'QUE PASA': 'Qué está pasando',
  'PARA LA PROXIMA': 'Para la próxima grabación',
  CRITERIO: 'Criterio aplicado',
};

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

// Separa el texto del modelo en las cuatro secciones que pide el prompt.
function partir(texto) {
  const partes = [];
  const regex = /^##\s*(.+?)\s*$/gm;
  const cortes = [...texto.matchAll(regex)];
  if (!cortes.length) return [{ clave: null, titulo: null, cuerpo: texto.trim() }];
  cortes.forEach((corte, i) => {
    const desde = corte.index + corte[0].length;
    const hasta = i + 1 < cortes.length ? cortes[i + 1].index : texto.length;
    const clave = corte[1].toUpperCase();
    partes.push({ clave, titulo: TITULOS[clave] || corte[1], cuerpo: texto.slice(desde, hasta).trim() });
  });
  return partes;
}

export default function Resultado({ checks, diag, onGuardar, tituloLectura, sesionesAnteriores, ppm }) {
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [intento, setIntento] = useState(0);
  const ref = useRevelado();

  // Los ítems marcados llevan el índice: es lo que la rúbrica usa para
  // ponderar por gravedad.
  const marcados = useMemo(() => bloques.flatMap(bloque => bloque.items
    .map((texto, idx) => ({ bloque: bloque.name, idx, texto }))
    .filter(item => checks[`${bloque.id}-${item.idx}`])), [checks]);

  // Rúbrica calculada en el navegador: notas y área crítica aparecen al
  // instante, sin esperar a la IA y sin costo de tokens.
  const rubrica = useMemo(() => evaluar(marcados, { ppm }), [marcados, ppm]);

  const porBloque = useMemo(
    () => new Map(rubrica.criterios.map(c => [c.bloque, c])),
    [rubrica]
  );

  useEffect(() => {
    let vigente = true;
    async function analizar() {
      setCargando(true);
      setError('');
      try {
        const texto = await pedirIA({ tipo: 'diagnostico', marcados, diag, ppm, titulo: tituloLectura });
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
        marcados,
        ppm,
        titulo: tituloLectura,
        historial: sesionesAnteriores || [],
      })).trim();
      texto = texto.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

      let parsed;
      try { parsed = JSON.parse(texto); }
      catch { parsed = null; }

      // Si el modelo falla, la sesión se guarda igual con las notas de la
      // rúbrica: el historial no depende de la IA.
      const progreso = parsed?.progreso || Object.fromEntries(
        rubrica.criterios.map(c => [c.bloque, { nota: c.nota, tendencia: 'estable', detalle: c.descriptor }])
      );

      onGuardar({
        titulo: tituloLectura || `Lectura ${Date.now()}`,
        fecha: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
        area: parsed?.area || rubrica.areaCritica.bloque,
        resumen: parsed?.resumen || '',
        items: marcados.map(item => `[${item.bloque}] ${item.texto}`),
        notas: [diag.problema, diag.ejemplo, diag.correccion].filter(Boolean).join(' · '),
        scores: bloques.map(bloque => ({
          name: bloque.name,
          count: marcados.filter(m => m.bloque === bloque.name).length,
          total: bloque.items.length,
        })),
        global: rubrica.global,
        ppm: rubrica.ppm?.ppm ?? null,
        progreso,
      });
      setGuardado(true);
      window.setTimeout(() => setGuardado(false), 2500);
    } catch (exception) {
      setErrorGuardado(exception.message);
    } finally {
      setGuardando(false);
    }
  }

  const area = rubrica.areaCritica;
  const fuentesArea = area.fuentes.map(k => FUENTES[k]?.corto).filter(Boolean).join(' · ');

  return (
    <section className="result-wrap" aria-labelledby="resultado-title" ref={ref}>
      <article className="result-card">
        <header className="result-head">
          <span className="result-stamp" aria-hidden="true">声</span>
          <div>
            <div className="result-overline">Rúbrica aplicada · {rubrica.totalMarcados} puntos marcados</div>
            <h2 className="result-title" id="resultado-title">Tu diagnóstico</h2>
          </div>
          <span className="result-global" aria-label={`Nota global ${rubrica.global} sobre 10`}>
            <strong>{rubrica.global}</strong><span>/10</span>
          </span>
        </header>

        <div className="result-scores" aria-label="Nota por dimensión">
          {bloques.map(bloque => {
            const c = porBloque.get(bloque.name);
            if (!c) return null;
            return (
              <div className="result-score" key={bloque.id}>
                <span className="result-score-name">
                  {bloque.name}
                  <em>{c.nivel}</em>
                </span>
                <div className="score-track">
                  <div
                    className={`score-fill nota-${c.nota <= 3 ? 'baja' : c.nota <= 5 ? 'media' : c.nota <= 7 ? 'buena' : 'alta'}`}
                    style={{ width: `${c.nota * 10}%` }}
                  />
                </div>
                <span className="result-score-nota">{c.nota}</span>
              </div>
            );
          })}
        </div>

        {rubrica.ppm && (
          <p className="result-measure">
            Velocidad medida: <strong>{rubrica.ppm.ppm} ppm</strong> ({rubrica.ppm.estado}).
            Franja óptima {rubrica.ppm.optimo[0]}–{rubrica.ppm.optimo[1]} ppm.
          </p>
        )}

        <div className="result-copy">
          {error ? (
            <div className="result-error" role="alert">
              <p>{error}</p>
              <p className="result-fallback">
                Las notas y el área crítica de arriba igual son válidas: se calculan con la
                rúbrica, no con la IA. El área a trabajar es <strong>{area.bloque}</strong>.
                {' '}{area.correccion}
              </p>
              <button type="button" className="button button-quiet" onClick={() => setIntento(value => value + 1)}>Reintentar redacción</button>
            </div>
          ) : cargando ? (
            <div className="result-loading"><span className="loading-dot" aria-hidden="true" /> Redactando sobre la rúbrica…</div>
          ) : (
            partir(respuesta).map((parte, i) => (
              <div className="result-section" key={i}>
                {parte.titulo && <h3 className="result-section-title">{parte.titulo}</h3>}
                {parte.cuerpo.split('\n').filter(Boolean).map((linea, j) => (
                  <p key={j}>{linea.replace(/\*\*/g, '')}</p>
                ))}
              </div>
            ))
          )}
        </div>

        <footer className="result-foot">
          <span className="result-crit">[{area.id}] {area.competencia}</span>
          <span className="result-src">{fuentesArea}</span>
          <span className="result-ev">Evidencia: {area.evidencia}</span>
        </footer>
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
