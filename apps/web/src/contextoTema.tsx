import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** Tema visual: «papel» (editorial cálido, por defecto) y «noche» (oscuro
 *  corporativo, titulares en sans). Se aplica como data-tema en <html> y se
 *  persiste en localStorage. Ambos usan el MISMO sistema de tokens. */
export type Tema = 'papel' | 'noche';

interface ContextoTema {
  tema: Tema;
  alternar: () => void;
  setTema: (t: Tema) => void;
}

const Ctx = createContext<ContextoTema | null>(null);

function temaGuardado(): Tema {
  const guardado = localStorage.getItem('wp-tema');
  return guardado === 'noche' ? 'noche' : 'papel';
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTemaEstado] = useState<Tema>(temaGuardado);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('wp-tema', tema);
    // Aviso para componentes que dependen del tema fuera de React (mapa).
    window.dispatchEvent(new CustomEvent('tema:cambio', { detail: tema }));
  }, [tema]);

  const valor = useMemo<ContextoTema>(
    () => ({ tema, setTema: setTemaEstado, alternar: () => setTemaEstado((t) => (t === 'papel' ? 'noche' : 'papel')) }),
    [tema],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useTema(): ContextoTema {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTema fuera del ProveedorTema');
  return ctx;
}
