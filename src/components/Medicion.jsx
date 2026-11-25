import { evaluarPpm, PPM } from '../motor/index.js';

// Velocidad de lectura: el único criterio del marco con umbral medible.
// Se calcula en el navegador, sin IA.
export default function Medicion({ valores, onChange, ppm }) {
  const lectura = evaluarPpm(ppm);

  return (
    <section className="panel measure-panel" aria-labelledby="medicion-title">
      <div className="panel-head">
        <span className="panel-mark" aria-hidden="true">⏱</span>
        <div>
          <h2 className="panel-title" id="medicion-title">Velocidad real de lectura</h2>
          <p className="panel-caption">
            Opcional · franja óptima {PPM.optimo[0]}–{PPM.optimo[1]} ppm
          </p>
        </div>
      </div>

      <div className="measure-fields">
        <div className="field-group">
          <label className="field-label" htmlFor="medicion-palabras">Palabras del texto</label>
          <input
            id="medicion-palabras" className="text-field" type="number" inputMode="numeric"
            min="1" max="5000" placeholder="Ej.: 340"
            value={valores.palabras}
            onChange={event => onChange('palabras', event.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="medicion-minutos">Minutos</label>
          <input
            id="medicion-minutos" className="text-field" type="number" inputMode="numeric"
            min="0" max="60" placeholder="2"
            value={valores.minutos}
            onChange={event => onChange('minutos', event.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="medicion-segundos">Segundos</label>
          <input
            id="medicion-segundos" className="text-field" type="number" inputMode="numeric"
            min="0" max="59" placeholder="05"
            value={valores.segundos}
            onChange={event => onChange('segundos', event.target.value)}
          />
        </div>
      </div>

      <div className="measure-readout" aria-live="polite">
        {lectura ? (
          <>
            <strong className={`measure-value is-${lectura.estado.replace(/\s/g, '-')}`}>
              {lectura.ppm} ppm
            </strong>
            <span className="measure-state">{lectura.estado}</span>
            <p className="measure-note">{lectura.lectura}</p>
          </>
        ) : (
          <p className="measure-note">
            Contá las palabras del fragmento y cronometrá la grabación. La media medida
            de lectura en voz alta es de {PPM.ancla} ppm.
          </p>
        )}
      </div>
    </section>
  );
}
