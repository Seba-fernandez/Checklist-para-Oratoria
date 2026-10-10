// api/diagnostico.js
// Función serverless (Vercel). La API key vive SOLO acá, en process.env.ANTHROPIC_API_KEY.
// El navegador manda datos crudos (ítems marcados, historial, etc.); el prompt,
// el modelo y los max_tokens se fijan acá, así nadie puede usar este endpoint
// como un Claude gratis.

const MODELO = 'claude-haiku-4-5-20251001';

// ── Sanitizado: limita tamaños para que no se pueda abusar del endpoint ──
const txt = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(99, Math.round(v))) : 0);

function limpiarItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 40).map(i => ({ bloque: txt(i?.bloque, 40), texto: txt(i?.texto, 200) }))
    .filter(i => i.texto);
}

function limpiarScores(scores) {
  if (!Array.isArray(scores)) return [];
  return scores.slice(0, 10).map(s => ({ name: txt(s?.name, 40), count: num(s?.count), total: num(s?.total) }));
}

function limpiarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  // Últimas 5 sesiones como máximo para no pasarnos de tokens
  return historial.slice(0, 5).map(s => ({
    titulo: txt(s?.titulo, 150),
    fecha: txt(s?.fecha, 40),
    area: txt(s?.area, 80),
    items: Array.isArray(s?.items) ? s.items.slice(0, 40).map(x => txt(x, 250)) : [],
    progreso: s?.progreso ? JSON.stringify(s.progreso).slice(0, 2000) : '',
  }));
}

// ── Prompt 1: diagnóstico inicial ──
function promptDiagnostico(items, diag) {
  const lineas = items.map(i => `- [${i.bloque}] ${i.texto}`).join('\n');

  const diagExtra = [
    diag.problema   && `Problema que notó: ${diag.problema}`,
    diag.ejemplo    && `Ejemplo del audio: ${diag.ejemplo}`,
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

// ── Prompt 2: evaluación de progreso (al guardar en historial) ──
// Le pasa el diagnóstico actual + historial previo para que evalúe
// con criterio real de oratoria, no solo contando errores.
function promptProgreso({ items, scores, titulo, diagnostico, historial }) {
  let contextoHistorial = '';
  if (historial.length > 0) {
    contextoHistorial = `\n\nHISTORIAL DE SESIONES ANTERIORES (de más reciente a más antigua):
${historial.map((s, i) => {
  return `Sesión ${historial.length - i}: ${s.titulo || 'Sin título'} (${s.fecha})
  Área crítica: ${s.area}
  Errores: ${s.items.join(', ')}
  ${s.progreso ? `Evaluación anterior: ${s.progreso}` : ''}`;
}).join('\n')}`;
  }

  const scoresActuales = scores.map(s => `${s.name}: ${s.count}/${s.total} errores`).join(', ');
  const listaItems = items.map(it => `[${it.bloque}] ${it.texto}`);

  return `Sos un coach profesional de oratoria con formación en fonoaudiología y técnica vocal. Evaluás el progreso de un alumno que practica lectura en voz alta.

CONTEXTO DE LA EVALUACIÓN:
- El alumno se graba leyendo fragmentos de texto de 2 minutos
- Se escucha y marca los errores que detecta
- Los 5 bloques de evaluación son: Claridad (dicción, pronunciación), Ritmo (velocidad, pausas rítmicas), Intención (expresividad, tono), Pausas (respiración, fraseo), Seguridad (firmeza, volumen)
- Cada bloque tiene ~5 ítems negativos posibles

LECTURA ACTUAL: "${titulo || 'Sin título'}"
ERRORES MARCADOS: ${scoresActuales}
DETALLE: ${listaItems.join(', ')}

DIAGNÓSTICO QUE RECIBIÓ:
${diagnostico}
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
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en el servidor' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const items = limpiarItems(body.items);
  if (items.length === 0) return res.status(400).json({ error: 'No hay ítems marcados' });

  let prompt, maxTokens;
  if (body.tipo === 'diagnostico') {
    const d = body.diag || {};
    prompt = promptDiagnostico(items, {
      problema: txt(d.problema), ejemplo: txt(d.ejemplo), correccion: txt(d.correccion),
    });
    maxTokens = 600;
  } else if (body.tipo === 'progreso') {
    prompt = promptProgreso({
      items,
      scores: limpiarScores(body.scores),
      titulo: txt(body.titulo, 150),
      diagnostico: txt(body.diagnostico, 3000),
      historial: limpiarHistorial(body.historial),
    });
    maxTokens = 800;
  } else {
    return res.status(400).json({ error: 'Tipo de pedido inválido' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || `Error ${r.status}` });
    }
    return res.status(200).json({ texto: data.content?.[0]?.text || '' });
  } catch (e) {
    return res.status(502).json({ error: 'No se pudo contactar a la IA' });
  }
}
