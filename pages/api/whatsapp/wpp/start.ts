// API Route para iniciar sesión y obtener QR con WPPConnect
import type { NextApiRequest, NextApiResponse } from 'next';

// Runtime de Node.js
export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: true,
  },
};

const base = process.env.WPP_BASE_URL || '';
const token = process.env.WPP_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    if (!base || !token) {
      console.error('[WPP] Variables de entorno no configuradas');
      return res.status(500).json({
        error: 'WPP_CONFIG_MISSING',
        detail: 'WPP_BASE_URL o WPP_TOKEN no están configurados en Vercel'
      });
    }

    const session = `galle-${phone}`;

    console.log('[WPP] 🚀 Iniciando sesión:', session);
    console.log('[WPP] 🌐 Base URL:', base);

    // 1) Crear/iniciar sesión
    console.log('[WPP] 📡 POST /api/:session/start');
    const startResponse = await fetch(`${base}/api/${encodeURIComponent(session)}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000), // 30 segundos
    });

    if (!startResponse.ok) {
      const txt = await startResponse.text();
      console.error('[WPP] ❌ Error en /start:', startResponse.status, txt);
      return res.status(502).json({
        error: `WPP_HTTP_${startResponse.status}`,
        detail: txt
      });
    }

    const startData = await startResponse.json();
    console.log('[WPP] ✅ Sesión iniciada:', startData);

    // 2) Esperar un momento para que se genere el QR
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3) Obtener QR code
    console.log('[WPP] 📡 GET /api/:session/qrcode');
    const qrResponse = await fetch(`${base}/api/${encodeURIComponent(session)}/qrcode`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: AbortSignal.timeout(15000), // 15 segundos
    });

    if (!qrResponse.ok) {
      const txt = await qrResponse.text();
      console.error('[WPP] ❌ Error en /qrcode:', qrResponse.status, txt);
      return res.status(502).json({
        error: `WPP_HTTP_${qrResponse.status}`,
        detail: txt
      });
    }

    const qrData = await qrResponse.json();
    console.log('[WPP] ✅ QR obtenido');

    // Normalizar respuesta (puede venir en diferentes formatos)
    const qrcode = qrData?.qrcode || qrData?.qr || qrData?.code || qrData?.base64 || '';

    if (!qrcode) {
      console.error('[WPP] ⚠️  QR vacío, respuesta:', JSON.stringify(qrData).substring(0, 200));
      return res.status(202).json({
        session,
        message: 'Sesión iniciada, esperando QR...',
        needsRetry: true
      });
    }

    return res.status(200).json({
      session,
      qrcode,
      success: true
    });

  } catch (error: any) {
    console.error('[WPP] ❌ Error:', error);

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'WPP_TIMEOUT',
        detail: 'WPPConnect no respondió a tiempo. Verifica que esté corriendo.'
      });
    }

    if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'WPP_UNREACHABLE',
        detail: `No se puede conectar a WPPConnect en ${base}. Verifica la URL y que el servicio esté corriendo.`
      });
    }

    return res.status(500).json({
      error: 'WPP_ERROR',
      detail: error?.message || 'Error desconocido'
    });
  }
}

