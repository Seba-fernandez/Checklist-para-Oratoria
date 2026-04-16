import { useState } from 'react';

/*
  Historial de sesiones — sidebar derecho en desktop, sección abajo en mobile.
  
  Props:
    sesiones → [{id, titulo, fecha, area, resumen, items, notas, scores}]
    onBorrar → función(id)
  
  scores es un array por sesión: [{name: "Claridad", count: 3, total: 5}, ...]
  Se usa para calcular las métricas de progreso.
*/

// ── MÉTRICAS DE PROGRESO ──────────────────────
// Compara las últimas 3 sesiones vs las 3 anteriores.
// Si no hay suficientes, compara la última vs la primera.
// Devuelve un array con el estado de cada bloque.
function calcularProgreso(sesiones) {
  if (sesiones.length < 2) return null;

  // sesiones[0] es la más reciente
  const ultima = sesiones[0];
  const primera = sesiones[sesiones.length - 1];

  if (!ultima.scores || !primera.scores) return null;

  // Si hay 6+, promediamos últimas 3 vs anteriores 3.
  // Si hay menos, comparamos última vs primera.
  const recientes = sesiones.slice(0, Math.min(3, sesiones.length));
  const anteriores = sesiones.length >= 6
    ? sesiones.slice(3, 6)
    : [sesiones[sesiones.length - 1]];

  function promedioBloque(grupo, nombreBloque) {
    const validos = grupo.filter(s => s.scores);
    if (validos.length === 0) return null;
    const suma = validos.reduce((acc, s) => {
      const b = s.scores.find(x => x.name === nombreBloque);
      return acc + (b ? b.count / b.total : 0);
    }, 0);
    return suma / validos.length;
  }

  // Nombres de bloques sacados de la primera sesión con scores
  const nombres = (ultima.scores || []).map(s => s.name);

  return nombres.map(name => {
    const ahora = promedioBloque(recientes, name);
    const antes = promedioBloque(anteriores, name);

    if (ahora === null || antes === null) return { name, estado: 'sin-datos' };

    const diff = antes - ahora; // positivo = mejoró (menos errores)
    const pctActual = Math.round(ahora * 100);

    let estado, color;
    if (diff > 0.1) {
      estado = '↗ Mejorando';
      color = '#34d399'; // verde
    } else if (diff < -0.1) {
      estado = '↘ A reforzar';
      color = '#f87171'; // rojo
    } else {
      estado = '→ Estable';
      color = 'var(--gold)';
    }

    return { name, pctActual, estado, color };
  });
}

export default function Historial({ sesiones, onBorrar }) {
  const [abierta, setAbierta] = useState(null);

  const progreso = calcularProgreso(sesiones);

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

      {/* ── MÉTRICAS DE PROGRESO (solo si hay 2+ sesiones) ── */}
      {progreso && (
        <div style={{
          background: 'var(--surface2)',
          borderRadius: 10,
          padding: '0.75rem',
          marginBottom: '1rem',
          fontSize: '0.78rem'
        }}>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--gold)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            Tu progreso
          </div>

          {progreso.map(p => (
            p.estado !== 'sin-datos' && (
              <div key={p.name} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.35rem'
              }}>
                {/* Nombre del bloque */}
                <span style={{ width: 70, color: 'var(--muted)', fontSize: '0.72rem', flexShrink: 0 }}>
                  {p.name}
                </span>

                {/* Barrita */}
                <div style={{
                  flex: 1, height: 4,
                  background: 'var(--border)',
                  borderRadius: 99, overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${100 - p.pctActual}%`,
                    background: p.color,
                    borderRadius: 99,
                    transition: 'width 0.6s ease'
                  }} />
                </div>

                {/* Estado */}
                <span style={{
                  fontSize: '0.65rem',
                  color: p.color,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  width: 75,
                  textAlign: 'right'
                }}>
                  {p.estado}
                </span>
              </div>
            )
          ))}

          <div style={{
            marginTop: '0.4rem',
            fontSize: '0.65rem',
            color: 'var(--muted)',
            lineHeight: 1.3
          }}>
            Menos errores marcados = la barra crece.
            {sesiones.length < 6
              ? ' Compara primera vs última sesión.'
              : ' Promedio últimas 3 vs anteriores 3.'}
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

                {/* Scores por bloque de esta sesión */}
                {s.scores && (
                  <details style={{ marginBottom: '0.4rem' }}>
                    <summary style={{
                      cursor: 'pointer', fontSize: '0.75rem',
                      color: 'var(--muted)', padding: '0.2rem 0'
                    }}>
                      Errores por bloque
                    </summary>
                    <div style={{ marginTop: '0.25rem' }}>
                      {s.scores.map(sc => (
                        <div key={sc.name} style={{
                          display: 'flex', alignItems: 'center',
                          gap: '0.3rem', marginBottom: '0.2rem', fontSize: '0.72rem'
                        }}>
                          <span style={{ width: 60, color: 'var(--muted)' }}>{sc.name}</span>
                          <div style={{
                            flex: 1, height: 3,
                            background: 'var(--border)', borderRadius: 99, overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.round((sc.count / sc.total) * 100)}%`,
                              background: sc.count === 0 ? '#34d399' : sc.count >= sc.total * 0.6 ? '#f87171' : 'var(--gold)',
                              borderRadius: 99
                            }} />
                          </div>
                          <span style={{ color: 'var(--muted)', width: 24, textAlign: 'right' }}>
                            {sc.count}/{sc.total}
                          </span>
                        </div>
                      ))}
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
