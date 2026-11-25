// src/motor/rubrica.js
// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DETERMINISTA. La nota, el área crítica y el orden de prioridad se
// resuelven acá, en código. El modelo no puntúa: recibe este resultado ya
// hecho y sólo lo interpreta y redacta. Mismos datos de entrada => misma
// evaluación, siempre, y auditable sin llamar a la IA.
// ─────────────────────────────────────────────────────────────────────────────

import { CRITERIOS, anclaDe, evaluarPpm } from './marco.js';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// 0 errores => 10. Todos los indicadores marcados => 1.
// Se pondera por gravedad, no por cantidad: dos fallos leves no equivalen a
// uno que compromete la comprensión.
function notaPorGravedad(criterio, indicesMarcados) {
  const total = criterio.indicadores.reduce((s, i) => s + i.g, 0);
  if (!total) return { nota: 10, ratio: 0, pesoMarcado: 0, pesoTotal: 0 };
  const pesoMarcado = indicesMarcados.reduce((s, idx) => s + (criterio.indicadores[idx]?.g || 0), 0);
  const ratio = pesoMarcado / total;
  return { nota: clamp(Math.round(10 - ratio * 9), 1, 10), ratio, pesoMarcado, pesoTotal: total };
}

/**
 * @param {Array<{bloque:string, idx:number, texto:string}>} marcados
 * @param {{ppm?:number}} [medicion]  Velocidad real medida, si el alumno la cargó.
 */
export function evaluar(marcados = [], medicion = {}) {
  const porBloque = new Map();
  for (const m of marcados) {
    if (!m || typeof m.bloque !== 'string') continue;
    if (!porBloque.has(m.bloque)) porBloque.set(m.bloque, []);
    porBloque.get(m.bloque).push(m);
  }

  const ppm = evaluarPpm(medicion.ppm);

  const criterios = CRITERIOS.map(criterio => {
    const propios = porBloque.get(criterio.bloque) || [];
    const indices = propios.map(m => m.idx).filter(i => Number.isInteger(i) && i >= 0);
    const base = notaPorGravedad(criterio, indices);

    // Único criterio con evidencia objetiva disponible: si hay ppm medidas,
    // pesan la mitad de la nota de Ritmo. Queda declarado en `evidencia`.
    let nota = base.nota;
    let evidencia = 'autoevaluación';
    if (criterio.medible === 'ppm' && ppm) {
      nota = clamp(Math.round((base.nota + ppm.nota) / 2), 1, 10);
      evidencia = `autoevaluación + medición (${ppm.ppm} ppm, ${ppm.estado})`;
    }

    const ancla = anclaDe(nota);
    return {
      id: criterio.id,
      bloque: criterio.bloque,
      competencia: criterio.competencia,
      nota,
      nivel: ancla.nivel,
      descriptor: ancla.descriptor,
      evidencia,
      fuentes: criterio.fuentes,
      respaldo: criterio.respaldo,
      correccion: criterio.correccion,
      marcados: propios.map(m => ({
        texto: m.texto,
        gravedad: criterio.indicadores[m.idx]?.g ?? null,
        porQue: criterio.indicadores[m.idx]?.nota ?? null,
      })),
      // ordena los fallos del alumno de más grave a menos
      prioridad: propios
        .map(m => ({ texto: m.texto, g: criterio.indicadores[m.idx]?.g || 0 }))
        .sort((a, b) => b.g - a.g),
      _peso: base.pesoMarcado,
    };
  });

  // Área crítica: nota más baja. Empate => mayor peso absoluto de gravedad.
  const ranking = [...criterios].sort((a, b) => a.nota - b.nota || b._peso - a._peso);
  const conFallos = ranking.filter(c => c.marcados.length > 0);
  const areaCritica = conFallos[0] || ranking[0];
  const secundaria = conFallos[1] || null;

  const global = Math.round((criterios.reduce((s, c) => s + c.nota, 0) / criterios.length) * 10) / 10;

  return {
    criterios,
    areaCritica,
    secundaria,
    global,
    nivelGlobal: anclaDe(Math.round(global)).nivel,
    ppm,
    totalMarcados: marcados.length,
  };
}

/** Compara dos evaluaciones por criterio. Determinista, sin IA. */
export function comparar(actual, anterior) {
  if (!anterior?.criterios) return null;
  const previo = new Map(anterior.criterios.map(c => [c.id, c.nota]));
  return actual.criterios.map(c => {
    const antes = previo.get(c.id);
    if (!Number.isFinite(antes)) return { id: c.id, bloque: c.bloque, tendencia: 'estable', delta: 0 };
    const delta = c.nota - antes;
    return {
      id: c.id,
      bloque: c.bloque,
      delta,
      tendencia: delta > 0 ? 'mejorando' : delta < 0 ? 'empeorando' : 'estable',
    };
  });
}
