import type { Registro } from '../datos';
import Icono from './Icono';

const ETIQUETAS: Record<Registro['semaforo'], string> = {
  rojo: 'Hallazgo vigente',
  ambar: 'En curso',
  verde: 'Sin hallazgo',
};

const DESCRIPCIONES: Record<Registro['semaforo'], string> = {
  rojo: 'Hallazgo oficial vigente que supera un estándar o medida/sanción firme',
  ambar: 'Procedimiento en curso, atribución dudosa o información desactualizada',
  verde: 'Evaluación oficial sin hallazgo negativo o compromiso verificado como cumplido',
};

export default function Semaforo({ valor, conTexto = true }: { valor: Registro['semaforo']; conTexto?: boolean }) {
  return (
    <span className={`semaforo ${valor}`} title={DESCRIPCIONES[valor]}>
      <span className="punto" aria-hidden="true" />
      {conTexto && <span>{ETIQUETAS[valor]}</span>}
    </span>
  );
}

export function SemaforoSolo({ valor }: { valor: Registro['semaforo'] }) {
  return <span className={`semaforo ${valor}`}><span className="punto" aria-hidden="true" /></span>;
}

export function Vacio({ icono, titulo, detalle, accion }: { icono: Parameters<typeof Icono>[0]['nombre']; titulo: string; detalle: string; accion?: React.ReactNode }) {
  return (
    <div className="vacio">
      <Icono nombre={icono} tamano={30} />
      <div className="vacio-titulo">{titulo}</div>
      <small>{detalle}</small>
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  );
}
