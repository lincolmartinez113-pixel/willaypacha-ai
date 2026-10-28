import { Router } from 'express';
import { config } from '../config.js';
import { db } from '../db.js';

/**
 * WhatsApp Cloud API — canal de recepción de reportes y devolución de
 * confirmaciones en la lengua elegida. Deshabilitado sin credenciales: se
 * declara, no se simula.
 */
export const whatsapp = Router();

function habilitado() {
  return Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId);
}

whatsapp.get('/webhook', (req, res) => {
  if (!habilitado()) {
    return res.status(503).json({
      deshabilitado: true,
      motivo: 'WhatsApp Cloud API sin credenciales en esta instancia. El canal existe en el diseño y se habilita con WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID.',
    });
  }
  const modo = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (modo === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(String(challenge));
  }
  res.status(403).json({ error: 'verificación fallida' });
});

whatsapp.post('/webhook', (req, res) => {
  if (!habilitado()) {
    return res.status(503).json({ deshabilitado: true, motivo: 'canal no configurado' });
  }
  try {
    const mensajes = req.body?.entry?.[0]?.changes?.[0]?.value?.messages || [];
    for (const m of mensajes) {
      const texto = m.text?.body || (m.audio ? '[audio recibido]' : m.image ? '[imagen recibida]' : '');
      if (!texto) continue;
      // P4: el reporte entra como observación ciudadana pendiente de verificación,
      // nunca como hallazgo. La confirmación de dos líneas cierra el círculo.
      const caso = {
        id: db.siguienteId('CASO', 'casos'),
        codigoRetiro: 'wa-' + Math.random().toString(16).slice(2, 14),
        estado: 'recibido',
        canal: 'whatsapp',
        relato: texto,
        lengua: 'es',
        identidadReservada: true,
        contacto: m.from || '',
        evidencias: [],
        consistencia: {
          paso: 'consistencia-automatica',
          resultado: 'sin contraste oficial disponible',
          nota: 'Reporte recibido por WhatsApp; la IA actúa como asistente del filtro, nunca como juez.',
        },
        revisiones: [],
        bitacora: [{ fecha: new Date().toISOString(), evento: 'recibido', detalle: 'Reporte recibido por WhatsApp. Observación ciudadana pendiente de verificación.' }],
        creadoEl: new Date().toISOString(),
      };
      db.estado.casos.push(caso);
      db.evento(`reporte WhatsApp ${caso.id} recibido`);
    }
    db.guardar();
    res.status(200).json({ recibido: true });
  } catch {
    res.status(200).json({ recibido: false });
  }
});
