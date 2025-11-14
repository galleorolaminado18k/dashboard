// API Route para iniciar sesión y obtener QR con WAHA
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: true,
  },
};

const base = process.env.WAHA_BASE_URL || '';
const SESSION_NAME = 'default';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    if (!base) {
      console.error('[WAHA] WAHA_BASE_URL no configurada');
      return res.status(500).json({
        error: 'WAHA_CONFIG_MISSING',
        detail: 'WAHA_BASE_URL no está configurada en Vercel'
      });
    }

    console.log('[WAHA] 🚀 Iniciando sesión para:', phone);
    console.log('[WAHA] 🌐 Base URL:', base);

    // 1) Iniciar sesión en WAHA
    console.log('[WAHA] 📡 POST /api/sessions/start');
    const startResponse = await fetch(`${base}/api/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: SESSION_NAME,
        config: {
          proxy: null,
          noweb: {
            store: {
              enabled: true,
              fullSync: false
            }
          }
        }
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!startResponse.ok) {
      const txt = await startResponse.text();
      console.error('[WAHA] ❌ Error en /start:', startResponse.status, txt);

      // Si la sesión ya existe, continuar
      if (startResponse.status === 409 || txt.includes('already exists')) {
        console.log('[WAHA] ℹ️  Sesión ya existe, continuando...');
      } else {
        return res.status(502).json({
          error: `WAHA_HTTP_${startResponse.status}`,
          detail: txt
        });
      }
    } else {
      const startData = await startResponse.json();
      console.log('[WAHA] ✅ Sesión iniciada:', startData);
    }

    // 2) Obtener QR con reintentos
    let qrData = null;
    let attempts = 0;
    const maxAttempts = 15;

    console.log('[WAHA] 📡 Esperando generación de QR...');

    while (attempts < maxAttempts && !qrData) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`[WAHA] 📡 Intento ${attempts}/${maxAttempts} - GET /api/${SESSION_NAME}/auth/qr`);

      try {
        const qrResponse = await fetch(`${base}/api/${SESSION_NAME}/auth/qr`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (qrResponse.ok) {
          const data = await qrResponse.json();
          if (data.qr) {
            qrData = data;
            console.log('[WAHA] ✅ QR obtenido en intento', attempts);
            break;
          }
        } else if (qrResponse.status === 404) {
          // Sesión no encontrada o QR no disponible, seguir intentando
          console.log(`[WAHA] ⏳ Intento ${attempts}: QR no disponible aún`);
        } else {
          const txt = await qrResponse.text();
          console.log(`[WAHA] ⚠️  Intento ${attempts}: ${qrResponse.status} - ${txt}`);
        }
      } catch (e) {
        console.log(`[WAHA] ⚠️  Intento ${attempts}: Error -`, e);
      }
    }

    if (!qrData) {
      console.error('[WAHA] ❌ QR no se generó después de', maxAttempts, 'intentos');
      return res.status(504).json({
        error: 'WAHA_QR_TIMEOUT',
        detail: `El QR no se generó después de ${maxAttempts * 2} segundos. Intenta de nuevo.`
      });
    }

    return res.status(200).json({
      ok: true,
      session: SESSION_NAME,
      qrcode: qrData.qr
    });

  } catch (error: any) {
    console.error('[WAHA] 💥 Error inesperado:', error);
    return res.status(500).json({
      error: 'WAHA_ERROR',
      detail: error.message || 'Error desconocido'
    });
  }
}

