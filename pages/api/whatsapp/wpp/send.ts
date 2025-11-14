// API Route para enviar mensajes con Baileys
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
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'Missing "to" or "text"' });
    }

    if (!base || !apiKey) {
      return res.status(500).json({
        error: 'BAILEYS_CONFIG_MISSING',
        detail: 'Variables de entorno no configuradas'
      });
    }

    console.log('[Baileys] 📤 Enviando mensaje a:', to);

    const response = await fetch(`${base}/sendText`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to, text }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Baileys] ❌ Error enviando:', data);
      return res.status(response.status).json(data);
    }

    console.log('[Baileys] ✅ Mensaje enviado');
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('[Baileys] Error:', error);
    return res.status(500).json({
      error: 'BAILEYS_ERROR',
      detail: error.message
    });
  }
}

