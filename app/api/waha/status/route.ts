/**
 * WAHA Status Route
 * Endpoint para verificar el estado de la sesión de WhatsApp
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || 'https://wpp.galle18k.com';
const KEY = process.env.WAHA_API_KEY!;
const SESS = 'default';

const H = {
  'X-Api-Key': KEY,
};

export async function GET() {
  try {
    const statusRes = await fetch(`${BASE}/api/sessions/${SESS}/status`, {
      headers: H,
      cache: 'no-store',
    });

    if (!statusRes.ok) {
      const detail = await statusRes.text();
      console.error('[WAHA] Status check failed:', statusRes.status, detail);
      return new Response(
        JSON.stringify({
          error: `WAHA_STATUS_${statusRes.status}`,
          detail,
          connected: false,
        }),
        { status: statusRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await statusRes.json();
    console.log('[WAHA] Status:', data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[WAHA] Status error:', error);
    return new Response(
      JSON.stringify({
        error: 'WAHA_STATUS_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error',
        connected: false,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

