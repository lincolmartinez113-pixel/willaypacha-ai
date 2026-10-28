import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** Contexto de lengua. La interfaz está en español (lengua completa del sistema);
 *  los paquetes quechua/aimara/asháninka se muestran con su estado de validación
 *  y sus términos del glosario. Ninguna pantalla simula una fluidez que no hay. */

export type CodigoLengua = 'es' | 'qu' | 'ay' | 'ash';

export interface PaqueteLengua {
  codigo: string;
  nombre: string;
  nombreNativo?: string;
  estado: string;
  estadoValidacion: string;
  aviso?: string;
  terminosGlosario?: Record<string, string>;
}

import es from '../../../i18n/es.json';
import qu from '../../../i18n/qu.json';
import ay from '../../../i18n/ay.json';
import ash from '../../../i18n/ash.json';
import glosario from '../../../i18n/glosario.json';

const PAQUETES: Record<CodigoLengua, PaqueteLengua> = {
  es: es as PaqueteLengua,
  qu: qu as PaqueteLengua,
  ay: ay as PaqueteLengua,
  ash: ash as PaqueteLengua,
};

export interface TerminoGlosario {
  valor: string | null;
  estado: string;
  respaldadoPor: string;
  validadoEl: string | null;
}

export interface GlosarioContexto {
  lengua: CodigoLengua;
  setLengua: (l: CodigoLengua) => void;
  paquete: PaqueteLengua;
  esEspanol: boolean;
  terminos: Record<string, Record<'qu' | 'ay' | 'ash', TerminoGlosario>>;
}

const Ctx = createContext<GlosarioContexto | null>(null);

export function ProveedorLengua({ children }: { children: ReactNode }) {
  const [lengua, setLengua] = useState<CodigoLengua>(() => {
    const guardada = localStorage.getItem('wp-lengua') as CodigoLengua | null;
    return guardada && ['es', 'qu', 'ay', 'ash'].includes(guardada) ? guardada : 'es';
  });

  useEffect(() => {
    localStorage.setItem('wp-lengua', lengua);
  }, [lengua]);

  const valor = useMemo<GlosarioContexto>(
    () => ({
      lengua,
      setLengua,
      paquete: PAQUETES[lengua],
      esEspanol: lengua === 'es',
      terminos: (glosario as unknown as { terminos: Record<string, Record<'qu' | 'ay' | 'ash', TerminoGlosario>> }).terminos,
    }),
    [lengua],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useLengua(): GlosarioContexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLengua fuera del ProveedorLengua');
  return ctx;
}
