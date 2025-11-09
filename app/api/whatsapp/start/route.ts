import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY // OPCIONAL - Solo funciona en WAHA Plus, no en CORE/WEBJS

console.log('[START] Usando WAHA:', WAHA)
console.log('[START] API Key configurada:', WAHA_API_KEY ? 'SI (solo funciona en Plus)' : 'NO (modo CORE/WEBJS - proteger con firewall)')
console.log('[START] IMPORTANTE: WAHA CORE/WEBJS no soporta X-Api-Key, devuelve 422. Usar firewall para proteger.')

// Helper CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: corsHeaders()
  })
}

/**
 * POST /api/whatsapp/start
 * Iniciar sesión de WhatsApp en WAHA
 */
export async function POST() {
  try {
    console.log('[START] Iniciando sesión en WAHA:', WAHA)
    console.log('[START] Entorno:', process.env.VERCEL ? 'Vercel' : 'Local')

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // NOTA: API Key NO funciona en WAHA CORE/WEBJS (devuelve 422)
    // Solo funciona en WAHA Plus. Proteger con firewall en su lugar.

    // Detectar si estamos en Vercel/producción sin WAHA configurado
    const isLocalhost = WAHA.includes('127.0.0.1') || WAHA.includes('localhost')
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'

    if (isLocalhost && isProduction) {
      return NextResponse.json({
        ok: false,
        error: 'WAHA_NOT_CONFIGURED_PRODUCTION',
        detail: 'WAHA no está configurado para producción. Estás en Vercel intentando conectar a localhost (127.0.0.1:3000) que no existe.',
        solution: 'Opciones:\n1. Desarrollo Local: Ejecuta "docker-compose -f docker-compose.waha.yml up -d" y abre http://localhost:3000\n2. Producción: Despliega WAHA en VPS con docker-compose y configura WAHA_BASE_URL en Vercel',
        guide: 'https://waha.devlike.pro/docs/how-to/deploy/',
        currentUrl: WAHA,
      }, {
        status: 503,
        headers: corsHeaders()
      })
    }

    // Verificar disponibilidad de WAHA primero
    console.log('[START] Verificando disponibilidad de WAHA...')
    try {
      const healthCheck = await fetch(`${WAHA}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      })

      if (!healthCheck.ok) {
        console.error('[START] WAHA no responde correctamente')
        return NextResponse.json({
          ok: false,
          error: 'WAHA_UNAVAILABLE',
          detail: `WAHA no está disponible en ${WAHA}. El servidor respondió con status ${healthCheck.status}.`,
          solution: isLocalhost
            ? 'Ejecuta: docker-compose -f docker-compose.waha.yml up -d'
            : 'Verifica que WAHA esté corriendo en tu servidor',
        }, {
          status: 503,
          headers: corsHeaders()
        })
      }
      console.log('[START] ✅ WAHA está disponible')
    } catch (healthError: any) {
      console.error('[START] Error conectando con WAHA:', healthError.message)
      return NextResponse.json({
        ok: false,
        error: 'WAHA_UNREACHABLE',
        detail: `No se puede conectar con WAHA en ${WAHA}. Error: ${healthError.message}`,
        solution: isLocalhost
          ? '1. Ejecuta: docker-compose -f docker-compose.waha.yml up -d\n2. Verifica con: docker ps | findstr waha'
          : '1. Verifica que WAHA_BASE_URL sea correcta\n2. Verifica que WAHA esté corriendo\n3. Verifica el firewall/CORS',
        wahaUrl: WAHA,
      }, {
        status: 503,
        headers: corsHeaders()
      })
    }

    // Iniciar sesión en WAHA
    // IMPORTANTE: Endpoints correctos según logs de WAHA
    // - POST /api/sessions/:session/start (plural "sessions")
    // - GET /api/:session/auth/qr
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // API Key OPCIONAL - Solo funciona en WAHA Plus, no en CORE/WEBJS
    // CORE/WEBJS devuelve 422 si intentas usar X-Api-Key
    // Proteger con firewall en su lugar
    if (WAHA_API_KEY) {
      // Solo agregar si está configurada Y no estamos en CORE/WEBJS
      // headers['X-Api-Key'] = WAHA_API_KEY
      console.log('[START] API Key disponible pero NO se usa (WAHA CORE/WEBJS no la soporta)')
    } else {
      console.log('[START] Sin API Key (proteger con firewall)')
    }

    const sessionConfig = {
      name: 'default',
      config: {
        proxy: null,
        webhooks: [],
      }
    }

    // Intentar START (endpoint correcto: /api/sessions/ con 's')
    let response = await fetch(`${WAHA}/api/sessions/default/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sessionConfig)
    })

    console.log('[START] Status de /api/sessions/default/start:', response.status)

    // Si 404, la ruta no existe
    if (!response.ok && response.status === 404) {
      console.log('[START] Endpoint /api/sessions/default/start no encontrado')
      // No intentar /create ya que el endpoint correcto es /api/sessions/
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[START] Error iniciando sesión:', response.status, errorText)

      // Si ya está iniciada (409), es OK
      if (response.status === 409) {
        return NextResponse.json({
          ok: true,
          message: 'Sesión ya iniciada',
          alreadyStarted: true,
        }, {
          headers: corsHeaders()
        })
      }

      // Error 422 - Feature no disponible en CORE/WEBJS
      if (response.status === 422) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_FEATURE_NOT_AVAILABLE',
          detail: 'WAHA CORE/WEBJS no soporta autenticación con API Key. Esta feature solo está disponible en WAHA Plus.',
          wahaUrl: WAHA,
          suggestion: 'Opciones:\n1. Usar WAHA sin API Key y proteger con firewall\n2. Actualizar a WAHA Plus para usar autenticación\n3. Cambiar motor a BAILEYS',
        }, {
          status: 422,
          headers: corsHeaders()
        })
      }

      // Error 401 - problema de autenticación
      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_AUTH_FAILED',
          detail: 'WAHA rechazó la petición. Si estás usando CORE/WEBJS, NO envíes API Key (devuelve 401/422).',
          wahaUrl: WAHA,
          suggestion: 'Verifica que:\n1. NO estés enviando X-Api-Key en CORE/WEBJS\n2. WAHA esté escuchando en 0.0.0.0 (no en [::1])\n3. El firewall permita conexiones al puerto 3000',
        }, {
          status: 401,
          headers: corsHeaders()
        })
      }

      // Error 403 - problema de autenticación
      if (response.status === 403) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_AUTH_FAILED',
          detail: 'Error de autenticación con WAHA. La API key no es válida.',
          wahaUrl: WAHA,
          suggestion: 'Si estás en Vercel, asegúrate de que WAHA_BASE_URL apunte a una URL pública HTTPS y que WAHA_API_KEY sea correcta.',
        }, {
          status: 403,
          headers: corsHeaders()
        })
      }

      return NextResponse.json({
        ok: false,
        error: `WAHA_START_${response.status}`,
        detail: errorText,
      }, {
        status: response.status,
        headers: corsHeaders()
      })
    }

    const data = await response.json()
    console.log('[START] Sesión iniciada:', data)

    return NextResponse.json({
      ok: true,
      message: 'Sesión iniciada correctamente',
      data,
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[START] Error fatal:', error.message || error)

    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: error.message || String(error),
      wahaUrl: WAHA || 'undefined',
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}
