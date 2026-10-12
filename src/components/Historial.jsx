import { useState } from 'react';

const TENDENCIAS = {
  mejorando: { icono: '↗', color: '#526e43' },
  estable: { icono: '→', color: '#9a743d' },
  empeorando: { icono: '↘', color: '#a84935' },
};

function colorNota(nota) {
  if (nota >= 8) return '#526e43';
  if (nota >= 6) return '#8e7544';
  if (nota >= 4) return '#a84935';
  return '#954f3d';
}

function Score({ nombre, nota, tendencia, detalle }) {
  const estado = TENDENCIAS[tendencia] || TENDENCIAS.estable;
  return (
    <div className="history-score" title={detalle || undefined}>
      <span className="history-score-name">{nombre}</span>
      <div className="score-track"><div className="score-fill" style={{ width: `${Math.min(100, Math.max(0, Number(nota) * 10))}%`, background: colorNota(nota) }} /></div>
      <span className="history-score-value">{nota}</span>
      <span className="history-trend" style={{ color: estado.color }} aria-label={tendencia || 'estable'}>{estado.icono}</span>
    </div>
  );
}

export default function Historial({ sesiones, onBorrar }) {
  const [abierta, setAbierta] = useState(null);
  const progreso = sesiones[0]?.progreso || null;

  return (
    <aside className="history-panel" aria-labelledby="history-title">
      <div className="history-head">
        <span className="history-icon" aria-hidden="true">◷</span>
        <h2 className="history-title" id="history-title">Tu recorrido</h2>
        <span className="history-count" aria-label={`${sesiones.length} sesiones guardadas`}>{sesiones.length}</span>
      </div>

      {progreso && (
        <section className="history-progress" aria-label="Evaluación de progreso más reciente">
          <h3 className="history-progress-title">Progreso de tu práctica</h3>
          {Object.entries(progreso).map(([bloque, data]) => data?.nota ? (
            <Score key={bloque} nombre={bloque} nota={data.nota} tendencia={data.tendencia} detalle={data.detalle} />
          ) : null)}
        </section>
      )}

      {sesiones.length === 0 ? (
        <p className="history-empty">Tus prácticas guardadas van a aparecer acá para que puedas volver a ellas.</p>
      ) : (
        <div className="history-list">
          {sesiones.map((sesion, index) => {
            const estaAbierta = abierta === sesion.id;
            return (
              <article className="history-session" key={sesion.id}>
                <button
                  type="button"
                  className="history-session-toggle"
                  aria-expanded={estaAbierta}
                  onClick={() => setAbierta(estaAbierta ? null : sesion.id)}
                >
                  <span className="history-session-top"><span>Práctica {sesiones.length - index}</span><span>{sesion.fecha}</span></span>
                  <span className="history-session-name">{sesion.titulo || 'Lectura sin título'}</span>
                  <span className="history-session-area">{estaAbierta ? '−' : '+'} {sesion.area}</span>
                </button>

                {estaAbierta && (
                  <div className="history-detail">
                    {sesion.resumen && <p>{sesion.resumen}</p>}
                    {sesion.progreso && (
                      <details>
                        <summary>Evaluación por área</summary>
                        {Object.entries(sesion.progreso).map(([bloque, data]) => data ? (
                          <Score key={bloque} nombre={bloque} nota={data.nota || 0} tendencia={data.tendencia} />
                        ) : null)}
                      </details>
                    )}
                    {sesion.items?.length > 0 && (
                      <details>
                        <summary>Puntos marcados ({sesion.items.length})</summary>
                        <ul>{sesion.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>
                      </details>
                    )}
                    {sesion.notas && (
                      <details>
                        <summary>Tus notas</summary>
                        <p>{sesion.notas}</p>
                      </details>
                    )}
                    <button
                      type="button"
                      className="history-delete"
                      onClick={() => {
                        if (window.confirm('¿Borrar esta práctica del historial?')) onBorrar(sesion.id);
                      }}
                    >
                      Borrar práctica
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}
