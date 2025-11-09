import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY || '4876d997cc954b7d8b966b9fd4863f73'

console.log('[START] Usando WAHA:', WAHA)

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

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // Detectar si estamos en Vercel/producción sin WAHA configurado
    if (WAHA.includes('127.0.0.1') || WAHA.includes('localhost')) {
      const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'
      if (isProduction) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_NOT_CONFIGURED_PRODUCTION',
          detail: 'WAHA no está configurado para producción. Necesitas desplegar WAHA en un VPS o servicio externo (Railway, DigitalOcean, etc.) y configurar la variable de entorno WAHA_BASE_URL con la URL pública HTTPS.',
          guide: 'Ver: https://waha.devlike.pro/docs/how-to/deploy/ para opciones de despliegue',
        }, {
          status: 503,
          headers: corsHeaders()
        })
      }
    }

    // Iniciar sesión en WAHA
    const response = await fetch(`${WAHA}/api/sessions/default/start`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WAHA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: 'default',
        config: {
          proxy: null,
          webhooks: [],
        }
      })
    })

    console.log('[START] Status de inicio:', response.status)

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

      // Error 403 - problema de autenticación
      if (response.status === 403) {
        return NextResponse.json({
          ok: false,
          error: 'WAHA_AUTH_FAILED',
          detail: 'Error de autenticación con WAHA. Verifica que la API key sea correcta y que WAHA esté configurado para aceptar conexiones externas.',
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

