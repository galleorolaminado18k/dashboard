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
      return res.status(200).json({
        ok: true,
        isConnected: false,
        connected: false,
        hasQR: false,
        error: 'GATEWAY_NOT_CONFIGURED',
        detail: 'BAILEYS_GATEWAY_URL no configurada',
        gatewayAvailable: false,
      });
    }

    console.log('[WA-STATUS] 📡 Verificando estado en:', GATEWAY_URL);

    const response = await fetch(`${GATEWAY_URL}/status`, {
      signal: AbortSignal.timeout(8000), // Reducir timeout
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    // Mapear respuesta al formato esperado por el frontend
    return res.status(200).json({
      ok: true,
      isConnected: data.isConnected ?? false,
      connected: data.isConnected ?? false, // alias para compatibilidad
      hasQR: data.hasQR ?? false,
      error: data.error || null,
      lastUpdate: data.lastUpdate || null,
      gatewayAvailable: true,
    });

  } catch (error: any) {
    console.error('[WA-STATUS] Error conectando al Gateway:', error.message);

    // En caso de error de conexión, devolver estado "desconocido" en vez de error 500
    // Esto permite que el frontend use su caché local
    return res.status(200).json({
      ok: true,
      isConnected: null, // null = desconocido (usar caché local)
      connected: null,
      hasQR: false,
      error: 'GATEWAY_UNREACHABLE',
      detail: `No se pudo conectar al Gateway: ${error.message}`,
      gatewayAvailable: false,
    });
  }
}
