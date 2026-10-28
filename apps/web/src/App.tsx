import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Radar from './paginas/Radar';
import Rimay from './paginas/Rimay';
import Evidencia from './paginas/Evidencia';
import Documentos from './paginas/Documentos';
import Casos from './paginas/Casos';
import Denunciar from './paginas/Denunciar';
import Legal from './paginas/Legal';
import Creditos from './paginas/Creditos';
import Cabecera from './componentes/Cabecera';
import Pie from './componentes/Pie';
import { api, type Salud } from './api';
import { useLengua } from './i18n';
import { useRevelar } from './componentes/useRevelar';
import FondoSimbolos from './componentes/FondoSimbolos';

export default function App() {
  const [salud, setSalud] = useState<Salud | null>(null);
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [cargandoSalud, setCargandoSalud] = useState(true);
  const { paquete, esEspanol } = useLengua();
  const location = useLocation();
  useRevelar();

  // Luz líquida: resplandor que sigue al puntero sobre las tarjetas.
  useEffect(() => {
    const alMover = (evento: PointerEvent) => {
      const objetivo = (evento.target as HTMLElement | null)?.closest<HTMLElement>('.tarjeta');
      if (!objetivo) return;
      const caja = objetivo.getBoundingClientRect();
      objetivo.style.setProperty('--mx', `${evento.clientX - caja.left}px`);
      objetivo.style.setProperty('--my', `${evento.clientY - caja.top}px`);
    };
    document.addEventListener('pointermove', alMover, { passive: true });
    return () => document.removeEventListener('pointermove', alMover);
  }, []);

  useEffect(() => {
    let vivo = true;
    // Red de seguridad: si /api/salud no responde en 6 s, se declara «sin backend»
    // en lugar de dejar un esqueleto infinito (estado honesto y resuelto).
    const limite = setTimeout(() => {
      if (vivo) { setSalud(null); setCargandoSalud(false); }
    }, 6000);
    api.salud().then((r) => {
      if (!vivo) return;
      clearTimeout(limite);
      setSalud(r);
      setCargandoSalud(false);
    });
    return () => { vivo = false; clearTimeout(limite); };
  }, []);

  useEffect(() => {
    const alCambiar = () => setEnLinea(navigator.onLine);
    window.addEventListener('online', alCambiar);
    window.addEventListener('offline', alCambiar);
    return () => {
      window.removeEventListener('online', alCambiar);
      window.removeEventListener('offline', alCambiar);
    };
  }, []);

  return (
    <div className="app">
      <div className="aurora" aria-hidden="true">
        <i className="aurora-a" />
        <i className="aurora-b" />
        <i className="aurora-c" />
      </div>
      <FondoSimbolos />
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Cabecera salud={salud} cargandoSalud={cargandoSalud} enLinea={enLinea} />
      <main className="contenido" id="contenido">
        {!esEspanol && (
          <div className="aviso info mt-2" role="note">
            <span>
              <strong>{paquete.nombre}:</strong>{' '}
              {paquete.aviso || 'Traducción en borrador — pendiente de validación por hablantes e intérpretes registrados. La interfaz se muestra en español.'}
            </span>
          </div>
        )}
        <div className="pagina-entra" key={location.pathname}>
          <Routes>
          <Route path="/" element={<Radar />} />
          <Route path="/rimay" element={<Rimay />} />
          <Route path="/evidencia" element={<Evidencia />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/casos" element={<Casos />} />
          <Route path="/denunciar" element={<Denunciar />} />
          <Route path="/legal/:documento" element={<Legal />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/creditos" element={<Creditos />} />
          <Route path="*" element={<Radar />} />
        </Routes>
        </div>
      </main>
      <Pie salud={salud} />
    </div>
  );
}
