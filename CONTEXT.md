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
- **Escala de nota unificada.** `Resultado` coloreaba por clases CSS (cortes 3/5/7) y `Historial` por hex inline (cortes 8/6/4): una misma nota de 4 salía naranja en un lado y bermellón en el otro. Ahora ambos usan `claseNota()`, derivada de los anclajes de `marco.js`, así el color y el nivel escrito nunca se contradicen.
- **El historial ya no se puede perder.** Si el JSON de `localStorage` estaba corrupto, la carga devolvía `[]` y el efecto de persistencia lo escribía encima: historial borrado sin aviso. Ahora el corrupto se copia a `oratoria-historial-corrupto` y el efecto no escribe en el primer render.
- **`idx` validado por bloque en la API.** El tope era global (5), así que el servidor aceptaba `idx: 4` en Pausas, que tiene 4 indicadores, y lo puntuaba con gravedad 0. Ahora cada bloque valida contra su propia cantidad.
- **Datos que nadie leía.** `scores` se guardaba en cada sesión y se migraba para las viejas sin que ningún componente lo renderizara: eliminado. `global` y `ppm` sí se guardaban y tampoco se leían, pero valían la pena: ahora se muestran en cada sesión del historial.
- **Payload muerto en la API.** Devolvía `rubrica` con un comentario diciendo que la UI la usaba si fallaba el modelo. No la usaba: la recalcula el navegador. Fuera la respuesta y el comentario.
- **Más código muerto.** Variables CSS `--paper` y `--white`, definidas y nunca usadas. Export `criterioDe` del motor, sin consumidores.
- **Subtítulo de bloque unificado.** La copy vivía en un mapa `DESCRIPCIONES` dentro de `Bloque.jsx`, indexado por nombre visible: si alguien renombraba un bloque, el subtítulo desaparecía sin aviso. Pasó a ser el campo `subtitle` de `bloques.js`, junto al resto de los datos del bloque. El texto es idéntico al anterior.

## Revisado en este paso

Auditoría cruzada hecha por un agente aparte que no vio el código mientras se escribía. Encontró siete incoherencias; las seis que importaban están arregladas arriba. La séptima (`result-src`, `history-list`, `measure-panel` y `sources-panel` son clases sin regla propia en el CSS) se deja: son ganchos semánticos que sirven para apuntar estilos más adelante.


- Build de producción limpio.
- Sin desborde horizontal en 1440 ni en 390 px.
- Ningún objetivo táctil por debajo de 44 px.
- `prefers-reduced-motion`: el hook saltea el observer y marca `listo` de entrada; además hay una regla explícita que anula transform y filter.
- Degradación sin IA: si la API falla, se muestran igual las notas, el área crítica y la corrección del marco.

## Verificación entre motores — 25/11/2026

Pasada en los tres motores de render, cada uno en 1440x1000 y 390x844. Resultados coincidentes, sin una sola falla.

| | Blink (Chrome 1243) | WebKit 26.6 (Safari) | Gecko 155 (Firefox) |
|---|---|---|---|
| Revelado por scroll: ningún bloque queda invisible | ✓ | ✓ | ✓ |
| Selectores con tilde (`.is-óptimo`, `.is-muy-rápido`) | ✓ | ✓ | ✓ |
| `prefers-reduced-motion` | ✓ | ✓ | ✓ |
| Sin desborde horizontal | ✓ | ✓ | ✓ |
| Objetivos táctiles ≥ 44 px | ✓ | ✓ | ✓ |
| Errores de consola | 0 | 0 | 0 |

Los dos puntos que más riesgo tenían pasaron en los tres:

- **El revelado.** `data-revelar` arranca en `pendiente` con `opacity: 0`. Si `IntersectionObserver` o el keyframe fallaban en algún motor, el bloque quedaba invisible para siempre. Scrolleando hasta el fondo, 0 de 7 elementos quedan en `pendiente` y ninguno con opacity 0.
- **Las clases con tilde.** `Medicion.jsx` genera el selector con `is-${estado.replace(/\s/g,'-')}`, lo que produce clases no-ASCII. Los tres motores las matchean y aplican el color correcto: 193 ppm en ámbar (algo rápido), 180 en verde (óptimo), 240 en bermellón (muy rápido).

Diferencia menor y sin efecto: Firefox normaliza el `08` del campo de segundos a `8` y deja `transform: matrix(1,0,0,1,0,0)` donde los otros dejan `none`. El cálculo y el render son idénticos.

## Pendiente

- **Falta probar en dispositivo real.** Los tres motores de render están verificados (ver abajo), pero no se probó en hardware: táctil real, teclado del sistema, barra de direcciones que cambia el alto del viewport, Safari iOS con la barra inferior.
- **El diagnóstico redactado no se pudo probar end to end** en este entorno: no hay `ANTHROPIC_API_KEY`. La rúbrica, la medición y la UI sí.
- El historial vive en `localStorage` bajo `oratoria-historial`. Las sesiones viejas no tienen `global` ni `ppm`: la etiqueta simplemente no se dibuja.

## Cómo sigue el preset

El objetivo es que `src/motor/` salga de acá tal cual para el proyecto de curso grande. Cuando se haga:

1. Copiar la carpeta.
2. Reescribir `marco.js` con `FUENTES` y `CRITERIOS` del dominio nuevo.
3. Ajustar las secciones de salida en `prompt.js`.
4. `rubrica.js` no se toca.
