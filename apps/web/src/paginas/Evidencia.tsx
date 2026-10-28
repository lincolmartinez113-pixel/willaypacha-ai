import { useRef, useState } from 'react';
import { sha256 } from '../lib/hash';
import { leerExif, type MetadatosExif } from '../lib/exif';
import { segmentarLocal, LEYENDA_LIMITE, type ResultadoSegmentacion } from '../lib/segmentacion';
import { token } from '../tema';
import { api } from '../api';
import Icono from '../componentes/Icono';

interface EvidenciaCargada {
  nombre: string;
  hash: string;
  exif: MetadatosExif | null;
  url: string;
  fechaCarga: string;
  bytes: number;
}

const PASOS = ['Cargar fotografía', 'Verificar integridad', 'Delimitar anomalía', 'Exportar lámina'];

function envolverTexto(ctx: CanvasRenderingContext2D, texto: string, anchoMax: number): string[] {
  const palabras = texto.split(' ');
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export default function Evidencia() {
  const [evidencia, setEvidencia] = useState<EvidenciaCargada | null>(null);
  const [segmentacion, setSegmentacion] = useState<ResultadoSegmentacion | null>(null);
  const [motor, setMotor] = useState<string | null>(null);
  const [ocultarMetadatos, setOcultarMetadatos] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function cargar(archivo: File) {
    setError(null);
    setSegmentacion(null);
    setMotor(null);
    try {
      const hash = await sha256(archivo);
      const buffer = await archivo.arrayBuffer();
      const exif = leerExif(buffer);
      setEvidencia({
        nombre: archivo.name,
        hash,
        exif,
        url: URL.createObjectURL(archivo),
        fechaCarga: new Date().toISOString(),
        bytes: archivo.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'no se pudo leer el archivo');
    }
  }

  async function delimitar() {
    if (!imgRef.current) return;
    setProcesando(true);
    setError(null);
    try {
      const declaracion = await api.segment();
      const motorActivo = declaracion?.motor ?? 'local-heuristica-cliente';
      setMotor(motorActivo);
      if (motorActivo !== 'local-heuristica-cliente') {
        setError('El servidor declaró un motor en vivo distinto de la heurística local; esta instancia no lo tiene disponible. Se declara en lugar de simularlo.');
        setProcesando(false);
        return;
      }
      setSegmentacion(segmentarLocal(imgRef.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'no se pudo segmentar');
    } finally {
      setProcesando(false);
    }
  }

  function borrar() {
    setEvidencia(null);
    setSegmentacion(null);
    setMotor(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function exportarLamina() {
    if (!evidencia || !segmentacion || !imgRef.current) return;
    const img = imgRef.current;
    const ancho = 900;
    const altoImagen = Math.round((img.naturalHeight / img.naturalWidth) * ancho);
    const margenSup = 86;
    const margenInf = 132;
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = margenSup + altoImagen + margenInf;
    const ctx = lienzo.getContext('2d')!;

    ctx.fillStyle = token('--panel', '#fffaf1');
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.fillStyle = token('--acento', '#c14f24');
    ctx.font = 'bold 15px Instrument Sans, sans-serif';
    ctx.fillText('LÁMINA DE APOYO VISUAL — WILLAYPACHA AI', 28, 32);
    ctx.fillStyle = token('--texto-2', '#5d4834');
    ctx.font = '12px Instrument Sans, sans-serif';
    ctx.fillText(`Evidencia: ${evidencia.nombre} · Cargada: ${new Date(evidencia.fechaCarga).toLocaleString('es-PE')}`, 28, 52);
    ctx.fillText(`Motor de segmentación: ${motor === 'local-heuristica-cliente' ? 'heurística local de color (NO es SAM 3.1)' : motor}`, 28, 70);

    ctx.drawImage(img, 0, margenSup, ancho, altoImagen);
    const mascara = new Image();
    await new Promise<void>((resolver) => {
      mascara.onload = () => resolver();
      mascara.src = segmentacion.urlMascara;
    });
    ctx.globalAlpha = 0.62;
    ctx.drawImage(mascara, 0, margenSup, ancho, altoImagen);
    ctx.globalAlpha = 1;

    const pieY = margenSup + altoImagen + 22;
    ctx.fillStyle = token('--texto', '#2b1c10');
    ctx.font = 'bold 13px Instrument Sans, sans-serif';
    ctx.fillText(`Área visual anómala: ${segmentacion.porcentaje.toFixed(1)} % de la imagen`, 28, pieY);
    ctx.fillStyle = token('--texto-3', '#7f6a52');
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(`sha256: ${evidencia.hash}`, 28, pieY + 18);
    ctx.fillStyle = token('--ambar', '#b97a06');
    ctx.font = '11px Instrument Sans, sans-serif';
    envolverTexto(ctx, LEYENDA_LIMITE, ancho - 56).slice(0, 3).forEach((linea, i) => ctx.fillText(linea, 28, pieY + 38 + i * 15));
    ctx.fillStyle = token('--texto-4', '#82694d');
    ctx.font = '10px Instrument Sans, sans-serif';
    ctx.fillText('Esta lámina no acredita contaminación: delimita visualmente una zona y conserva la huella del archivo.', 28, lienzo.height - 12);

    const enlace = document.createElement('a');
    enlace.download = `lamina-${evidencia.hash.slice(0, 10)}.png`;
    enlace.href = lienzo.toDataURL('image/png');
    enlace.click();
  }

  const pasoActual = !evidencia ? 0 : !segmentacion ? 2 : 3;

  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Módulo C · Laboratorio de Evidencia</div>
          <h1>El celular como instrumento de registro ordenado</h1>
          <p className="plomo">
            La huella SHA-256 se calcula en el propio dispositivo y queda visible en la ficha. Los metadatos de
            origen se muestran cuando existen y pueden ocultarse de cualquier vista pública. La segmentación
            delimita áreas visualmente anómalas: jamás se denomina «contaminación detectada».
          </p>
        </div>
        <aside className="ficha surge surge-2">
          <div className="ficha-titulo"><span>Límite que no se esconde</span></div>
          <p className="mini texto-2 mb-0">
            Una fotografía no mide metales. La integridad criptográfica prueba que el archivo no fue alterado
            después de su carga; no prueba que lo fotografiado sea lo que el relato dice. La confirmación del
            hecho ambiental corresponde a OEFA o a un laboratorio acreditado.
          </p>
        </aside>
      </div>

      <div className="pasos surge surge-2 mb-2" aria-label="Flujo del laboratorio">
        {PASOS.map((p, i) => (
          <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className={`paso ${i === pasoActual ? 'actual' : i < pasoActual ? 'hecho' : ''}`}>
              {i < pasoActual ? '✓ ' : `${i + 1}. `}{p}
            </span>
            {i < PASOS.length - 1 && <span className="flecha">→</span>}
          </span>
        ))}
      </div>

      <section className="placa esquinas surge surge-2">
        {!evidencia ? (
          <label className="zona-carga" style={{ display: 'block', cursor: 'pointer' }}>
            <Icono nombre="subir" tamano={30} estilo={{ color: 'var(--acento)' }} />
            <p className="negrita mt-05 mb-0">Arrastre o seleccione una fotografía de campo</p>
            <p className="mini texto-3 mb-0">JPEG o PNG · la evidencia original no se edita jamás: toda incorporación posterior es una nueva versión con su propia huella</p>
            <input ref={inputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) cargar(f); }} />
          </label>
        ) : (
          <>
            <div className="visor">
              <figure>
                <img ref={imgRef} src={evidencia.url} alt="Fotografía de campo cargada" />
                <figcaption>Original — sin edición. Huella calculada en el dispositivo.</figcaption>
              </figure>
              <figure>
                {segmentacion ? (
                  <img src={segmentacion.urlMascara} alt="Segmentación visual: área anómala delimitada" />
                ) : (
                  <div className="visor-vacio">La máscara se genera en el cliente con una heurística de color declarada</div>
                )}
                <figcaption>
                  {segmentacion
                    ? `Superposición — ${segmentacion.porcentaje.toFixed(1)} % del área marcada como visualmente anómala.`
                    : 'Sin segmentación todavía: use «Delimitar área visual anómala».'}
                </figcaption>
              </figure>
            </div>

            <div className="fila mt-2">
              <button className="boton" onClick={delimitar} disabled={procesando}>
                <Icono nombre="aperture" tamano={15} />
                {procesando ? 'Delimitando…' : 'Delimitar área visual anómala'}
              </button>
              {segmentacion && (
                <button className="boton secundario" onClick={exportarLamina}>
                  <Icono nombre="documento" tamano={15} />
                  Exportar Lámina de Apoyo Visual
                </button>
              )}
              <button className="boton peligro" onClick={borrar}>
                <Icono nombre="x" tamano={14} />
                Borrar fotografía y lámina
              </button>
            </div>

            <div className="separador" />

            <div className="rejilla dos">
              <div>
                <div className="placa-cintillo"><span>Ficha de evidencia</span></div>
                <div className="meta-linea" style={{ flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                  <span><strong>Archivo:</strong> {evidencia.nombre} ({(evidencia.bytes / 1024).toFixed(0)} KB)</span>
                  <span><strong>Cargada:</strong> {new Date(evidencia.fechaCarga).toLocaleString('es-PE')}</span>
                  <span><strong>Metadatos de origen:</strong> {evidencia.exif ? 'presentes' : 'sin metadatos legibles'}</span>
                </div>
                <p className="hash mt-05" style={{ userSelect: 'all' }}>sha256 · {evidencia.hash}</p>
                <label className="check mt-05">
                  <input type="checkbox" checked={ocultarMetadatos} onChange={(e) => setOcultarMetadatos(e.target.checked)} />
                  <span><strong>Ocultar metadatos</strong> en cualquier vista pública (protege a las personas y a la comunidad).</span>
                </label>
              </div>
              <div>
                <div className="placa-cintillo"><span>Metadatos EXIF</span></div>
                {evidencia.exif ? (
                  <div className="meta-linea" style={{ flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                    {evidencia.exif.fechaToma && <span><strong>Fecha de toma:</strong> {evidencia.exif.fechaToma}</span>}
                    {evidencia.exif.camara && <span><strong>Cámara:</strong> {evidencia.exif.camara}</span>}
                    {evidencia.exif.coordenadas && (
                      <span>
                        <strong>Coordenadas:</strong>{' '}
                        {ocultarMetadatos ? 'ocultas en vistas públicas' : `${evidencia.exif.coordenadas.lat.toFixed(5)}, ${evidencia.exif.coordenadas.lng.toFixed(5)}`}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mini texto-3">
                    La imagen no trae EXIF legible. Se registra igual: el hash prueba la integridad desde la carga.
                  </p>
                )}
                <p className="mini texto-3 mt-05 mb-0">
                  La fecha y el lugar declarados por el relato se contrastan con estos metadatos durante la
                  revisión humana del caso (filtro de cinco pasos).
                </p>
              </div>
            </div>

            {segmentacion && (
              <div className="lamina-leyenda" role="note">
                <Icono nombre="alerta" tamano={16} />
                <span>
                  <strong>Leyenda obligatoria (impresa en la lámina):</strong> {LEYENDA_LIMITE}{' '}
                  {motor === 'local-heuristica-cliente' && <>Motor activo: heurística local de color — no es SAM 3.1. Con META_API_KEY, el mismo botón usa SAM 3.1 en el servidor.</>}
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {error && <div className="aviso rojo mt-2"><Icono nombre="alerta" tamano={16} /><span>{error}</span></div>}
    </>
  );
}
