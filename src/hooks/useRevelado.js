import { useEffect, useRef } from 'react';

// Revelado al scrollear. El estado inicial lo pone JS (data-revelar="pendiente"),
// nunca el CSS a secas: si el script no corre o el navegador no soporta
// IntersectionObserver, el atributo nunca se escribe y el contenido queda
// visible en lugar de quedar en opacity 0 para siempre.
export default function useRevelado({ delay = 0, umbral = 0.12 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (sinMovimiento || typeof IntersectionObserver === 'undefined') {
      el.dataset.revelar = 'listo';
      return;
    }

    el.style.setProperty('--gota-delay', `${delay}ms`);
    el.dataset.revelar = 'pendiente';

    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      el.dataset.revelar = 'listo';
      observador.disconnect();
    }, { threshold: umbral, rootMargin: '0px 0px -8% 0px' });

    observador.observe(el);
    return () => observador.disconnect();
  }, [delay, umbral]);

  return ref;
}
