// API Route para obtener estado de sesión Baileys
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
};

const base = process.env.BAILEYS_BASE_URL || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!base) {
      return res.status(500).json({
        error: 'BAILEYS_CONFIG_MISSING',
        detail: 'BAILEYS_BASE_URL no configurada'
      });
    }

    console.log('[Baileys] 📡 Verificando estado...');

    const response = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    return res.status(response.ok ? 200 : 502).json(data);

  } catch (error: any) {
    console.error('[Baileys] Error:', error);
    return res.status(500).json({
      error: 'BAILEYS_ERROR',
      detail: error.message
    });
  }
}

