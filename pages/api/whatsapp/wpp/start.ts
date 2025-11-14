// API Route para iniciar sesión y obtener QR con Baileys
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: true,
  },
};

const base = process.env.BAILEYS_BASE_URL || '';
const apiKey = process.env.BAILEYS_API_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    if (!base || !apiKey) {
      console.error('[Baileys] Variables de entorno no configuradas');
      return res.status(500).json({
        error: 'BAILEYS_CONFIG_MISSING',
        detail: 'BAILEYS_BASE_URL o BAILEYS_API_KEY no están configurados en Vercel'
      });
    }

    console.log('[Baileys] 🚀 Iniciando sesión para:', phone);
    console.log('[Baileys] 🌐 Base URL:', base);

    // 1) Iniciar sesión en Baileys
    console.log('[Baileys] 📡 POST /start');
    const startResponse = await fetch(`${base}/start`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!startResponse.ok) {
      const txt = await startResponse.text();
      console.error('[Baileys] ❌ Error en /start:', startResponse.status, txt);
      return res.status(502).json({
        error: `BAILEYS_HTTP_${startResponse.status}`,
        detail: txt
      });
    }

    const startData = await startResponse.json();
    console.log('[Baileys] ✅ Sesión iniciada:', startData);

    // 2) Intentar obtener QR con reintentos (máximo 10 intentos = 20 segundos)
    let qrData = null;
    let attempts = 0;
    const maxAttempts = 10;

    console.log('[Baileys] 📡 Esperando generación de QR...');

    while (attempts < maxAttempts && !qrData) {
      attempts++;

      // Esperar 2 segundos entre intentos
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`[Baileys] 📡 Intento ${attempts}/${maxAttempts} - GET /qr`);

      const qrResponse = await fetch(`${base}/qr`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (qrResponse.ok) {
        const data = await qrResponse.json();
        if (data.ok && data.qr) {
          qrData = data;
          console.log('[Baileys] ✅ QR obtenido en intento', attempts);
          break;
        }
      } else {
        const txt = await qrResponse.text();

        // Si ya está logueado, devolver éxito
        try {
          const errorData = JSON.parse(txt);
          if (errorData.message === 'LOGGED_IN') {
            return res.status(200).json({
              ok: true,
              alreadyConnected: true,
              message: 'WhatsApp ya está conectado'
            });
          }
        } catch (e) {
          // Continuar intentando
        }

        console.log(`[Baileys] ⏳ Intento ${attempts}: QR no disponible aún`);
      }
    }

    if (!qrData) {
      console.error('[Baileys] ❌ QR no se generó después de', maxAttempts, 'intentos');
      return res.status(504).json({
        error: 'BAILEYS_QR_TIMEOUT',
        detail: `El QR no se generó después de ${maxAttempts * 2} segundos. Intenta de nuevo.`
      });
    }

    return res.status(200).json({
      ok: true,
      session: 'default',
      qrcode: qrData.qr
    });

  } catch (error: any) {
    console.error('[Baileys] 💥 Error inesperado:', error);
    return res.status(500).json({
      error: 'BAILEYS_ERROR',
      detail: error.message || 'Error desconocido'
    });
  }
}

