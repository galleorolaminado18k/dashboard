// API Route para enviar mensajes con WPPConnect
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  runtime: 'nodejs',
};

const base = process.env.WPP_BASE_URL || '';
const token = process.env.WPP_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session, phone, message } = req.body;

    if (!session || !phone || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['session', 'phone', 'message']
      });
    }

    if (!base || !token) {
      return res.status(500).json({
        error: 'WPP_CONFIG_MISSING',
        detail: 'Variables de entorno no configuradas'
      });
    }

    console.log('[WPP] 📤 Enviando mensaje');
    console.log('[WPP] 📱 Sesión:', session);
    console.log('[WPP] 📞 Teléfono:', phone);
    console.log('[WPP] 💬 Mensaje:', message.substring(0, 50));

    const response = await fetch(
      `${base}/api/${encodeURIComponent(session)}/send-message`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
          isGroup: false,
        }),
        signal: AbortSignal.timeout(15000), // 15 segundos
      }
    );

    if (!response.ok) {
      const txt = await response.text();
      console.error('[WPP] ❌ Error enviando mensaje:', response.status, txt);
      return res.status(502).json({
        error: `WPP_HTTP_${response.status}`,
        detail: txt
      });
    }

    const data = await response.json();
    console.log('[WPP] ✅ Mensaje enviado:', data);

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('[WPP] ❌ Error:', error);

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'WPP_TIMEOUT',
        detail: 'Timeout enviando mensaje'
      });
    }

    return res.status(500).json({
      error: 'WPP_ERROR',
      detail: error?.message || 'Error desconocido'
    });
  }
}

