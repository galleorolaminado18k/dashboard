/**
 * API Route para iniciar sesión WAHA y obtener QR
 * Fix para error 401 Unauthorized
 * Incluye múltiples variantes de headers para máxima compatibilidad
 */

export const runtime = 'nodejs';              // ← Evita Edge, usa Node.js
export const dynamic = 'force-dynamic';

const BASE = process.env.WAHA_BASE_URL?.replace(/\/+$/, '') || '';
const KEY = process.env.WAHA_API_KEY || '';
const SESS = process.env.WAHA_SESSION_NAME || 'default';
console.log('[WAHA] SESSION NAME:', SESS);

// Headers CORS para evitar error 403 permission
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

// Función para asegurar que la sesión exista en WAHA; crea la sesión si GET devuelve 404
async function ensureSession() {
  if (!BASE) throw new Error('WAHA_BASE_URL_MISSING')
  const sessionsBase = `${BASE}/api/sessions`;
  try {
    const getRes = await fetch(`${sessionsBase}/${SESS}`, { headers: H() });
    if (getRes.status === 404) {
      console.log('[WAHA] Sesión no encontrada, creando sesión:', SESS);
      const createRes = await fetch(sessionsBase, {
        method: 'POST',
        headers: H(),
        body: JSON.stringify({ name: SESS })
      });
      if (!createRes.ok) {
        const body = await createRes.text().catch(() => '');
        throw new Error(`WAHA_CREATE_FAILED: ${createRes.status} ${body}`);
      }
      console.log('[WAHA] Sesión creada con éxito:', SESS);
    } else if (!getRes.ok) {
      const body = await getRes.text().catch(() => '');
      throw new Error(`WAHA_GET_FAILED: ${getRes.status} ${body}`);
    } else {
      // session exists
      console.log('[WAHA] Sesión existe:', SESS);
    }
  } catch (err) {
    console.error('[WAHA] Error verificando/creando sesión:', err);
    throw err;
  }
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
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[WAHA] 🚀 Iniciando sesión...');
    console.log('[WAHA] Base URL:', BASE);
    console.log('[WAHA] API Key presente:', Boolean(KEY));

    // Asegurar que la sesión exista antes de intentar start (evita 404 Session not found)
    try {
      await ensureSession();
    } catch (e) {
      console.error('[WAHA] ensureSession failed:', e);
      return new Response(JSON.stringify({ error: 'WAHA_SESSION_SETUP_FAILED', detail: String(e) }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

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
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
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
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
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
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar el estado actual de la sesión ANTES de hacer logout
    console.log('[WAHA] 🔍 Verificando estado de la sesión...');

    try {
      const statusRes = await fetch(`${BASE}/api/sessions/${SESS}`, {
        headers: H(),
      });

      if (statusRes.ok) {
        const sessionData = await statusRes.json();
        console.log('[WAHA] 📊 Estado de sesión:', sessionData.status);

        // Si la sesión está WORKING (conectada), hacer logout
        if (sessionData.status === 'WORKING') {
          console.log('[WAHA] ℹ️  Sesión conectada detectada, haciendo logout...');

          const logoutRes = await fetch(`${BASE}/api/sessions/${SESS}/logout`, {
            method: 'POST',
            headers: H(),
          });

          if (logoutRes.ok) {
            console.log('[WAHA] ✅ Logout exitoso');
            // Esperar a que la sesión se detenga
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
    } catch (statusError) {
      console.log('[WAHA] ⚠️  No se pudo verificar estado:', statusError);
      // Continuar de todos modos
    }

    if (startRes.status === 409 || startRes.status === 422) {
      console.log('[WAHA] ℹ️  Sesión ya existe (status:', startRes.status, '), reiniciando...');

      // Detener la sesión primero
      try {
        const stopRes = await fetch(`${BASE}/api/sessions/${SESS}/stop`, {
          method: 'POST',
          headers: H(),
        });

        if (stopRes.ok) {
          console.log('[WAHA] ✅ Sesión detenida');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Reiniciar sesión
        console.log('[WAHA] 🔄 Reiniciando sesión...');
        const restartRes = await fetch(`${BASE}/api/sessions/${SESS}/start`, {
          method: 'POST',
          headers: H(),
        });

        if (restartRes.ok) {
          console.log('[WAHA] ✅ Sesión reiniciada exitosamente');
          // Esperar a que la sesión entre en estado SCAN_QR_CODE
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (restartError) {
        console.error('[WAHA] ⚠️  Error en reinicio:', restartError);
      }
    } else {
      console.log('[WAHA] ✅ Sesión iniciada:', startRes.status);
      // Esperar a que la sesión esté lista para generar QR
      await new Promise(resolve => setTimeout(resolve, 3000));
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

      // Intentar eliminar la sesión corrupta y reiniciar
      console.log('[WAHA] 🔄 Intentando eliminar sesión corrupta...');

      try {
        // Eliminar la sesión completamente
        const deleteRes = await fetch(`${BASE}/api/sessions/${SESS}`, {
          method: 'DELETE',
          headers: H(),
        });

        if (deleteRes.ok) {
          console.log('[WAHA] ✅ Sesión eliminada, esperando 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Crear nueva sesión
          const createRes = await fetch(`${BASE}/api/sessions`, {
            method: 'POST',
            headers: H(),
            body: JSON.stringify({ name: SESS }),
          });

          if (createRes.ok) {
            console.log('[WAHA] ✅ Nueva sesión creada, esperando 2 segundos...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Iniciar la nueva sesión
            const startNewRes = await fetch(`${BASE}/api/sessions/${SESS}/start`, {
              method: 'POST',
              headers: H(),
            });

            if (startNewRes.ok) {
              console.log('[WAHA] ✅ Sesión nueva iniciada, esperando 5 segundos...');
              await new Promise(resolve => setTimeout(resolve, 5000));

              // Intentar obtener QR una vez más
              const finalQrRes = await fetch(`${BASE}/api/${SESS}/auth/qr`, {
                headers: H(),
                cache: 'no-store'
              });

              if (finalQrRes.ok) {
                const finalQrJson = await finalQrRes.json().catch(() => ({}));
                if (finalQrJson?.qrcode) {
                  console.log('[WAHA] ✅ QR obtenido después de recrear sesión!');
                  return new Response(
                    JSON.stringify({ qrcode: finalQrJson.qrcode }),
                    {
                      status: 200,
                      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                    }
                  );
                }
              }
            }
          }
        }
      } catch (recreateError) {
        console.error('[WAHA] ⚠️  Error al recrear sesión:', recreateError);
      }

      // Si llegamos aquí, falló completamente
      let errorDetail = 'No se pudo obtener el código QR. Intenta ejecutar el script de limpieza en el VPS.';
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
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[WAHA] ✅ Retornando QR code');
    return new Response(
      JSON.stringify({ qrcode: qrData.qrcode }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
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
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handler OPTIONS para CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
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
