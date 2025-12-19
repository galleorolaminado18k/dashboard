// API Route para enviar mensajes con WAHA
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
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'Missing "to" or "text"' });
    }

    if (!base) {
      return res.status(500).json({
        error: 'WAHA_CONFIG_MISSING',
        detail: 'Variables de entorno no configuradas'
      });
    }

    console.log('[WAHA] 📤 Enviando mensaje a:', to);

    const response = await fetch(`${base}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: SESSION_NAME,
        chatId: `${to}@c.us`,
        text
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WAHA] ❌ Error enviando:', data);
      return res.status(response.status).json(data);
    }

    console.log('[WAHA] ✅ Mensaje enviado');
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('[WAHA] Error:', error);
    return res.status(500).json({
      error: 'WAHA_ERROR',
      detail: error.message
    });
  }
}

