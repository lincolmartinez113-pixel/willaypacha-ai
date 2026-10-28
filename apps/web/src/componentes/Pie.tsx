import { Link } from 'react-router-dom';
import { Marca } from './Cabecera';
import type { Salud } from '../api';

const LEGAL = [
  ['privacidad', 'Privacidad'],
  ['terminos', 'Términos de uso'],
  ['aviso', 'Aviso legal'],
  ['contenido', 'Contenido y moderación'],
  ['seguridad', 'Seguridad'],
  ['transparencia-ia', 'Transparencia de IA'],
] as const;

export default function Pie({ salud }: { salud: Salud | null }) {
  return (
    <footer className="pie">
      <div className="pie-interior">
        <div>
          <div className="pie-marca">
            <Marca tamano={30} />
            <div>
              <div className="negrita" style={{ fontFamily: 'var(--display)', fontSize: '1rem' }}>WillayPacha AI</div>
              <div className="mini" style={{ fontFamily: 'var(--mono)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {salud ? `v${salud.version} · ${salud.modo === 'en-vivo' ? 'en vivo' : 'instancia demo'}` : 'v0.1.0'}
              </div>
            </div>
          </div>
          <p className="pie-regla mini mb-0">
            Información pública con fuente, fecha y cita. No reemplaza a OEFA, a la ANA, a un laboratorio
            acreditado ni a un profesional colegiado: ordena la información y prepara borradores que solo
            adquieren valor con revisión experta. La presentación ante cualquier entidad la realiza la
            persona por los canales oficiales.
          </p>
        </div>

        <div>
          <h4>Módulos</h4>
          <Link to="/">Radar de Transparencia</Link>
          <Link to="/rimay">Asistente Rimay</Link>
          <Link to="/evidencia">Laboratorio de Evidencia</Link>
          <Link to="/documentos">Documentos y Expertos</Link>
          <Link to="/casos">Casos de la Comunidad</Link>
        </div>

        <div>
          <h4>Legales y transparencia</h4>
          {LEGAL.map(([slug, titulo]) => (
            <Link key={slug} to={`/legal/${slug}`}>{titulo}</Link>
          ))}
          <Link to="/creditos">Imágenes y créditos</Link>
        </div>
      </div>
      <div className="pie-final">
        <div className="pie-final-interior">
          <span>WillayPacha AI · willay (informar) + pacha (tiempo, territorio)</span>
          <span>voz sintética — modelo MMS de Meta · ninguna capacidad no disponible se simula</span>
        </div>
      </div>
    </footer>
  );
}
