import Item from './Item';

const DESCRIPCIONES = {
  Claridad: 'Dicción, vocalización y comprensión',
  Ritmo: 'Velocidad, pausas y variaciones',
  Intención: 'Tono, énfasis y emoción',
  Pausas: 'Respiración y espacio entre ideas',
  Seguridad: 'Firmeza, volumen y confianza',
};

export default function Bloque({ bloque, checks, onToggle }) {
  const count = bloque.items.filter((_, i) => checks[`${bloque.id}-${i}`]).length;

  return (
    <section className="block-card" aria-labelledby={`bloque-${bloque.id}`}>
      <div className="block-head">
        <span className="block-index" aria-hidden="true">0{bloque.id}</span>
        <div className="block-heading">
          <h2 className="block-title" id={`bloque-${bloque.id}`}>{bloque.name}</h2>
          <p className="block-subtitle">{DESCRIPCIONES[bloque.name]}</p>
        </div>
        <span className={`block-count${count ? ' is-active' : ''}`} aria-label={`${count} de ${bloque.items.length} marcados`}>
          {count} / {bloque.items.length}
        </span>
      </div>
      <div className="block-items">
        {bloque.items.map((texto, i) => (
          <Item key={texto} texto={texto} checked={!!checks[`${bloque.id}-${i}`]} onToggle={() => onToggle(bloque.id, i)} />
        ))}
      </div>
    </section>
  );
}
