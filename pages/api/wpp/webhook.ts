// API Route para recibir webhooks de WPPConnect
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // Recibir raw body para validar firma
  },
};

const webhookSecret = process.env.WPP_WEBHOOK_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Leer body raw
    let rawBody = '';
    await new Promise<void>((resolve) => {
      req.on('data', (chunk) => {
        rawBody += chunk.toString();
      });
      req.on('end', resolve);
    });

    console.log('[WPP WEBHOOK] 📨 Recibido:', rawBody.substring(0, 200));

    // TODO: Validar firma si WPPConnect la envía
    // const signature = req.headers['x-wpp-signature'];
    // if (signature && webhookSecret) {
    //   const expectedSignature = crypto
    //     .createHmac('sha256', webhookSecret)
    //     .update(rawBody)
    //     .digest('hex');
    //   if (signature !== expectedSignature) {
    //     console.error('[WPP WEBHOOK] ❌ Firma inválida');
    //     return res.status(401).json({ error: 'Invalid signature' });
    //   }
    // }

    // Parsear JSON
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('[WPP WEBHOOK] ❌ JSON inválido');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Procesar evento
    const eventType = data?.event || data?.type || 'unknown';
    const session = data?.session || data?.sessionId || 'unknown';

    console.log('[WPP WEBHOOK] 📋 Evento:', eventType, 'Sesión:', session);

    // Aquí puedes manejar diferentes tipos de eventos:
    switch (eventType) {
      case 'qrcode':
        console.log('[WPP WEBHOOK] 📱 QR code generado');
        break;
      case 'connection':
        console.log('[WPP WEBHOOK] 🔌 Cambio de conexión');
        break;
      case 'message':
        console.log('[WPP WEBHOOK] 💬 Mensaje recibido');
        // TODO: Guardar mensaje en base de datos
        break;
      case 'onMessage':
        console.log('[WPP WEBHOOK] 📩 Mensaje nuevo');
        break;
      default:
        console.log('[WPP WEBHOOK] ℹ️  Evento no manejado:', eventType);
    }

    // Responder OK
    return res.status(200).json({ ok: true, received: eventType });

  } catch (error: any) {
    console.error('[WPP WEBHOOK] ❌ Error:', error);
    return res.status(500).json({
      error: 'WEBHOOK_ERROR',
      detail: error?.message
    });
  }
}

