import useRevelado from '../hooks/useRevelado';

export default function Header() {
  const ref = useRevelado();

  return (
    <header className="hero" ref={ref}>
      <p className="hero-kicker">Curso de oratoria · Escucha activa</p>
      <h1>
        Checklist de <em>Oratoria</em>
      </h1>
      <p>
        Grabate leyendo, escuchate y marcá lo que detectás. La rúbrica puntúa cada
        dimensión con criterios de bibliografía citada, y al final tenés un solo foco
        concreto para la próxima lectura.
      </p>
      <span className="hero-seal" aria-hidden="true">声</span>
    </header>
  );
}
