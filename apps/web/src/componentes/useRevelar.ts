import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Revelado al hacer scroll con red de seguridad: tras 2,5 s todo elemento
 *  .revelar se marca visible pase lo que pase (nunca contenido invisible). */
export function useRevelar() {
  const location = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.revelar').forEach((el) => el.classList.add('visible'));
      return;
    }
    const elementos = Array.from(document.querySelectorAll<HTMLElement>('.revelar:not(.visible)'));
    if (elementos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
            observador.unobserve(entrada.target);
          }
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
    );
    elementos.forEach((el) => observador.observe(el));

    const redDeSeguridad = setTimeout(() => {
      elementos.forEach((el) => el.classList.add('visible'));
    }, 2500);

    return () => {
      observador.disconnect();
      clearTimeout(redDeSeguridad);
    };
  }, [location.pathname]);
}
