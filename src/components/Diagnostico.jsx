const CAMPOS = [
  { key: 'problema', label: 'Qué te llamó la atención', placeholder: 'Ej.: bajo la voz al terminar las oraciones', type: 'input' },
  { key: 'ejemplo', label: 'Un momento concreto', placeholder: 'Ej.: en el minuto 1:20 corté la frase sin pausa', type: 'input' },
  { key: 'correccion', label: 'Qué querés probar la próxima vez', placeholder: 'Ej.: marcar cada coma antes de empezar a leer', type: 'textarea' },
];

export default function Diagnostico({ valores, onChange }) {
  return (
    <section className="panel" aria-labelledby="diagnostico-title">
      <div className="panel-head">
        <span className="panel-mark" aria-hidden="true">✎</span>
        <div>
          <h2 className="panel-title" id="diagnostico-title">Tus notas de escucha</h2>
          <p className="panel-caption">Opcional · ayudan a dar contexto al análisis con IA</p>
        </div>
      </div>
      <div className="diagnostic-fields">
        {CAMPOS.map(({ key, label, placeholder, type }) => (
          <div className="field-group" key={key}>
            <label className="field-label" htmlFor={`nota-${key}`}>{label}</label>
            {type === 'textarea' ? (
              <textarea id={`nota-${key}`} className="text-field" placeholder={placeholder} value={valores[key]} onChange={event => onChange(key, event.target.value)} />
            ) : (
              <input id={`nota-${key}`} className="text-field" type="text" placeholder={placeholder} value={valores[key]} onChange={event => onChange(key, event.target.value)} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
