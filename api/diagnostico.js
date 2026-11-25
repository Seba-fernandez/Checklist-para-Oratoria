// api/diagnostico.js
// Función serverless (Vercel). La API key vive SOLO acá, en process.env.ANTHROPIC_API_KEY.
//
// El criterio de evaluación NO está en este archivo ni en el prompt: vive en
// src/motor/. El navegador manda los ítems marcados en crudo; la rúbrica se
// recalcula acá en el servidor, así el cliente no puede falsear una nota, y el
// modelo recibe el resultado ya calculado solo para redactarlo.

import { evaluar, comparar } from '../src/motor/rubrica.js';
import { promptDiagnostico, promptProgreso } from '../src/motor/prompt.js';
import { CRITERIOS } from '../src/motor/marco.js';

const MODELO = 'claude-haiku-4-5-20251001';

// ── Sanitizado: limita tamaños para que no se pueda abusar del endpoint ──
const txt = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
// Cuantos indicadores tiene cada bloque. Un maximo global dejaria pasar idx=4
// en Pausas, que solo tiene 4 indicadores, y se puntuaria con gravedad 0.
const INDICADORES_POR_BLOQUE = new Map(CRITERIOS.map(c => [c.bloque, c.indicadores.length]));

// Solo se aceptan bloques e índices que existan en el marco. Cualquier otra
// cosa se descarta antes de llegar a la rúbrica.
function limpiarMarcados(marcados) {
  if (!Array.isArray(marcados)) return [];
  const vistos = new Set();
  return marcados.slice(0, 40).reduce((acc, m) => {
    const bloque = txt(m?.bloque, 40);
    const idx = Number(m?.idx);
    const tope = INDICADORES_POR_BLOQUE.get(bloque);
    if (tope === undefined) return acc;
    if (!Number.isInteger(idx) || idx < 0 || idx >= tope) return acc;
    const clave = `${bloque}-${idx}`;
    if (vistos.has(clave)) return acc;
    vistos.add(clave);
    acc.push({ bloque, idx, texto: txt(m?.texto, 200) });
    return acc;
  }, []);
}

const limpiarPpm = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 20 && n <= 600 ? n : undefined;
};

function limpiarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  // Últimas 5 sesiones como máximo para no pasarnos de tokens
  return historial.slice(0, 5).map(s => ({
    titulo: txt(s?.titulo, 150),
    fecha: txt(s?.fecha, 40),
    area: txt(s?.area, 80),
  }));
}

// La rúbrica anterior se reconstruye desde las notas guardadas, para poder
// comparar sin volver a pedirle nada al modelo.
function rubricaAnterior(historial) {
  const previa = Array.isArray(historial) ? historial[0] : null;
  const progreso = previa?.progreso;
  if (!progreso || typeof progreso !== 'object') return null;
  const criterios = CRITERIOS.map(c => {
    const nota = Number(progreso?.[c.bloque]?.nota);
    return { id: c.id, bloque: c.bloque, nota: Number.isFinite(nota) ? nota : null };
  }).filter(c => c.nota !== null);
  return criterios.length ? { criterios } : null;
}

async function pedirAClaude(prompt, maxTokens) {
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
    const err = new Error(data.error?.message || `Error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data.content?.[0]?.text || '';
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

  const marcados = limpiarMarcados(body.marcados);
  if (marcados.length === 0) return res.status(400).json({ error: 'No hay ítems marcados' });

  const titulo = txt(body.titulo, 150);
  const rubrica = evaluar(marcados, { ppm: limpiarPpm(body.ppm) });

  let prompt, maxTokens;
  if (body.tipo === 'diagnostico') {
    const d = body.diag || {};
    prompt = promptDiagnostico({
      rubrica,
      titulo,
      notaAlumno: {
        problema: txt(d.problema), ejemplo: txt(d.ejemplo), correccion: txt(d.correccion),
      },
    });
    maxTokens = 600;
  } else if (body.tipo === 'progreso') {
    const historial = limpiarHistorial(body.historial);
    prompt = promptProgreso({
      rubrica,
      comparacion: comparar(rubrica, rubricaAnterior(body.historial)),
      historial,
      titulo,
    });
    maxTokens = 800;
  } else {
    return res.status(400).json({ error: 'Tipo de pedido inválido' });
  }

  try {
    const texto = await pedirAClaude(prompt, maxTokens);
    // Solo el texto: la rúbrica la recalcula el navegador con el mismo motor,
    // así que mandarla de vuelta sería payload muerto.
    return res.status(200).json({ texto });
  } catch (e) {
    const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
    return res.status(status).json({ error: e.status ? e.message : 'No se pudo contactar a la IA' });
  }
}
