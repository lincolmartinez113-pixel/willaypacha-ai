import { useRef, useState } from 'react';
import { api, type ResultadoExplicacion } from '../api';
import { useLengua } from '../i18n';
import Icono from '../componentes/Icono';

interface Reconocimiento {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((evento: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

const CONSULTAS_RAPIDAS: { texto: string; icono: 'gota' | 'capas' | 'balanza' | 'verificado' }[] = [
  { texto: '¿Qué dice el informe oficial sobre la quebrada Chogñacota?', icono: 'gota' },
  { texto: '¿Qué se concluyó sobre los sedimentos de San Rafael?', icono: 'capas' },
  { texto: '¿En qué está el caso de la unidad San Vicente?', icono: 'balanza' },
  { texto: '¿Hubo hallazgos negativos en la microcuenca Larancota?', icono: 'verificado' },
];

export default function Rimay() {
  const { lengua, paquete, terminos } = useLengua();
  const [escuchando, setEscuchando] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState<ResultadoExplicacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttsEstado, setTtsEstado] = useState<string | null>(null);
  const reconocimiento = useRef<Reconocimiento | null>(null);

  const soportaVoz = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  function alternarMicro() {
    if (escuchando) {
      reconocimiento.current?.stop();
      setEscuchando(false);
      return;
    }
    const Ctor = (window as unknown as { webkitSpeechRecognition?: new () => Reconocimiento; SpeechRecognition?: new () => Reconocimiento })
      .webkitSpeechRecognition ?? (window as unknown as { SpeechRecognition?: new () => Reconocimiento }).SpeechRecognition;
    if (!Ctor) {
      setError('Este navegador no ofrece transcripción de voz (Web Speech API). Escriba su consulta: el asistente funciona igual.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'es-PE';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (evento) => setConsulta(evento.results[0]?.[0]?.transcript ?? '');
    rec.onend = () => setEscuchando(false);
    rec.onerror = () => setEscuchando(false);
    reconocimiento.current = rec;
    setError(null);
    setEscuchando(true);
    rec.start();
  }

  async function preguntar(texto: string) {
    if (!texto.trim()) return;
    setCargando(true);
    setError(null);
    setTtsEstado(null);
    try {
      const r = await api.explicar(texto, lengua);
      if (!r) throw new Error('El servidor no responde; en modo sin conexión el asistente requiere el backend local (npm run dev:server).');
      setRespuesta(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error desconocido');
    } finally {
      setCargando(false);
    }
  }

  async function escucharRespuesta() {
    if (!respuesta) return;
    setTtsEstado('Consultando la disponibilidad de voz sintética…');
    const disp = await api.disponibilidadTts();
    const info = disp?.tts?.[lengua === 'es' ? 'qu' : lengua];
    if (lengua === 'es') {
      setTtsEstado('La síntesis de las lenguas originarias (MMS de Meta) se ejecuta solo en el servidor; en esta instancia no está habilitada y así se declara.');
      return;
    }
    if (info && info.disponible === false) {
      setTtsEstado(`Voz sintética no disponible en esta instancia (${info.checkpoint} · ${info.licencia}). ${String(info.motivo || '')}`);
    } else {
      setTtsEstado('Voz sintética no disponible: el servidor declaró indisponibilidad.');
    }
  }

  const terminosVisibles = respuesta?.terminosGlosario ?? [];

  return (
    <>
      <div className="intro">
        <div className="surge">
          <div className="kicker">Módulo B · Asistente de voz en lenguas originarias</div>
          <h1>Rimay — el sistema que habla con fuente</h1>
          <p className="plomo">
            Soy una inteligencia artificial. Explico, con cita, lo que dicen los documentos oficiales cargados; no
            doy asesoría legal ni diagnósticos de salud, y derivo a las instancias competentes. Alcance: solo los
            registros verificados de esta instancia — lo que no consta, lo digo.
          </p>
        </div>
        <aside className="ficha surge surge-2">
          <div className="ficha-titulo"><span>Lengua · {paquete.nombre}</span></div>
          <p className="mini texto-2 mb-0">
            {lengua === 'es'
              ? 'Lengua completa del sistema: interfaz, contenidos, documentos y páginas legales.'
              : paquete.aviso}
          </p>
          {lengua !== 'es' && (
            <p className="mini texto-3 mt-05 mb-0">
              Glosario (borrador):{' '}
              {Object.entries(terminos)
                .filter(([, v]) => v[lengua as 'qu' | 'ay' | 'ash']?.valor)
                .map(([es_, v]) => `${es_} = ${v[lengua as 'qu' | 'ay' | 'ash'].valor}`)
                .join(' · ') || 'sin términos con valor aún para esta lengua'}.
            </p>
          )}
        </aside>
      </div>

      <div className="rimay-disposicion">
        <section className="placa esquinas surge surge-1">
          <div className="placa-cintillo"><span>Entrada por voz</span></div>
          <div className="rimay-nucleo">
            <button
              className={`micro ${escuchando ? 'escuchando' : ''}`}
              onClick={alternarMicro}
              aria-label={escuchando ? 'Detener la escucha' : 'Hablar'}
              title={soportaVoz ? 'Hablar' : 'Transcripción de voz no disponible en este navegador'}
            >
              <Icono nombre="mic" tamano={34} />
            </button>
            {escuchando ? (
              <div className="ondas" aria-hidden="true">
                {Array.from({ length: 7 }).map((_, i) => <i key={i} />)}
              </div>
            ) : (
              <span className="mini texto-3">Toque para hablar o escriba su consulta</span>
            )}
          </div>

          <div className="campo">
            <label htmlFor="consulta-rimay">Su consulta</label>
            <textarea
              id="consulta-rimay"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Por ejemplo: ¿Por qué el agua de la quebrada está amarillenta y qué dice el informe oficial?"
            />
          </div>
          <button className="boton" style={{ width: '100%' }} onClick={() => preguntar(consulta)} disabled={cargando || !consulta.trim()}>
            {cargando ? 'Consultando las fuentes…' : 'Explicámelo'}
          </button>
          {cargando && (
            <div className="aviso neutro mt-1" role="status" aria-live="polite">
              <span className="esqueleto" style={{ width: '70%', height: 10 }} />
              <span className="esqueleto" style={{ width: '55%', height: 10 }} />
              <span className="mini texto-3 mt-025">Consultando las fuentes y pasando por el verificador P6…</span>
            </div>
          )}
        </section>

        <section className="surge surge-2">
          <div className="placa-cintillo"><span>Consultas frecuentes</span></div>
          <div className="rejilla dos" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {CONSULTAS_RAPIDAS.map((c) => (
              <button key={c.texto} className="consulta-rapida" onClick={() => { setConsulta(c.texto); preguntar(c.texto); }}>
                <Icono nombre={c.icono} tamano={16} />
                {c.texto}
              </button>
            ))}
          </div>

          {error && <div className="aviso rojo mt-2"><Icono nombre="alerta" tamano={16} /><span>{error}</span></div>}

          {respuesta && (
            <div className="placa mt-2 surge">
              <div className="placa-cintillo"><span>Respuesta verificada</span></div>
              <div className="envoltura-chips mb-1">
                <span className={`chip ${respuesta.modo === 'en-vivo' ? 'vivo' : 'demo'}`}>
                  <span className="punto" />{respuesta.modo === 'en-vivo' ? 'generado en vivo' : 'respuesta demo declarada'}
                </span>
                <span className={`chip ${respuesta.registroGeneracion.verificacion.aprobado ? 'verde' : 'rojo'}`}>
                  <Icono nombre={respuesta.registroGeneracion.verificacion.aprobado ? 'verificado' : 'x'} tamano={11} />
                  verificador P6 {respuesta.registroGeneracion.verificacion.aprobado ? 'aprobado' : 'bloqueado'}
                </span>
                {respuesta.estadoTraduccion && <span className="chip ambar">{respuesta.estadoTraduccion}</span>}
              </div>

              {respuesta.bloqueado ? (
                <div className="aviso rojo"><Icono nombre="alerta" tamano={16} /><span>{respuesta.texto}</span></div>
              ) : (
                <>
                  <p className="respuesta-principal">{respuesta.texto}</p>
                  {respuesta.textoLengua && <p className="respuesta-lengua">{respuesta.textoLengua}</p>}
                  {terminosVisibles.length > 0 && (
                    <p className="mini texto-3">
                      Términos del glosario usados (borrador hasta validación por hablante o intérprete registrado):{' '}
                      {terminosVisibles.map((t) => `${t.valor} (${t.es})`).join(' · ')}.
                    </p>
                  )}

                  {respuesta.citas.map((c) => (
                    <blockquote key={c.registroId} className="cita-card mt-1">
                      <p className="cita-texto">«{c.citaLiteral}»</p>
                      <div className="cita-pie">
                        <span><strong>{c.organismo}</strong> — {c.documento}</span>
                        <span>{c.fecha}</span>
                        <a href={`${c.url}?buscar=${encodeURIComponent(c.busqueda)}`} target="_blank" rel="noreferrer noopener" className="enlace-accion">
                          fuente primaria <Icono nombre="externo" tamano={11} />
                        </a>
                      </div>
                    </blockquote>
                  ))}

                  <div className="fila mt-1">
                    <button className="boton secundario pequeno" onClick={escucharRespuesta}>
                      <Icono nombre="pulso" tamano={14} />
                      Escuchar respuesta
                    </button>
                  </div>
                  {ttsEstado && <div className="aviso neutro mt-05"><Icono nombre="info" tamano={15} /><span>{ttsEstado}</span></div>}

                  <div className="registro-gen">
                    Registro de Generación IA · {respuesta.registroGeneracion.modelo} · {respuesta.registroGeneracion.prompt} ·{' '}
                    {new Date(respuesta.registroGeneracion.fecha).toLocaleString('es-PE')}
                    {respuesta.registroGeneracion.nota ? ` · ${respuesta.registroGeneracion.nota}` : ''}
                    <br />Regla P3: lo que no está en el glosario aprobado permanece en español entre paréntesis — no se inventan equivalencias.
                  </div>
                </>
              )}
            </div>
          )}

          {!respuesta && !error && (
            <div className="placa mt-2 surge surge-3">
              <div className="placa-cintillo"><span>Respuesta verificada</span></div>
              <div className="vacio">
                <Icono nombre="cerebro" tamano={30} />
                <div className="vacio-titulo">Cada respuesta nace de un registro citado</div>
                <small>
                  Elige una consulta frecuente o escribe la tuya. Toda respuesta pasa por el verificador P6:
                  si algo no consta en las fuentes, el sistema lo dice.
                </small>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
