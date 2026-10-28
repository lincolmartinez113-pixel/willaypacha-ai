import { CREDITOS } from '../datos-img';
import Icono from '../componentes/Icono';

/** Página de créditos: cada fotografía con su autor, licencia y enlace de
 *  origen exacto, validado contra el API de Wikimedia Commons. */
export default function Creditos() {
  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Imágenes y créditos</div>
          <h1>Cada fotografía, con su autor y su licencia</h1>
          <p className="plomo">
            Las imágenes de este sitio provienen de Wikimedia Commons con licencias Creative Commons o
            dominio público, y se citan como se cita un documento: autor, licencia y enlace de origen.
            {CREDITOS.meta.verificado && <> Los enlaces fueron validados automáticamente el {new Date(CREDITOS.meta.verificado).toLocaleDateString('es-PE')}.</>}
          </p>
        </div>
        <aside className="ficha surge surge-2">
          <div className="ficha-titulo"><span>Regla de honestidad visual</span></div>
          <p className="mini texto-2 mb-0">{CREDITOS.meta.nota}</p>
        </aside>
      </div>

      <section className="placa surge surge-2">
        <div className="placa-cintillo"><span>Manifest de imágenes · {CREDITOS.fotos.length} fotografías</span></div>
        <div className="tabla-envoltura">
          <table className="tabla">
                <caption className="sr-only">Manifest de fotografías: archivo, título en Commons, autor, licencia y origen</caption>
            <thead>
              <tr><th>Archivo</th><th>Título en Commons</th><th>Autor</th><th>Licencia</th><th>Origen</th></tr>
            </thead>
            <tbody>
              {CREDITOS.fotos.map((f) => (
                <tr key={f.archivo}>
                  <td className="celda-mini dato-mono">{f.archivo}</td>
                  <td>{f.titulo}<div className="celda-mini">{f.pie}</div></td>
                  <td className="celda-mini">{f.autor}</td>
                  <td><span className="chip neutro">{f.licencia}</span></td>
                  <td className="celda-mini">
                    <a href={f.pagina} target="_blank" rel="noreferrer noopener" className="enlace-accion">
                      Commons <Icono nombre="externo" tamano={11} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mini texto-3 mt-1 mb-0">
          ¿Eres autor de alguna fotografía y deseas un cambio de atribución o su retiro? Usa el canal de
          rectificación del Radar o escríbenos por el contacto del repositorio: la corregimos con la misma
          visibilidad con la que se publicó.
        </p>
      </section>
    </>
  );
}
