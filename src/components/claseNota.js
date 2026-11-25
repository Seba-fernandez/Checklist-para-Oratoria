import { anclaDe } from '../motor/index.js';

// Una sola escala de color para las notas, derivada de los anclajes del marco
// (marco.js › ANCLAS). Resultado e Historial la comparten: antes cada uno tenía
// sus propios cortes y una misma nota salía de distinto color en cada lado.
const CLASES = {
  inefectivo: 'baja',
  inicial: 'media',
  'en progreso': 'buena',
  competente: 'alta',
  avanzado: 'alta',
};

export function claseNota(nota) {
  const n = Number(nota);
  if (!Number.isFinite(n)) return 'media';
  return CLASES[anclaDe(Math.round(n)).nivel] || 'media';
}
