import { useState } from 'react';
import type { Registro } from '../datos';
import { etiquetaTipo, fechaCorta, urlBusqueda } from '../datos';
import Semaforo from './Semaforo';
import Icono from './Icono';
import { api } from '../api';

/** Tarjeta de expediente: cita literal, fuente enlazada, semáforo, estado
 *  procesal, hash (o su pendencia declarada) y bitácora pública a demanda. */
export default function TarjetaRegistro({ registro, compacto = false }: { registro: Registro; compacto?: boolean }) {
  const [bitacora, setBitacora] = useState<{ cambio: string; documento: string | null; fecha: string }[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function abrirBitacora() {
    setCargando(true);
    const r = await api.bitacoraRegistro(registro.id);
    setBitacora(r?.cambios ?? []);
    setCargando(false);
  }

  return (
    <article className="tarjeta surge">
      <div className="tarjeta-cabecera">
        <div>
          <div className="tarjeta-titulo">{registro.cuerpoAgua || registro.componente || registro.id}</div>
          <div className="tarjeta-sub">{etiquetaTipo(registro.tipo)} · {registro.parametro} · {fechaCorta(registro.fecha)}</div>
        </div>
        <Semaforo valor={registro.semaforo} />
      </div>

      {!compacto && (
        <blockquote className="cita-card">
          <p className="cita-texto">«{registro.citaLiteral}»</p>
          <div className="cita-pie">
            <span><strong>{registro.fuente.organismo}</strong> — {registro.fuente.documento}</span>
            <span>Confianza: {registro.confianza}</span>
            <span>Consultado: {fechaCorta(registro.fechaConsulta)}</span>
          </div>
        </blockquote>
      )}

      {registro.estadoProcesal && (
        <p className="mini texto-2 mb-05">
          <strong>Estado:</strong> {registro.estadoProcesal}
        </p>
      )}
      <p className="hash mb-05">
        {registro.hashDocumento
          ? `sha256 · ${registro.hashDocumento}`
          : `hash del documento primario: pendiente — no se fabrican hashes`}
      </p>

      <div className="fila">
        <a className="boton secundario pequeno" href={urlBusqueda(registro.fuente)} target="_blank" rel="noreferrer noopener">
          <Icono nombre="externo" tamano={13} />
          Fuente primaria
        </a>
        <button className="boton fantasma pequeno" onClick={abrirBitacora} disabled={cargando}>
          <Icono nombre="lista" tamano={13} />
          Bitácora
        </button>
      </div>

      {bitacora && (
        <div className="mt-05">
          {bitacora.length === 0 ? (
            <p className="mini texto-3 mb-0">Sin cambios registrados en la bitácora pública de este registro.</p>
          ) : (
            <ul className="bitacora">
              {bitacora.map((b, i) => (
                <li key={i}>
                  <span className="cuando">{new Date(b.fecha).toLocaleString('es-PE')}</span>
                  <span>{b.cambio}{b.documento ? ` — documento: ${b.documento}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
