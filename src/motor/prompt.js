// src/motor/prompt.js
// ─────────────────────────────────────────────────────────────────────────────
// Armado del prompt. El modelo recibe SÓLO los criterios que la rúbrica marcó
// como relevantes (área crítica + secundaria), con su respaldo bibliográfico.
// No se le manda el marco completo: eso mantiene el prompt acotado y evita que
// razone sobre criterios que no vienen al caso.
// ─────────────────────────────────────────────────────────────────────────────

import { FUENTES } from './marco.js';

const ROL = 'Sos un coach de oratoria. Evaluás lectura en voz alta con una rúbrica ya aplicada: las notas y el área crítica vienen calculadas, no las recalcules ni las discutas.';

const ESTILO = 'Escribí en español rioplatense (vos), directo y sin relleno. Sin saludos, sin introducción, sin cerrar con una frase motivacional.';

function bloqueCriterio(c) {
  const fuentes = c.fuentes.map(k => FUENTES[k]?.corto).filter(Boolean).join('; ');
  const fallos = c.prioridad.map(p => `  · ${p.texto} (gravedad ${p.g}/3)`).join('\n');
  return `[${c.id}] ${c.bloque} — ${c.competencia}
Nota: ${c.nota}/10 (${c.nivel}). Evidencia: ${c.evidencia}.
Descriptor del nivel: ${c.descriptor}
Respaldo: ${c.respaldo}
Fuentes: ${fuentes}
Corrección que indica el marco: ${c.correccion}
Lo que marcó el alumno, de más grave a menos:
${fallos || '  · (nada marcado)'}`;
}

/** Diagnóstico de una sesión. Devuelve texto con marcadores ## para la UI. */
export function promptDiagnostico({ rubrica, notaAlumno = {}, titulo = '' }) {
  const relevantes = [rubrica.areaCritica, rubrica.secundaria].filter(Boolean);

  const medicion = rubrica.ppm
    ? `\nVELOCIDAD MEDIDA: ${rubrica.ppm.ppm} ppm — ${rubrica.ppm.estado}. Franja óptima ${rubrica.ppm.optimo[0]}–${rubrica.ppm.optimo[1]} ppm; media medida de lectura en voz alta ${rubrica.ppm.ancla} ppm. ${rubrica.ppm.lectura}`
    : '\nVELOCIDAD MEDIDA: no la cargó.';

  const extra = [
    notaAlumno.problema && `Qué notó: ${notaAlumno.problema}`,
    notaAlumno.ejemplo && `Ejemplo del audio: ${notaAlumno.ejemplo}`,
    notaAlumno.correccion && `Qué intentó corregir: ${notaAlumno.correccion}`,
  ].filter(Boolean).join('\n');

  return `${ROL}

LECTURA: "${titulo || 'sin título'}"
NOTA GLOBAL: ${rubrica.global}/10 (${rubrica.nivelGlobal})
ÁREA CRÍTICA YA DETERMINADA: ${rubrica.areaCritica.bloque} [${rubrica.areaCritica.id}]${medicion}

CRITERIOS RELEVANTES:
${relevantes.map(bloqueCriterio).join('\n\n')}
${extra ? `\nOBSERVACIÓN DEL ALUMNO:\n${extra}` : ''}

${ESTILO}

Respondé exactamente con estas cuatro secciones, sin agregar ninguna otra:

## AREA
${rubrica.areaCritica.bloque} — una línea que nombre el fallo concreto, no la categoría.

## QUE PASA
2 o 3 oraciones: qué falla técnicamente y qué efecto tiene sobre quien escucha. Apoyate en el respaldo y la gravedad de arriba. Si hay velocidad medida y el área crítica es Ritmo, usá el número.

## PARA LA PROXIMA
Una sola acción concreta y verificable para la próxima grabación, derivada de la corrección que indica el marco. Que se pueda hacer en menos de 5 minutos antes de grabar.

## CRITERIO
Una línea: de qué criterio y qué fuentes sale este diagnóstico. Citá los nombres cortos de las fuentes listadas arriba y nada más. No inventes autores, años ni títulos que no estén en el prompt.`;
}

/** Evaluación de progreso. Devuelve JSON. */
export function promptProgreso({ rubrica, comparacion, historial = [], titulo = '' }) {
  const notas = rubrica.criterios.map(c => `${c.bloque} ${c.nota}/10 (${c.nivel})`).join(', ');

  const tendencias = comparacion
    ? comparacion.map(t => `${t.bloque}: ${t.tendencia}${t.delta ? ` (${t.delta > 0 ? '+' : ''}${t.delta})` : ''}`).join(', ')
    : 'primera sesión, sin comparación posible';

  const contexto = historial.length
    ? `\nSESIONES ANTERIORES (reciente primero):\n${historial.map((s, i) => `${historial.length - i}. "${s.titulo || 'sin título'}" (${s.fecha}) — área: ${s.area}`).join('\n')}`
    : '';

  const detalle = rubrica.criterios
    .filter(c => c.marcados.length)
    .map(c => `[${c.id}] ${c.bloque}: ${c.prioridad.map(p => p.texto).join('; ')}`)
    .join('\n');

  return `${ROL}

LECTURA: "${titulo || 'sin título'}"
NOTAS CALCULADAS POR LA RÚBRICA: ${notas}
TENDENCIA CALCULADA: ${tendencias}
${rubrica.ppm ? `VELOCIDAD: ${rubrica.ppm.ppm} ppm (${rubrica.ppm.estado})` : ''}
FALLOS MARCADOS:
${detalle || '(ninguno)'}${contexto}

Las notas y las tendencias ya están calculadas: copialas tal cual, no las recalcules.
Tu tarea es sólo redactar el detalle cualitativo de cada bloque.

Un texto más difícil con la misma cantidad de errores es mejor desempeño, y menos errores en un texto más fácil no es mejora: tenelo en cuenta al redactar los detalles.

${ESTILO}

Respondé SÓLO un JSON válido, sin markdown ni backticks:

{
  "area": "${rubrica.areaCritica.bloque}",
  "resumen": "qué falla y una acción concreta, máximo 2 oraciones",
  "progreso": {
${rubrica.criterios.map(c => `    "${c.bloque}": {"nota": ${c.nota}, "tendencia": "${comparacion?.find(t => t.id === c.id)?.tendencia || 'estable'}", "detalle": "1 oración sobre qué observás en este bloque"}`).join(',\n')}
  }
}`;
}
