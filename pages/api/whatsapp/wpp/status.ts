// API Route para obtener estado de sesión WPPConnect
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
};

const base = process.env.WPP_BASE_URL || '';
const token = process.env.WPP_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session } = req.query;

    if (!session || typeof session !== 'string') {
      return res.status(400).json({ error: 'Session parameter required' });
    }

    if (!base || !token) {
      return res.status(500).json({
        error: 'WPP_CONFIG_MISSING',
        detail: 'Variables de entorno no configuradas'
      });
    }

    console.log('[WPP] 📡 Verificando estado de sesión:', session);

    const response = await fetch(
      `${base}/api/${encodeURIComponent(session)}/status-session`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10000), // 10 segundos
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      console.error('[WPP] ❌ Error en /status-session:', response.status, txt);

      // Si es 404, la sesión no existe
      if (response.status === 404) {
        return res.status(200).json({
          ok: false,
          session,
          status: 'NOT_CREATED',
          connected: false,
          needsQR: true
        });
      }

      return res.status(502).json({
        error: `WPP_HTTP_${response.status}`,
        detail: txt
      });
    }

    const data = await response.json();
    console.log('[WPP] ✅ Estado:', data);

    // Normalizar respuesta
    const isConnected = data?.state === 'CONNECTED' || data?.isLogged === true || data?.status === 'inChat';
    const needsQR = !isConnected;

    return res.status(200).json({
      ok: true,
      session,
      status: data?.state || data?.status || 'UNKNOWN',
      connected: isConnected,
      needsQR,
      raw: data // Incluir datos originales para debugging
    });

  } catch (error: any) {
    console.error('[WPP] ❌ Error:', error);

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'WPP_TIMEOUT',
        detail: 'Timeout verificando estado'
      });
    }

    return res.status(500).json({
      error: 'WPP_ERROR',
      detail: error?.message || 'Error desconocido'
    });
  }
}

