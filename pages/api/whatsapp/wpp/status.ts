// API Route para obtener estado de sesión WAHA
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
};

const base = process.env.WAHA_BASE_URL || '';
const SESSION_NAME = 'default';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!base) {
      return res.status(500).json({
        error: 'WAHA_CONFIG_MISSING',
        detail: 'WAHA_BASE_URL no configurada'
      });
    }

    console.log('[WAHA] 📡 Verificando estado de sesión...');

    const response = await fetch(`${base}/api/${SESSION_NAME}/status`, {
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    return res.status(response.ok ? 200 : 502).json(data);

  } catch (error: any) {
    console.error('[WAHA] Error:', error);
    return res.status(500).json({
      error: 'WAHA_ERROR',
      detail: error.message
    });
  }
}

