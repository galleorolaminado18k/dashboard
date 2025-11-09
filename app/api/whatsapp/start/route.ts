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
    console.log('[START] Entorno:', process.env.VERCEL ? 'Vercel' : 'Local')

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // Detectar si estamos en Vercel/producción sin WAHA configurado
    const isLocalhost = WAHA.includes('127.0.0.1') || WAHA.includes('localhost')
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'

    if (isLocalhost && isProduction) {
      return NextResponse.json({
        ok: false,
        error: 'WAHA_NOT_CONFIGURED_PRODUCTION',
        detail: '🚨 WAHA no está configurado para producción. Estás en Vercel intentando conectar a localhost (127.0.0.1:3000) que no existe.',
        solution: 'Opciones:\n1. Desarrollo Local: Ejecuta "docker-compose -f docker-compose.waha.yml up -d"\n2. Producción: Despliega WAHA en VPS/Railway y configura WAHA_BASE_URL en Vercel',
        guide: 'https://waha.devlike.pro/docs/how-to/deploy/',
      }, {
        status: 503,
        headers: corsHeaders()
      })
    }

    // Iniciar sesión en WAHA
    // WAHA por defecto NO requiere autenticación, solo enviar headers si está configurada
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Solo agregar API key si está configurada explícitamente (no usar el fallback)
    if (process.env.WAHA_API_KEY) {
      headers['X-Api-Key'] = process.env.WAHA_API_KEY
    }

    console.log('[START] Headers:', Object.keys(headers))

    const response = await fetch(`${WAHA}/api/sessions/default/start`, {
      method: 'POST',
      headers,
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

