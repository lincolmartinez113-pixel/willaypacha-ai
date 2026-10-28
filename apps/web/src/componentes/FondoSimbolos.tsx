import { useEffect, useRef } from 'react';
import { Chakana } from './Simbolos';

/** Fondo vivo: capas de contornos andinos y chakanas que derivan lentamente y
 *  responden al puntero con parallax (transform-only). Se apaga por completo
 *  con prefers-reduced-motion y nunca intercepta clics ni cubre contenido. */
export default function FondoSimbolos() {
  const raiz = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducir.matches) return;

    let objetivoX = 0;
    let objetivoY = 0;
    let actualX = 0;
    let actualY = 0;
    let cuadro = 0;

    const pintar = () => {
      actualX += (objetivoX - actualX) * 0.085;
      actualY += (objetivoY - actualY) * 0.06;
      const estilo = document.documentElement.style;
      estilo.setProperty('--px', actualX.toFixed(4));
      estilo.setProperty('--py', actualY.toFixed(4));
      const sigue = Math.abs(objetivoX - actualX) > 0.001 || Math.abs(objetivoY - actualY) > 0.001;
      cuadro = sigue ? requestAnimationFrame(pintar) : 0;
    };

    const alMover = (evento: PointerEvent) => {
      objetivoX = (evento.clientX / window.innerWidth) * 2 - 1;
      objetivoY = (evento.clientY / window.innerHeight) * 2 - 1;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };

    window.addEventListener('pointermove', alMover, { passive: true });
    return () => {
      window.removeEventListener('pointermove', alMover);
      if (cuadro) cancelAnimationFrame(cuadro);
      document.documentElement.style.removeProperty('--px');
      document.documentElement.style.removeProperty('--py');
    };
  }, []);

  return (
    <div className="fondo-simbolos" aria-hidden="true" ref={raiz}>
      <div className="fs-capa fs-a"><i /></div>
      <div className="fs-capa fs-b"><i /></div>
      <div className="fs-chakana fs-ch-a"><Chakana tamano={360} trazar={false} /></div>
      <div className="fs-chakana fs-ch-b"><Chakana tamano={230} trazar={false} /></div>
    </div>
  );
}
