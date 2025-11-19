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

// Función que genera headers - WAHA 2025.11.2 solo acepta X-Api-Key
function H() {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Api-Key': KEY,  // WAHA requiere exactamente este header
  });

  console.log('[WAHA] Headers enviados:', {
    'X-Api-Key': KEY.substring(0, 10) + '...' + KEY.substring(KEY.length - 4),
    'Content-Type': 'application/json'
  });

  return headers;
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
    console.log('[WAHA] API Key (primeros 10 chars):', KEY.substring(0, 10) + '...');
    console.log('[WAHA] API Key length:', KEY.length);

    // 1) Start session (idempotente: 200/201/409 son válidos)
    console.log('[WAHA] 📡 POST', `${BASE}/api/sessions/${SESS}/start`);

    let startRes;
    try {
      startRes = await fetch(`${BASE}/api/sessions/${SESS}/start`, {
        method: 'POST',
        headers: H(),
        signal: AbortSignal.timeout(15000), // 15 segundos timeout
      });
    } catch (fetchError) {
      console.error('[WAHA] ❌ Error de conexión al intentar start session:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'WAHA_CONNECTION_ERROR',
          detail: `No se pudo conectar con WAHA en ${BASE}. Verifica que esté corriendo.`,
          technicalDetails: fetchError instanceof Error ? fetchError.message : String(fetchError),
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Aceptar 200, 201, 409 (ya existe) y 422 (ya iniciada) como válidos
    if (!startRes.ok && startRes.status !== 409 && startRes.status !== 422) {
      const errorText = await startRes.text();
      console.error('[WAHA] ❌ Start failed:', startRes.status, errorText);
      console.error('[WAHA] Response headers:', Object.fromEntries(startRes.headers.entries()));

      // Si es 401, dar información específica
      if (startRes.status === 401) {
        return new Response(
          JSON.stringify({
            error: 'WAHA_START_401',
            detail: 'API Key rechazada por WAHA. Verificar que Caddy esté reenviando el header X-Api-Key correctamente.',
            debugInfo: {
              apiKeyUsed: KEY.substring(0, 10) + '...' + KEY.substring(KEY.length - 4),
              endpoint: `${BASE}/api/sessions/${SESS}/start`,
              wahaResponse: errorText
            }
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

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

    if (startRes.status === 409 || startRes.status === 422) {
      console.log('[WAHA] ℹ️  Sesión ya existe (status:', startRes.status, '), continuando a obtener QR...');
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
        console.log(`[WAHA] ⏳ Esperando 2 segundos antes del intento ${attempts}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`[WAHA] 🔄 Intento ${attempts}/${maxAttempts} para obtener QR...`);

      try {
        const qrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
          headers: H(),
          cache: 'no-store',
          signal: AbortSignal.timeout(10000), // 10 segundos timeout por intento
        });

        console.log(`[WAHA] 📊 Respuesta QR intento ${attempts}: Status ${qrRes.status}`);

        if (qrRes.ok) {
          const qrJson = await qrRes.json().catch((e) => {
            console.error(`[WAHA] ⚠️  Error parseando JSON en intento ${attempts}:`, e);
            return {};
          });

          if (qrJson?.qrcode) {
            qrData = qrJson;
            console.log('[WAHA] ✅ QR obtenido exitosamente en intento', attempts);
            break;
          } else {
            console.log(`[WAHA] ⚠️  Intento ${attempts}: Respuesta OK pero sin qrcode`, qrJson);
          }
        } else {
          const errorText = await qrRes.text().catch(() => 'No se pudo leer el error');
          console.log(`[WAHA] ⚠️  Intento ${attempts}: Status ${qrRes.status} - ${errorText.substring(0, 100)}`);
        }
      } catch (fetchError) {
        console.error(`[WAHA] ❌ Error en intento ${attempts}:`, fetchError instanceof Error ? fetchError.message : String(fetchError));
      }
    }

    if (!qrData || !qrData.qrcode) {
      console.error('[WAHA] ❌ No se pudo obtener QR después de', maxAttempts, 'intentos');

      // Hacer un último intento para obtener información de error
      let errorDetail = 'No se pudo obtener el código QR después de múltiples intentos.';
      let lastStatus = 0;

      try {
        const qrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
          headers: H(),
          cache: 'no-store'
        });

        lastStatus = qrRes.status;

        if (!qrRes.ok) {
          const errorText = await qrRes.text();
          errorDetail = `WAHA respondió con status ${qrRes.status}: ${errorText}`;
        }
      } catch (e) {
        errorDetail = `Error de conexión: ${e instanceof Error ? e.message : String(e)}`;
      }

      console.error('[WAHA] ❌ Error detail:', errorDetail);

      return new Response(
        JSON.stringify({
          error: 'WAHA_QR_NOT_AVAILABLE',
          detail: errorDetail,
          status: lastStatus,
          suggestion: 'Intenta reiniciar la sesión en WAHA o verifica los logs del servidor.'
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

