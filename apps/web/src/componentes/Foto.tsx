import Icono from './Icono';
import { creditoDe, urlDe } from '../datos-img';

/** Fotografía con crédito obligatorio visible (autor, licencia y enlace de
 *  origen). Sin crédito documentado, la foto no se muestra. */
export default function Foto({ archivo, leyenda, alto }: { archivo: string; leyenda?: string; alto?: number }) {
  const credito = creditoDe(archivo);
  if (!credito) return null;
  return (
    <figure className="foto">
      <img
        src={urlDe(credito.archivo)}
        alt={credito.pie}
        loading="lazy"
        style={alto ? { aspectRatio: 'auto', height: alto, objectFit: 'cover' } : undefined}
      />
      <figcaption>
        <strong>{leyenda || credito.titulo}</strong> — {credito.pie}
        <span className="credito">
          <Icono nombre="externo" tamano={10} />
          <span>Foto: {credito.autor} · {credito.licencia} ·</span>
          <a href={credito.pagina} target="_blank" rel="noreferrer noopener">Wikimedia Commons</a>
        </span>
      </figcaption>
    </figure>
  );
}
