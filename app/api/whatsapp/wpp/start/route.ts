/**
 * API Route para iniciar sesión WAHA y obtener QR
 * Fix para error 401 Unauthorized
 * Incluye múltiples variantes de headers para máxima compatibilidad
 */

export const runtime = 'nodejs';              // ← Evita Edge, usa Node.js
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || '';
const KEY = process.env.WAHA_API_KEY || '';
const SESS = 'default';

// Función que genera headers con todas las variantes posibles
function H() {
  return new Headers({
    'Content-Type': 'application/json',
    'X-Api-Key': KEY,              // mayúsculas (estándar WAHA)
    'x-api-key': KEY,              // minúsculas (por si el proxy normaliza)
    'Authorization': `Api-Key ${KEY}`, // fallback (algunas distros de WAHA)
  });
}

export async function POST() {
  try {
    // Validar que tenemos las credenciales
    if (!BASE || !KEY) {
      console.error('[WAHA] Variables no configuradas:', {
        hasBase: Boolean(BASE),
        hasKey: Boolean(KEY)
      });
      return new Response(
        JSON.stringify({
          error: 'WAHA_CONFIG_MISSING',
          detail: 'WAHA_BASE_URL o WAHA_API_KEY no configuradas en Vercel'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[WAHA] 🚀 Iniciando sesión...');
    console.log('[WAHA] Base URL:', BASE);
    console.log('[WAHA] API Key presente:', Boolean(KEY));

    // 1) Start session (idempotente: 200/201/409 son válidos)
    console.log('[WAHA] 📡 POST /api/sessions/${SESS}/start');
    const startRes = await fetch(`${BASE}/api/sessions/${SESS}/start`, {
      method: 'POST',
      headers: H(),
    });

    if (!startRes.ok && startRes.status !== 409) {
      const errorText = await startRes.text();
      console.error('[WAHA] ❌ Start failed:', startRes.status, errorText);
      return new Response(
        JSON.stringify({
          error: `WAHA_START_${startRes.status}`,
          detail: errorText
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (startRes.status === 409) {
      console.log('[WAHA] ℹ️  Sesión ya existe (409), continuando...');
    } else {
      console.log('[WAHA] ✅ Sesión iniciada:', startRes.status);
    }

    // 2) Get QR (puede tardar unos segundos)
    console.log('[WAHA] 📡 GET /api/${SESS}/auth/qr');

    // Intentar obtener el QR hasta 3 veces con delay
    let qrData = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !qrData) {
      attempts++;

      if (attempts > 1) {
        // Esperar 2 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const qrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
        headers: H(),
        cache: 'no-store'
      });

      if (qrRes.ok) {
        const qrJson = await qrRes.json().catch(() => ({}));

        if (qrJson?.qrcode) {
          qrData = qrJson;
          console.log('[WAHA] ✅ QR obtenido en intento', attempts);
          break;
        }
      } else {
        console.log(`[WAHA] ⚠️  Intento ${attempts}: Status ${qrRes.status}`);
      }
    }

    if (!qrData || !qrData.qrcode) {
      const qrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
        headers: H(),
        cache: 'no-store'
      });

      const qrJson = await qrRes.json().catch(() => ({}));

      console.error('[WAHA] ❌ No QR code:', qrRes.status, qrJson);
      return new Response(
        JSON.stringify({
          error: `WAHA_QR_${qrRes.status}`,
          detail: qrJson
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[WAHA] ✅ Retornando QR code');
    return new Response(
      JSON.stringify({ qrcode: qrData.qrcode }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[WAHA] 💥 Error inesperado:', error);
    return new Response(
      JSON.stringify({
        error: 'WAHA_INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Endpoint de debug para verificar configuración
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      hasKey: Boolean(process.env.WAHA_API_KEY),
      hasBase: Boolean(process.env.WAHA_BASE_URL),
      base: process.env.WAHA_BASE_URL || 'NOT_SET',
      keyLength: process.env.WAHA_API_KEY?.length || 0,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

