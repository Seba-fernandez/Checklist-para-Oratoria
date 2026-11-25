# CONTEXT — Checklist de Oratoria

Estado vivo del proyecto. Se actualiza en cada avance.

## Qué es

App de autoevaluación de lectura en voz alta para un curso de oratoria. Pieza de portafolio y, además, banco de pruebas del motor de criterios que se va a reusar en el proyecto de curso grande.

- Producción: https://checklist-para-oratoria.vercel.app/
- Repo: https://github.com/Seba-fernandez/Checklist-para-Oratoria

## Decisiones vigentes

| Decisión | Por qué |
|---|---|
| El criterio vive en código, no en el prompt | Una nota decidida por el modelo no es reproducible ni auditable. La rúbrica calcula, la IA redacta. |
| Ningún umbral sin fuente declarada | Es el contrato del marco. Si un criterio no tiene respaldo bibliográfico, no entra. |
| `src/motor/` sin dependencias ni React | Para portarlo a otro dominio copiando la carpeta y reescribiendo solo `marco.js`. |
| La rúbrica se recalcula en el servidor | El cliente no puede falsear una nota mandando un payload armado. |
| Las notas se calculan también en el navegador | Aparecen al instante, sin costo de tokens, y sobreviven a una caída de la API. |
| Ponderación por gravedad (1–3), no por cantidad | Dos fallos leves no equivalen a uno que rompe la inteligibilidad. |
| Velocidad: medición pesa la mitad de la nota de Ritmo | Es evidencia objetiva, pero la autoevaluación aporta lo que la cifra no ve. Queda declarado en `evidencia`. |
| Prompt acotado a área crítica + secundaria | ~850 tokens de entrada en lugar de mandar el marco completo. |
| Revelado por scroll con atributo escrito por JS | Sin JS no hay atributo y el contenido se ve igual; nunca queda en `opacity: 0`. |

## Hecho — 25/11/2026

- **Título corregido.** El H1 decía "Checklist de Escucha Activa" y el proyecto se llama "Checklist de Oratoria". Ahora el H1 es el nombre del proyecto y "Escucha activa" bajó al kicker.
- **Header unificado.** Usaba estilos inline con `DM Serif Display` (fuente que nunca se cargó, caía a serif del sistema) mientras el CSS tenía un bloque `.hero` completo sin usar. Se eliminó el inline y se adoptó `.hero`: una sola fuente de verdad para el encabezado.
- **Motor de criterios** en `src/motor/` con las seis fuentes citadas, gravedades por indicador y cálculo determinista.
- **Medición de velocidad real**: componente nuevo, calcula ppm en el navegador contra los umbrales de RAE, Rodero y Brysbaert.
- **Panel de fuentes** visible en la UI, con la bibliografía completa y el método de cálculo desplegable.
- **Revelado de gota líquida** al scrollear: squash en la caída, apertura en el impacto y rebote corto, con `cubic-bezier(.42, 0, .2, 1)`. Escalonado de 70 ms entre bloques.
- **Capturas renovadas** de escritorio (1440) y móvil (390), más una del panel de fuentes, en `public/img/`.
- **Objetivos táctiles**: los enlaces "Ver fuente" y el `summary` del método quedaban bajo 44 px. Corregidos.
- **Limpieza de código muerto.** `bloques.js` tenía `color` apuntando a variables CSS (`--cat1`…`--cat5`) que nunca existieron, e `icon` que ningún componente renderizaba: ambos eliminados. El keyframe `rise-in` quedó sin uso al pasar al revelado por scroll: eliminado.
- **Subtítulo de bloque unificado.** La copy vivía en un mapa `DESCRIPCIONES` dentro de `Bloque.jsx`, indexado por nombre visible: si alguien renombraba un bloque, el subtítulo desaparecía sin aviso. Pasó a ser el campo `subtitle` de `bloques.js`, junto al resto de los datos del bloque. El texto es idéntico al anterior.

## Revisado en este paso

- Build de producción limpio.
- Sin desborde horizontal en 1440 ni en 390 px.
- Ningún objetivo táctil por debajo de 44 px.
- `prefers-reduced-motion`: el hook saltea el observer y marca `listo` de entrada; además hay una regla explícita que anula transform y filter.
- Degradación sin IA: si la API falla, se muestran igual las notas, el área crítica y la corrección del marco.

## Pendiente

- **Sin verificar en navegador real.** Todo se probó con Chrome headless (Playwright). Falta una pasada en Safari iOS y en Chrome Android.
- **El diagnóstico redactado no se pudo probar end to end** en este entorno: no hay `ANTHROPIC_API_KEY`. La rúbrica, la medición y la UI sí.
- `Historial.jsx` todavía no muestra la nota global ni las ppm, que ya se guardan en cada sesión.
- El historial vive en `localStorage` bajo `oratoria-historial`. Las sesiones viejas no tienen `global` ni `ppm`: se leen como `null`, sin romper.

## Cómo sigue el preset

El objetivo es que `src/motor/` salga de acá tal cual para el proyecto de curso grande. Cuando se haga:

1. Copiar la carpeta.
2. Reescribir `marco.js` con `FUENTES` y `CRITERIOS` del dominio nuevo.
3. Ajustar las secciones de salida en `prompt.js`.
4. `rubrica.js` no se toca.
