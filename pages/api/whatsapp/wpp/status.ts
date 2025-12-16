// API Route para obtener estado de sesión WhatsApp (Baileys Gateway)
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
};

// Usa BAILEYS_GATEWAY_URL (nuevo) o WAHA_BASE_URL (legacy)
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || process.env.WAHA_BASE_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!GATEWAY_URL) {
      return res.status(500).json({
        error: 'GATEWAY_CONFIG_MISSING',
        detail: 'BAILEYS_GATEWAY_URL no configurada en Vercel'
      });
    }

    console.log('[WA-STATUS] 📡 Verificando estado en:', GATEWAY_URL);

    const response = await fetch(`${GATEWAY_URL}/status`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    // Mapear respuesta al formato esperado por el frontend
    return res.status(200).json({
      ok: data.ok ?? true,
      isConnected: data.isConnected ?? false,
      hasQR: data.hasQR ?? false,
      error: data.error || null,
      lastUpdate: data.lastUpdate || null,
    });

  } catch (error: any) {
    console.error('[WA-STATUS] Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'GATEWAY_ERROR',
      detail: error.message,
      isConnected: false,
    });
  }
}
