/**
 * API Route para iniciar sesión WAHA y obtener QR
 * Fix para error 401 Unauthorized
 * Incluye múltiples variantes de headers para máxima compatibilidad
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Antes: WAHA. Ahora usamos el gateway local/externo basado en Baileys
const GATEWAY = (process.env.WHATSAPP_GATEWAY_URL || '').replace(/\/+$/, '');
console.log('[WH-GATEWAY] URL:', GATEWAY);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function proxyGetQr() {
  if (!GATEWAY) throw new Error('WHATSAPP_GATEWAY_URL_MISSING');
  const res = await fetch(`${GATEWAY}/qr`, { cache: 'no-store' });
  const txt = await res.text();
  try { return { status: res.status, body: JSON.parse(txt) }; } catch { return { status: res.status, body: txt }; }
}

async function proxyGetStatus() {
  if (!GATEWAY) throw new Error('WHATSAPP_GATEWAY_URL_MISSING');
  const res = await fetch(`${GATEWAY}/status`, { cache: 'no-store' });
  const txt = await res.text();
  try { return { status: res.status, body: JSON.parse(txt) }; } catch { return { status: res.status, body: txt }; }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET -> debug/info or status
export async function GET() {
  try {
    if (!GATEWAY) {
      return new Response(JSON.stringify({ ok: false, error: 'WHATSAPP_GATEWAY_URL not set' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    const s = await proxyGetStatus();
    return new Response(JSON.stringify({ ok: true, gatewayStatus: s.body }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[WH-GATEWAY] GET error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}

// POST -> obtener QR (inicia/revisa el gateway internamente)
export async function POST() {
  try {
    if (!GATEWAY) {
      return new Response(JSON.stringify({ ok: false, error: 'WHATSAPP_GATEWAY_URL not set' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Llamamos al gateway para pedir el QR/state
    const qr = await proxyGetQr();

    if (qr.status >= 200 && qr.status < 300) {
      // Responder con el body tal cual vino del gateway
      return new Response(JSON.stringify(qr.body), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    // Propagar error del gateway
    return new Response(JSON.stringify({ ok: false, gatewayStatus: qr.status, detail: qr.body }), { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[WH-GATEWAY] POST error:', error);
    return new Response(JSON.stringify({ ok: false, error: 'GATEWAY_PROXY_ERROR', detail: String(error) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}
