import { useEffect, useRef, useState } from 'react';
import { bloques } from './data/bloques';
import Header from './components/Header';
import Bloque from './components/Bloque';
import Diagnostico from './components/Diagnostico';
import Resultado from './components/Resultado';
import Historial from './components/Historial';
import Medicion from './components/Medicion';
import Fuentes from './components/Fuentes';

const DIAGNOSTICO_VACIO = { problema: '', ejemplo: '', correccion: '' };
const MEDICION_VACIA = { palabras: '', minutos: '', segundos: '' };
const CLAVE_HISTORIAL = 'oratoria-historial';

// Palabras por minuto a partir de lo que cargo el alumno. Si falta un dato,
// devuelve undefined y el criterio de Ritmo queda solo autoevaluado.
function calcularPpm({ palabras, minutos, segundos }) {
  const p = Number(palabras);
  const seg = Number(minutos || 0) * 60 + Number(segundos || 0);
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(seg) || seg < 10) return undefined;
  return (p / seg) * 60;
}

function cargarSesiones() {
  try {
    const guardado = localStorage.getItem(CLAVE_HISTORIAL);
    if (!guardado) return [];
    const datos = JSON.parse(guardado);
    return Array.isArray(datos) ? datos.filter(Boolean) : [];
  } catch {
    // JSON corrupto: se guarda aparte en vez de descartarlo en silencio, porque
    // el efecto de abajo pisaria el historial con [] y se perderia entero.
    try {
      const crudo = localStorage.getItem(CLAVE_HISTORIAL);
      if (crudo) localStorage.setItem(`${CLAVE_HISTORIAL}-corrupto`, crudo);
    } catch { /* el navegador no deja escribir: no hay nada mas que hacer */ }
    return [];
  }
}

export default function App() {
  const [checks, setChecks] = useState({});
  const [diag, setDiag] = useState(DIAGNOSTICO_VACIO);
  const [mostrarResultado, setMostrar] = useState(false);
  const [tituloLectura, setTituloLectura] = useState('');
  const [medicion, setMedicion] = useState(MEDICION_VACIA);
  const [sesiones, setSesiones] = useState(cargarSesiones);

  // No reescribir el storage en el primer render: si la carga fallo, meteria [] encima.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    try {
      localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(sesiones));
    } catch {
      // La checklist sigue funcionando aunque el navegador no permita guardar.
    }
  }, [sesiones]);

  const ppm = calcularPpm(medicion);

  const totalItems = bloques.reduce((total, bloque) => total + bloque.items.length, 0);
  const seleccionados = Object.values(checks).filter(Boolean).length;
  const porcentaje = totalItems ? Math.round((seleccionados / totalItems) * 100) : 0;

  function toggle(blockId, itemIdx) {
    const key = `${blockId}-${itemIdx}`;
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    setMostrar(false);
  }

  function guardarSesion(sesion) {
    setSesiones(prev => [{ ...sesion, id: Date.now() }, ...prev]);
  }

  function borrarSesion(id) {
    setSesiones(prev => prev.filter(sesion => sesion.id !== id));
  }

  function resetAll() {
    setChecks({});
    setDiag(DIAGNOSTICO_VACIO);
    setTituloLectura('');
    setMedicion(MEDICION_VACIA);
    setMostrar(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function evaluar() {
    setMostrar(true);
    window.setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  return (
    <div className="page-shell">
      <div className="app-layout">
        <main className="main-column">
          <label className="reading-field">
            <span className="eyebrow">Tu práctica de hoy</span>
            <input
              className="reading-input"
              type="text"
              placeholder="Nombre de la lectura (opcional)"
              value={tituloLectura}
              onChange={event => setTituloLectura(event.target.value)}
            />
          </label>

          <Header />

          <section className="progress-card" aria-label="Avance de la checklist">
            <div className="progress-top">
              <h2 className="progress-title">Escucha con atención</h2>
              <span className="progress-count">{seleccionados} de {totalItems}</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Puntos de escucha marcados"
              aria-valuemin="0"
              aria-valuemax={totalItems}
              aria-valuenow={seleccionados}
            >
              <div className="progress-fill" style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="progress-note">
              {seleccionados === 0 ? 'Marcá los puntos que reconocés en tu grabación.' : `Ya identificaste ${seleccionados} ${seleccionados === 1 ? 'punto' : 'puntos'} para trabajar.`}
            </p>
          </section>

          <div className="checklist" aria-label="Checklist de escucha activa">
            {bloques.map((bloque, orden) => (
              <Bloque key={bloque.id} bloque={bloque} checks={checks} onToggle={toggle} orden={orden} />
            ))}
          </div>

          <Medicion
            valores={medicion}
            ppm={ppm}
            onChange={(key, value) => {
              setMedicion(prev => ({ ...prev, [key]: value }));
              setMostrar(false);
            }}
          />

          <Diagnostico
            valores={diag}
            onChange={(key, value) => {
              setDiag(prev => ({ ...prev, [key]: value }));
              setMostrar(false);
            }}
          />

          <div className="action-row">
            <button type="button" className="button button-quiet" onClick={resetAll}>Limpiar</button>
            <button type="button" className="button button-primary" onClick={evaluar} disabled={seleccionados === 0}>
              Ver mi diagnóstico <span aria-hidden="true">↗</span>
            </button>
          </div>
          {seleccionados === 0 && <p className="action-hint">Marcá al menos un punto para habilitar el diagnóstico.</p>}

          <div id="resultado" aria-live="polite">
            {mostrarResultado && (
              <Resultado
                checks={checks}
                diag={diag}
                onGuardar={guardarSesion}
                tituloLectura={tituloLectura}
                sesionesAnteriores={sesiones}
                ppm={ppm}
              />
            )}
          </div>

          <Fuentes />
        </main>

        <Historial sesiones={sesiones} onBorrar={borrarSesion} />
      </div>
    </div>
  );
}
