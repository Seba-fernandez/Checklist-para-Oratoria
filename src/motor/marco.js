// src/motor/marco.js
// ─────────────────────────────────────────────────────────────────────────────
// MARCO DE CRITERIOS — única fuente de verdad del criterio de evaluación.
// Esto NO depende de React ni de la app: es JS plano para que el motor se
// pueda copiar a otro proyecto cambiando solo este archivo.
//
// Regla del proyecto: ningún umbral ni descriptor se inventa. Cada criterio
// declara de qué fuente sale, y el prompt que recibe el modelo sólo puede
// razonar dentro de estos anclajes.
// ─────────────────────────────────────────────────────────────────────────────

export const FUENTES = {
  pscr: {
    cita: 'Schreiber, L., Paul, G. & Shibley, L. R. (2012). The development and test of the Public Speaking Competence Rubric. Communication Education, 61(3), 205–233.',
    corto: 'PSCR (2012)',
    tipo: 'Rúbrica validada por análisis factorial, 11 ítems',
    url: 'https://doi.org/10.1080/03634523.2012.670709',
    aporta: 'Escala descriptiva de competencia oral con niveles avanzado / principiante / inefectivo.',
  },
  nca: {
    cita: 'Morreale, S., Moore, M., Surges-Tatum, D. & Webster, L. (Eds.). (2007). The Competent Speaker Speech Evaluation Form (2.ª ed.). National Communication Association.',
    corto: 'NCA Competent Speaker (2007)',
    tipo: 'Instrumento estándar de 8 competencias',
    url: 'https://natcom.org/',
    aporta: 'Competencias 6 (variedad vocal), 7 (pronunciación, gramática y articulación) y 8 (conducta física que sostiene el mensaje).',
  },
  rae: {
    cita: 'Real Academia Española (2018). Libro de estilo de la lengua española, § «La velocidad de habla». Espasa.',
    corto: 'RAE, Libro de estilo',
    tipo: 'Obra normativa de referencia',
    url: 'https://www.rae.es/libro-estilo-lengua-espa%C3%B1ola/la-velocidad-de-habla',
    aporta: 'Para el español se considera normal una velocidad de 130 a 200 palabras por minuto.',
  },
  rodero2016: {
    cita: 'Rodero, E. (2016). Influence of speech rate and information density on recognition: the moderate dynamic mechanism. Media Psychology, 19(2), 224–242.',
    corto: 'Rodero (2016)',
    tipo: 'Estudio experimental, Universitat Pompeu Fabra',
    url: 'https://doi.org/10.1080/15213269.2014.1002942',
    aporta: 'El reconocimiento del mensaje es máximo entre 170 y 190 ppm. 150 ppm se percibe lento; 210 ppm, rápido.',
  },
  brysbaert2019: {
    cita: 'Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. Journal of Memory and Language, 109, 104047.',
    corto: 'Brysbaert (2019)',
    tipo: 'Meta-análisis, 77 estudios, 5.965 participantes',
    url: 'https://doi.org/10.1016/j.jml.2019.104047',
    aporta: 'La lectura en voz alta promedia 183 ppm, ancla medida para una entrega con guion.',
  },
  mcer: {
    cita: 'Consejo de Europa (2020). Marco común europeo de referencia para las lenguas: aprendizaje, enseñanza, evaluación. Volumen complementario. Servicio de publicaciones del Consejo de Europa.',
    corto: 'MCER Volumen complementario (2020)',
    tipo: 'Escala analítica oficial',
    url: 'https://cvc.cervantes.es/ensenanza/biblioteca_ele/marco_complementario/mcer_volumen-complementario.pdf',
    aporta: 'Escala de control fonológico en tres dimensiones: inteligibilidad, articulación de sonidos y rasgos prosódicos.',
  },
};

// ── Anclajes de nota, comunes a todos los criterios ──
// Redactados a partir de la gradación del PSCR (avanzado / principiante /
// inefectivo) y de la escala de inteligibilidad del MCER.
export const ANCLAS = [
  { min: 1, max: 3, nivel: 'inefectivo',  descriptor: 'El problema compromete la comprensión del mensaje: el oyente pierde contenido.' },
  { min: 4, max: 5, nivel: 'inicial',     descriptor: 'El problema es evidente y sostenido. El oyente lo percibe aunque entienda el mensaje.' },
  { min: 6, max: 7, nivel: 'en progreso', descriptor: 'Aceptable con margen de mejora: los fallos son esporádicos y no interrumpen la escucha.' },
  { min: 8, max: 9, nivel: 'competente',  descriptor: 'Buen nivel: fallos mínimos o puramente técnicos, sin efecto sobre el oyente.' },
  { min: 10, max: 10, nivel: 'avanzado',  descriptor: 'Sin fallos observables en esta dimensión para el tipo de texto leído.' },
];

export function anclaDe(nota) {
  return ANCLAS.find(a => nota >= a.min && nota <= a.max) || ANCLAS[0];
}

// ── Velocidad de lectura en voz alta: único criterio con umbral medible ──
// Rangos de RAE (normal 130–200), Rodero 2016 (óptimo 170–190) y
// Brysbaert 2019 (media medida de lectura en voz alta: 183 ppm).
export const PPM = {
  optimo: [170, 190],
  normal: [130, 200],
  ancla: 183,
  fuentes: ['rae', 'rodero2016', 'brysbaert2019'],
  tramos: [
    { hasta: 129, estado: 'muy lento',       nota: 4, lectura: 'Por debajo del rango normal del español. A esta velocidad la lectura se vuelve pesada y el oyente se adelanta al texto.' },
    { hasta: 169, estado: 'lento',           nota: 7, lectura: 'Dentro del rango normal pero por debajo del óptimo de procesamiento. Margen para soltar el ritmo sin perder dicción.' },
    { hasta: 190, estado: 'óptimo',          nota: 10, lectura: 'En la franja de máximo reconocimiento del mensaje. Es el ritmo a sostener.' },
    { hasta: 200, estado: 'algo rápido',     nota: 7, lectura: 'Todavía dentro del rango normal, pero por encima del óptimo: con texto denso el oyente empieza a perder contenido.' },
    { hasta: Infinity, estado: 'muy rápido', nota: 4, lectura: 'Por encima del rango normal. A esta velocidad se percibe apurado y cae el reconocimiento de lo dicho.' },
  ],
};

export function evaluarPpm(ppm) {
  if (!Number.isFinite(ppm) || ppm <= 0) return null;
  const tramo = PPM.tramos.find(t => ppm <= t.hasta);
  return { ppm: Math.round(ppm), ...tramo, optimo: PPM.optimo, ancla: PPM.ancla };
}

// ── Criterios ──
// `gravedad` por indicador: 3 compromete la comprensión, 2 es percibido con
// claridad por el oyente, 1 es un refinamiento. El orden de `indicadores`
// corresponde al orden de `items` en src/data/bloques.js.
export const CRITERIOS = [
  {
    id: 'CLA',
    bloque: 'Claridad',
    competencia: 'Control fonológico e inteligibilidad',
    define: 'Que cada palabra llegue reconocible sin que el oyente tenga que reconstruirla.',
    fuentes: ['mcer', 'nca', 'pscr'],
    respaldo: 'El MCER ordena el control fonológico desde la inteligibilidad hacia la articulación fina: primero que se entienda, después cómo suena. La competencia 7 de la NCA evalúa pronunciación y articulación adecuadas a la audiencia.',
    correccion: 'Leer por debajo de la velocidad que parece natural y exagerar la articulación, porque el margen de inteligibilidad se gana bajando ritmo, no subiendo volumen.',
    indicadores: [
      { g: 3, nota: 'Compromete la inteligibilidad, la dimensión que el MCER pone primero.' },
      { g: 2, nota: 'Pérdida de información en posición final, donde el español carga marcas de número y persona.' },
      { g: 2, nota: 'Articulación segmental: el rasgo que más pesa como indicador de nivel.' },
      { g: 2, nota: 'Coarticulación excesiva: las fronteras de palabra se borran.' },
      { g: 1, nota: 'Inconsistencia, no error sistemático: refinamiento.' },
    ],
  },
  {
    id: 'RIT',
    bloque: 'Ritmo',
    competencia: 'Velocidad de elocución y variación',
    define: 'Sostener una velocidad que el oyente pueda procesar, y moverla a propósito.',
    fuentes: ['rae', 'rodero2016', 'brysbaert2019', 'nca'],
    respaldo: 'La RAE sitúa el habla normal del español entre 130 y 200 ppm. Rodero (2016) midió que el reconocimiento del mensaje es máximo entre 170 y 190 ppm, y el meta-análisis de Brysbaert (2019) ancla la lectura en voz alta en 183 ppm.',
    correccion: 'Medir las palabras por minuto reales antes de corregir a ciegas, y mover el ritmo contra ese número en lugar de contra una sensación.',
    medible: 'ppm',
    indicadores: [
      { g: 3, nota: 'Por encima del óptimo medido, el oyente pierde contenido (Rodero 2016).' },
      { g: 2, nota: 'Por debajo del rango normal del español, la atención se dispersa.' },
      { g: 1, nota: 'Micro pausa: afecta el fraseo, no la comprensión.' },
      { g: 2, nota: 'La pausa de punto es la que segmenta unidades de sentido.' },
      { g: 2, nota: 'Sin variación no hay jerarquía: todo pesa igual y nada destaca.' },
    ],
  },
  {
    id: 'INT',
    bloque: 'Intención',
    competencia: 'Variedad vocal y expresividad',
    define: 'Que la voz indique qué importa y con qué actitud se dice.',
    fuentes: ['nca', 'pscr', 'mcer'],
    respaldo: 'La competencia 6 de la NCA evalúa el uso de variedad vocal para mantener el interés. El PSCR puntúa aparte la expresividad vocal, y el MCER agrupa los rasgos prosódicos como dimensión propia del control fonológico.',
    correccion: 'Decidir antes de leer qué palabras llevan el peso de cada párrafo, porque la expresividad se planifica sobre el texto, no se improvisa en el micrófono.',
    indicadores: [
      { g: 3, nota: 'Lectura sin intención comunicativa: el canal queda vacío de mensaje.' },
      { g: 2, nota: 'Falta de ajuste del tono al contenido.' },
      { g: 3, nota: 'La monotonía es el fallo prosódico que la NCA señala como pérdida de interés.' },
      { g: 2, nota: 'Sin énfasis no se construye jerarquía de la información.' },
      { g: 1, nota: 'Capa expresiva más fina: se trabaja después de la jerarquía.' },
    ],
  },
  {
    id: 'PAU',
    bloque: 'Pausas',
    competencia: 'Fraseo y gestión del aire',
    define: 'Cortar donde el sentido corta, y respirar sin que se note.',
    fuentes: ['mcer', 'rodero2016', 'pscr'],
    respaldo: 'El MCER integra las pausas en la dimensión de fluidez junto con el ritmo y las reparaciones. Rodero (2016) muestra que a mayor densidad de información hace falta menos velocidad, y la pausa es el recurso que baja densidad sin bajar ritmo.',
    correccion: 'Marcar en el papel los puntos de respiración antes de grabar, para que la pausa quede donde la sintaxis la pide y no donde se termina el aire.',
    indicadores: [
      { g: 3, nota: 'El corte en lugar equivocado reasigna el sentido de la frase.' },
      { g: 2, nota: 'La pausa se nota como recurso, no como silencio natural.' },
      { g: 2, nota: 'Sin pausa posterior, la idea importante no decanta.' },
      { g: 3, nota: 'Encadenar sin aire fuerza el final de frase y sube la densidad percibida.' },
    ],
  },
  {
    id: 'SEG',
    bloque: 'Seguridad',
    competencia: 'Fluidez, firmeza y volumen sostenido',
    define: 'Terminar las frases con la misma convicción con que se empiezan.',
    fuentes: ['mcer', 'nca', 'pscr'],
    respaldo: 'El MCER define la fluidez por la frecuencia de pausas, titubeos y reparaciones. La competencia 6 de la NCA incluye el volumen adecuado al espacio y la audiencia; el PSCR puntúa la poise y la confianza observable.',
    correccion: 'Cerrar cada frase con el mismo volumen con que se abrió, y repetir en loop solo las frases que se caen hasta que salgan firmes.',
    indicadores: [
      { g: 3, nota: 'El titubeo es el marcador de disfluencia que el MCER usa para fluidez.' },
      { g: 2, nota: 'La reparación interrumpe la línea de sentido.' },
      { g: 2, nota: 'La caída final resta autoridad a lo afirmado.' },
      { g: 2, nota: 'Volumen inestable: competencia 6 de la NCA.' },
      { g: 2, nota: 'Percepción global de inseguridad: poise en el PSCR.' },
    ],
  },
];

export const criterioDe = (bloque) => CRITERIOS.find(c => c.bloque === bloque) || null;
