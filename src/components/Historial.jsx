import { useState } from 'react';

/*
  Historial de sesiones con métricas de progreso generadas por IA.
  
  Cada sesión tiene un campo `progreso` (generado por Claude al guardar):
  {
    "Claridad":  { nota: 7, tendencia: "mejorando", detalle: "..." },
    "Ritmo":     { nota: 5, tendencia: "estable",   detalle: "..." },
    ...
  }
  
  La sección "Tu progreso" muestra las notas de la ÚLTIMA sesión guardada,
  porque la IA ya incorporó todo el historial previo en su evaluación.
*/

const COLORES_TENDENCIA = {
  mejorando:  '#34d399',
  estable:    'var(--gold)',
  empeorando: '#f87171'
};

const ICONOS_TENDENCIA = {
  mejorando:  '↗',
  estable:    '→',
  empeorando: '↘'
};

function colorNota(nota) {
  if (nota >= 8) return '#34d399';
  if (nota >= 6) return 'var(--gold)';
  if (nota >= 4) return '#f59e0b';
  return '#f87171';
}

export default function Historial({ sesiones, onBorrar }) {
  const [abierta, setAbierta] = useState(null);

  // Métricas: usamos el progreso de la sesión más reciente
  // (la IA ya consideró todo el historial al generarlo)
  const ultimaSesion = sesiones.length > 0 ? sesiones[0] : null;
  const progreso = ultimaSesion?.progreso || null;

  return (
    <aside style={{
      position: 'sticky',
      top: '1rem',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '1rem 1.2rem',
      maxHeight: 'calc(100vh - 2rem)',
      overflowY: 'auto',
      alignSelf: 'start'
    }}>

      {/* Título */}
      <div style={{
        fontFamily: 'DM Serif Display, serif',
        fontSize: '1.1rem',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📑 Historial
        {sesiones.length > 0 && (
          <span style={{
            background: 'var(--surface2)',
            color: 'var(--muted)',
            fontSize: '0.7rem',
            padding: '0.15rem 0.5rem',
            borderRadius: 99
          }}>
            {sesiones.length}
          </span>
        )}
      </div>

      {/* ── MÉTRICAS DE PROGRESO (generadas por IA) ── */}
      {progreso && (
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 10,
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--gold)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            Tu progreso — evaluación IA
          </div>

          {Object.entries(progreso).map(([bloque, data]) => {
            if (!data || !data.nota) return null;
            const color = COLORES_TENDENCIA[data.tendencia] || 'var(--muted)';
            const icono = ICONOS_TENDENCIA[data.tendencia] || '→';

            return (
              <div key={bloque} style={{ marginBottom: '0.5rem' }}>
                {/* Fila: nombre + barra + nota */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.15rem'
                }}>
                  <span style={{ width: 70, color: 'var(--muted)', fontSize: '0.72rem', flexShrink: 0 }}>
                    {bloque}
                  </span>

                  {/* Barra que va de 0 a 10 */}
                  <div style={{
                    flex: 1, height: 5,
                    background: 'var(--border)',
                    borderRadius: 99, overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${data.nota * 10}%`,
                      background: colorNota(data.nota),
                      borderRadius: 99,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>

                  {/* Nota numérica */}
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: colorNota(data.nota),
                    width: 20,
                    textAlign: 'right'
                  }}>
                    {data.nota}
                  </span>

                  {/* Tendencia */}
                  <span style={{
                    fontSize: '0.65rem',
                    color,
                    fontWeight: 500,
                    width: 14,
                    textAlign: 'center'
                  }}>
                    {icono}
                  </span>
                </div>

                {/* Detalle del coach (1 oración) */}
                {data.detalle && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)',
                    paddingLeft: 70 + 6,
                    lineHeight: 1.3
                  }}>
                    {data.detalle}
                  </div>
                )}
              </div>
            );
          })}

          {/* Leyenda */}
          <div style={{
            marginTop: '0.5rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.62rem',
            color: 'var(--muted)',
            lineHeight: 1.4,
            display: 'flex',
            gap: '0.6rem',
            flexWrap: 'wrap'
          }}>
            <span><span style={{ color: '#34d399' }}>↗</span> Mejorando</span>
            <span><span style={{ color: 'var(--gold)' }}>→</span> Estable</span>
            <span><span style={{ color: '#f87171' }}>↘</span> A reforzar</span>
            <span style={{ marginLeft: 'auto' }}>Nota 1-10</span>
          </div>
        </div>
      )}

      {/* Caso vacío */}
      {sesiones.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          Todavía no guardaste ninguna lectura. Después de hacer un diagnóstico con IA, apretá "Guardar".
        </p>
      )}

      {/* Lista de sesiones */}
      {sesiones.map((s, i) => {
        const estaAbierta = abierta === s.id;
        const numero = sesiones.length - i;

        return (
          <div key={s.id} style={{
            borderBottom: i < sesiones.length - 1 ? '1px solid var(--border)' : 'none',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}>

            {/* Cabecera clickeable */}
            <button
              onClick={() => setAbierta(estaAbierta ? null : s.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem 0',
                fontFamily: 'DM Sans, sans-serif',
                color: 'var(--text)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  #{numero}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  {s.fecha}
                </span>
              </div>

              {/* Título de la lectura */}
              {s.titulo && (
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  marginBottom: '0.15rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {s.titulo}
                </div>
              )}

              <div style={{
                fontSize: '0.78rem',
                color: 'var(--gold)',
                fontWeight: 500
              }}>
                {estaAbierta ? '▾' : '▸'} {s.area}
              </div>
            </button>

            {/* Detalle expandible */}
            {estaAbierta && (
              <div style={{
                paddingLeft: '0.5rem',
                marginTop: '0.4rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#ccc'
              }}>
                {/* Resumen generado por la IA */}
                <p style={{ marginBottom: '0.6rem' }}>{s.resumen}</p>

                {/* Progreso de ESTA sesión (plegable) */}
                {s.progreso && (
                  <details style={{ marginBottom: '0.4rem' }}>
                    <summary style={{
                      cursor: 'pointer', fontSize: '0.75rem',
                      color: 'var(--muted)', padding: '0.2rem 0'
                    }}>
                      Evaluación por bloque
                    </summary>
                    <div style={{ marginTop: '0.25rem' }}>
                      {Object.entries(s.progreso).map(([bloque, data]) => {
                        if (!data) return null;
                        const color = COLORES_TENDENCIA[data.tendencia] || 'var(--muted)';
                        const icono = ICONOS_TENDENCIA[data.tendencia] || '→';
                        return (
                          <div key={bloque} style={{
                            display: 'flex', alignItems: 'center',
                            gap: '0.3rem', marginBottom: '0.25rem', fontSize: '0.72rem'
                          }}>
                            <span style={{ width: 60, color: 'var(--muted)' }}>{bloque}</span>
                            <div style={{
                              flex: 1, height: 3,
                              background: 'var(--border)', borderRadius: 99, overflow: 'hidden'
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${(data.nota || 0) * 10}%`,
                                background: colorNota(data.nota || 0),
                                borderRadius: 99
                              }} />
                            </div>
                            <span style={{ color: colorNota(data.nota || 0), fontWeight: 600, width: 16, textAlign: 'right' }}>
                              {data.nota}
                            </span>
                            <span style={{ color, width: 12, textAlign: 'center' }}>{icono}</span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}

                {/* Ítems marcados (plegable) */}
                {s.items && s.items.length > 0 && (
                  <details style={{ marginBottom: '0.4rem' }}>
                    <summary style={{
                      cursor: 'pointer', fontSize: '0.75rem',
                      color: 'var(--muted)', padding: '0.2rem 0'
                    }}>
                      Ítems marcados ({s.items.length})
                    </summary>
                    <ul style={{
                      paddingLeft: '1.2rem', marginTop: '0.25rem',
                      fontSize: '0.78rem', color: 'var(--muted)'
                    }}>
                      {s.items.map((it, j) => (
                        <li key={j} style={{ marginBottom: '0.15rem' }}>{it}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Notas manuales (plegable) */}
                {s.notas && (
                  <details style={{ marginBottom: '0.4rem' }}>
                    <summary style={{
                      cursor: 'pointer', fontSize: '0.75rem',
                      color: 'var(--muted)', padding: '0.2rem 0'
                    }}>
                      Notas manuales
                    </summary>
                    <p style={{
                      marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--muted)'
                    }}>
                      {s.notas}
                    </p>
                  </details>
                )}

                {/* Botón borrar */}
                <button
                  onClick={() => {
                    if (window.confirm('¿Borrar esta sesión del historial?')) {
                      onBorrar(s.id);
                    }
                  }}
                  style={{
                    marginTop: '0.4rem',
                    background: 'none',
                    border: '1px solid var(--cat5)',
                    color: 'var(--cat5)',
                    padding: '0.25rem 0.7rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.72rem'
                  }}
                >
                  Borrar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
