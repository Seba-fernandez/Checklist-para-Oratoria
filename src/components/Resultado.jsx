import { useEffect, useState } from 'react';
import { bloques } from '../data/bloques';

const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

function buildPrompt(itemsMarcados, diag) {
  const lineas = itemsMarcados.map(i => `- [${i.bloque}] ${i.texto}`).join('\n');

  const diagExtra = [
    diag.problema  && `Problema que notó: ${diag.problema}`,
    diag.ejemplo   && `Ejemplo del audio: ${diag.ejemplo}`,
    diag.correccion && `Corrección que intentó: ${diag.correccion}`,
  ].filter(Boolean).join('\n');

  return `Sos un coach de oratoria. Un alumno se grabó leyendo un fragmento de texto durante 2 minutos como ejercicio de un curso, se escuchó y marcó los siguientes problemas detectados:

${lineas}
${diagExtra ? `\nNota adicional del alumno:\n${diagExtra}` : ''}

Respondé en español rioplatense (vos, tuteo), de forma directa y concisa. Sin saludos ni introducción. Usá este formato exacto:

**ÁREA CRÍTICA:** [nombre del área más problemática en una línea]

**QUÉ ESTÁ PASANDO:** [2-3 oraciones explicando qué falla técnicamente y por qué afecta la oratoria]

**PARA LA PRÓXIMA GRABACIÓN:** [una sola acción concreta y específica, máximo 2 oraciones]

**MINI GUÍA:**
[según el área crítica, elegí UNO de estos y expandilo brevemente:
- Dicción → leer más lento + exagerar pronunciación
- Ritmo → marcar comas con pausa consciente
- Intención → subrayar palabras clave antes de leer
- Pausas → respirar antes de cada oración
- Seguridad → volumen constante + terminar frases firme]`;
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
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            messages: [{ role: 'user', content: buildPrompt(itemsMarcados, diag) }]
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || `Error ${res.status}`);
        }

        const data = await res.json();
        setRespuesta(data.content?.[0]?.text || '');
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
      // Armar resumen del historial previo para darle contexto a la IA
      let contextoHistorial = '';
      if (sesionesAnteriores && sesionesAnteriores.length > 0) {
        // Últimas 5 sesiones como máximo para no pasarnos de tokens
        const ultimas = sesionesAnteriores.slice(0, 5);
        contextoHistorial = `\n\nHISTORIAL DE SESIONES ANTERIORES (de más reciente a más antigua):
${ultimas.map((s, i) => {
  const itemsTxt = (s.items || []).join(', ');
  return `Sesión ${ultimas.length - i}: ${s.titulo || 'Sin título'} (${s.fecha})
  Área crítica: ${s.area}
  Errores: ${itemsTxt}
  ${s.progreso ? `Evaluación anterior: ${JSON.stringify(s.progreso)}` : ''}`;
}).join('\n')}`;
      }

      // Scores actuales por bloque
      const scoresActuales = bloques.map(b => {
        const count = b.items.filter((_, idx) => checks[`${b.id}-${idx}`]).length;
        return `${b.name}: ${count}/${b.items.length} errores`;
      }).join(', ');

      const listaItems = itemsMarcados.map(it => `[${it.bloque}] ${it.texto}`);

      const prompt = `Sos un coach profesional de oratoria con formación en fonoaudiología y técnica vocal. Evaluás el progreso de un alumno que practica lectura en voz alta.

CONTEXTO DE LA EVALUACIÓN:
- El alumno se graba leyendo fragmentos de texto de 2 minutos
- Se escucha y marca los errores que detecta
- Los 5 bloques de evaluación son: Claridad (dicción, pronunciación), Ritmo (velocidad, pausas rítmicas), Intención (expresividad, tono), Pausas (respiración, fraseo), Seguridad (firmeza, volumen)
- Cada bloque tiene ~5 ítems negativos posibles

LECTURA ACTUAL: "${tituloLectura || 'Sin título'}"
ERRORES MARCADOS: ${scoresActuales}
DETALLE: ${listaItems.join(', ')}

DIAGNÓSTICO QUE RECIBIÓ:
${respuesta}
${contextoHistorial}

Respondé SOLO un JSON válido, sin markdown ni backticks ni texto extra, con esta estructura:

{
  "area": "área crítica principal en 2-4 palabras",
  "resumen": "qué falla técnicamente y una acción concreta, máximo 2 oraciones en español rioplatense",
  "progreso": {
    "Claridad": {"nota": 1-10, "tendencia": "mejorando|estable|empeorando", "detalle": "1 oración: qué cambió respecto a antes o qué observás si es la primera sesión"},
    "Ritmo": {"nota": 1-10, "tendencia": "mejorando|estable|empeorando", "detalle": "..."},
    "Intención": {"nota": 1-10, "tendencia": "mejorando|estable|empeorando", "detalle": "..."},
    "Pausas": {"nota": 1-10, "tendencia": "mejorando|estable|empeorando", "detalle": "..."},
    "Seguridad": {"nota": 1-10, "tendencia": "mejorando|estable|empeorando", "detalle": "..."}
  }
}

CRITERIOS PARA LAS NOTAS (basate en estándares reales de oratoria):
- 1-3: Problema severo, afecta la comprensión del mensaje
- 4-5: Problema notable, el oyente lo percibe claramente
- 6-7: Aceptable con margen de mejora, errores esporádicos
- 8-9: Buen nivel, errores mínimos o técnicos
- 10: Excelente, nivel profesional

Para la tendencia: si no hay historial previo, poné "estable" y basate solo en los errores actuales.
Si hay historial, compará los errores de esta sesión con las anteriores considerando:
- No solo la cantidad sino el TIPO de error (no es lo mismo "me como finales" que "arrastro palabras")
- El tipo de texto importa: un texto con vocabulario técnico dificulta Claridad, uno emotivo exige más Intención
- Menos errores marcados en un bloque no siempre es mejora si el texto era más fácil`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      let texto = (data.content?.[0]?.text || '').trim();

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
        scores: bloques.map(b => ({
          name: b.name,
          count: b.items.filter((_, idx) => checks[`${b.id}-${idx}`]).length,
          total: b.items.length
        })),
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
