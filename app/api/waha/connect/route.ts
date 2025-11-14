/**
 * WAHA (WhatsApp HTTP API) Route
 * Endpoint para conectar WhatsApp y obtener código QR
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || 'https://wpp.galle18k.com';
const KEY = process.env.WAHA_API_KEY!;
const SESS = 'default';

const H = {
  'Content-Type': 'application/json',
  'X-Api-Key': KEY,
};

export async function POST() {
  try {
    // 1) Start session (idempotente: 200/201/409 son válidos)
    console.log('[WAHA] Starting session:', SESS);
    const startRes = await fetch(`${BASE}/api/sessions/${SESS}/start`, {
      method: 'POST',
      headers: H,
    });

    if (!startRes.ok && startRes.status !== 409) {
      const detail = await startRes.text();
      console.error('[WAHA] Start session failed:', startRes.status, detail);
      return new Response(
        JSON.stringify({
          error: `WAHA_START_${startRes.status}`,
          detail,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WAHA] Session started:', startRes.status);

    // 2) Pedir QR (puede tardar 1-2s después de start)
    // Intentar hasta 3 veces con delay
    let qrData = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !qrData) {
      attempts++;
      console.log(`[WAHA] Requesting QR code (attempt ${attempts}/${maxAttempts})`);

      const qrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
        headers: H,
        cache: 'no-store',
      });

      const jsonData = await qrRes.json().catch(() => ({}));

      if (!qrRes.ok) {
        console.error('[WAHA] QR request failed:', qrRes.status, jsonData);
        if (attempts >= maxAttempts) {
          return new Response(
            JSON.stringify({
              error: `WAHA_QR_${qrRes.status}`,
              detail: jsonData,
            }),
            { status: 502, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Wait 1 second before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      if (jsonData?.qrcode) {
        qrData = jsonData.qrcode;
        break;
      }

      // Wait 1 second before retry
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!qrData) {
      console.error('[WAHA] No QR code received after', maxAttempts, 'attempts');
      return new Response(
        JSON.stringify({
          error: 'WAHA_QR_EMPTY',
          detail: 'No se pudo obtener el código QR',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WAHA] QR code received successfully');

    return new Response(
      JSON.stringify({ qrcode: qrData }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[WAHA] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'WAHA_INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

