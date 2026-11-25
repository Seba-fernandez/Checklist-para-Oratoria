import { FUENTES, CRITERIOS } from '../motor/index.js';
import useRevelado from '../hooks/useRevelado';

const ORDEN = ['pscr', 'nca', 'mcer', 'rae', 'rodero2016', 'brysbaert2019'];

export default function Fuentes() {
  const ref = useRevelado();

  return (
    <section className="panel sources-panel" aria-labelledby="fuentes-title" ref={ref}>
      <div className="panel-head">
        <span className="panel-mark" aria-hidden="true">§</span>
        <div>
          <h2 className="panel-title" id="fuentes-title">De dónde sale el criterio</h2>
          <p className="panel-caption">
            Ningún umbral ni descriptor sin fuente declarada
          </p>
        </div>
      </div>

      <div className="sources-body">
        <p className="sources-intro">
          La nota de cada dimensión se calcula en código con una rúbrica fija, no la
          decide el modelo: la IA recibe el resultado ya hecho y solo lo redacta. Estas
          son las seis fuentes que fijan los criterios.
        </p>

        <ol className="sources-list">
          {ORDEN.map(clave => {
            const fuente = FUENTES[clave];
            if (!fuente) return null;
            const usan = CRITERIOS.filter(c => c.fuentes.includes(clave)).map(c => c.bloque);
            return (
              <li className="source-item" key={clave}>
                <p className="source-cite">{fuente.cita}</p>
                <p className="source-kind">{fuente.tipo}</p>
                <p className="source-gives">{fuente.aporta}</p>
                <p className="source-used">Aplica a: {usan.join(', ')}</p>
                {fuente.url && (
                  <a className="source-link" href={fuente.url} target="_blank" rel="noreferrer noopener">
                    Ver fuente <span aria-hidden="true">↗</span>
                  </a>
                )}
              </li>
            );
          })}
        </ol>

        <details className="sources-method">
          <summary>Cómo se calcula la nota</summary>
          <p>
            Cada indicador de la checklist declara una gravedad de 1 a 3: 3 compromete la
            comprensión del mensaje, 2 lo percibe con claridad quien escucha, 1 es un
            refinamiento. La nota de la dimensión es{' '}
            <code>10 − (gravedad marcada / gravedad total) × 9</code>, redondeada y acotada
            entre 1 y 10. Pondera por gravedad y no por cantidad, así dos fallos leves no
            pesan lo mismo que uno que rompe la inteligibilidad.
          </p>
          <p>
            En Ritmo, si cargás las palabras por minuto reales, la medición pesa la mitad de
            la nota y queda indicado como evidencia medida, no autoevaluada.
          </p>
        </details>
      </div>
    </section>
  );
}
