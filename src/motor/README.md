# Motor de criterios

Capa de evaluación independiente de la app. JS plano, sin dependencias y sin React: se copia esta carpeta a otro proyecto y se cambia solo `marco.js`.

## Por qué existe

Un modelo de lenguaje al que le pedís "evaluá esta oratoria" devuelve algo plausible, no algo verificable: la nota cambia entre corridas y el criterio no se puede auditar. Acá el criterio vive en código y la bibliografía está citada por criterio.

**El modelo no puntúa.** La rúbrica calcula nota, área crítica y prioridad de forma determinista; el modelo recibe ese resultado ya hecho y solo lo interpreta y lo redacta. Mismos datos de entrada, misma evaluación, siempre.

## Los cuatro archivos

| Archivo | Rol | Se toca al portarlo |
|---|---|---|
| `marco.js` | Criterios, indicadores con gravedad, anclajes de nota, umbrales medibles y las fuentes citadas | **Sí, es lo único que se reescribe** |
| `rubrica.js` | Cálculo determinista: nota por gravedad, área crítica, comparación entre sesiones | No |
| `prompt.js` | Arma el prompt con solo los criterios relevantes | Ajuste de formato de salida |
| `index.js` | Barrel de exports | No |

## Cómo se usa

```js
import { evaluar, comparar, promptDiagnostico } from './motor/index.js';

const marcados = [{ bloque: 'Ritmo', idx: 0, texto: 'Hablo demasiado rápido' }];
const rubrica = evaluar(marcados, { ppm: 215 });
// rubrica.areaCritica.bloque === 'Ritmo', nota 5/10, evidencia: autoevaluación + medición

const prompt = promptDiagnostico({ rubrica, titulo: 'Fragmento 3' });
```

`evaluar()` corre en el navegador sin costo: las notas y el área crítica se muestran al instante y sin llamar a la IA. La llamada al modelo queda solo para la redacción.

## Cómo se calcula la nota

Cada indicador declara `gravedad` de 1 a 3:

- **3** compromete la comprensión del mensaje
- **2** el oyente lo percibe con claridad
- **1** refinamiento

```
nota = redondear(10 − (gravedad marcada / gravedad total del criterio) × 9)
```

Sin fallos da 10; todos los indicadores marcados da 1. Pondera por gravedad y no por cantidad: dos fallos leves no equivalen a uno que rompe la inteligibilidad.

En `Ritmo`, si hay palabras por minuto medidas, la medición pesa la mitad de la nota. Queda declarado en el campo `evidencia` de ese criterio, así nunca se confunde una nota autoevaluada con una medida.

## Umbrales medibles

Velocidad de lectura en voz alta, el único criterio con umbral duro:

| Rango | Estado | Nota |
|---|---|---|
| < 130 ppm | muy lento | 4 |
| 130–169 | lento | 7 |
| 170–190 | **óptimo** | 10 |
| 191–200 | algo rápido | 7 |
| > 200 | muy rápido | 4 |

130–200 es el rango normal del español según la RAE. 170–190 es la franja de máximo reconocimiento del mensaje medida por Rodero (2016). 183 ppm es la media de lectura en voz alta del meta-análisis de Brysbaert (2019).

## Fuentes

Las citas completas, con DOI, viven en `FUENTES` dentro de `marco.js`. Cada criterio declara de qué fuentes sale en su campo `fuentes`, y `prompt.js` solo le pasa al modelo los nombres cortos de esas fuentes con la instrucción de no inventar ninguna otra.

- Schreiber, Paul & Shibley (2012), *Public Speaking Competence Rubric* — rúbrica validada por análisis factorial
- Morreale, Moore, Surges-Tatum & Webster (2007), *The Competent Speaker Speech Evaluation Form*, 2.ª ed., National Communication Association — 8 competencias
- Consejo de Europa (2020), *MCER, Volumen complementario* — escala de control fonológico
- Real Academia Española (2018), *Libro de estilo de la lengua española* — velocidad de habla
- Rodero (2016), *Media Psychology* 19(2) — velocidad óptima de reconocimiento
- Brysbaert (2019), *Journal of Memory and Language* 109 — meta-análisis de velocidad de lectura

## Portarlo a otro dominio

1. Copiar `src/motor/` al proyecto nuevo.
2. Reescribir `marco.js`: `FUENTES` con la bibliografía del dominio, `CRITERIOS` con sus indicadores y gravedades, y los umbrales medibles que correspondan.
3. Ajustar las secciones de salida en `prompt.js`.
4. `rubrica.js` no se toca: el cálculo es agnóstico al dominio.

El contrato que mantiene todo en pie: **ningún umbral ni descriptor sin fuente declarada.** Si un criterio no tiene respaldo, no entra al marco.
