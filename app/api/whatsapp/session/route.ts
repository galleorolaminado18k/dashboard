import { NextResponse } from 'next/server'

// ✅ Runtime Edge (permite HTTP desde Vercel HTTPS)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ✅ WAHA_BASE_URL desde variable de entorno (Railway/Vercel)
const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY || '4876d997cc954b7d8b966b9fd4863f73'

console.log('[SESSION] Usando WAHA:', WAHA)

// Helper para fetch con timeout para edge runtime
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  return fetch(url, options)
}

// Helper CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: corsHeaders()
  })
}

/**
 * GET /api/whatsapp/session
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    console.log('[API] Verificando estado de sesión en WAHA:', WAHA)

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    const response = await fetchWithTimeout(`${WAHA}/api/session/default/state?apiKey=${WAHA_API_KEY}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': WAHA_API_KEY,
        'Authorization': `Bearer ${WAHA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[API] Error obteniendo estado:', response.status)
      return NextResponse.json({
        ok: false,
        error: `WAHA_STATE_${response.status}`,
        needsSetup: true,
      }, {
        status: response.status,
        headers: corsHeaders()
      })
    }

    const data = await response.json()
    console.log('[API] Estado de sesión:', data)

    return NextResponse.json({
      ok: true,
      session: {
        name: 'default',
        status: data.state || data.status,
        connected: data.state === 'WORKING' || data.status === 'WORKING',
        needsQR: data.state === 'SCAN_QR_CODE' || data.state === 'STARTING',
      },
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API] Error conectando con WAHA:', error.message || error)
    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: error.message || String(error),
      needsSetup: true,
      wahaUrl: WAHA,
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}

/**
 * POST /api/whatsapp/session
 * Crear o iniciar una nueva sesión en WAHA + Obtener QR
 */
export async function POST() {
  try {
    console.log('[API] Iniciando sesión de WhatsApp en WAHA:', WAHA)

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // 1. Iniciar sesión
    const start = await fetchWithTimeout(`${WAHA}/api/session/default/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY,
      },
    })

    if (!start.ok) {
      throw new Error(`WAHA_START_${start.status}`)
    }

    console.log('[API] Sesión iniciada, esperando QR...')

    // 2. Esperar generación del QR (3 segundos)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 3. Obtener QR
    const qr = await fetchWithTimeout(`${WAHA}/api/session/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_API_KEY,
      },
      cache: 'no-store',
    })

    if (!qr.ok) {
      throw new Error(`WAHA_QR_${qr.status}`)
    }

    const data = await qr.json()
    console.log('[API] QR obtenido exitosamente')

    // Retornar QR directamente (data:image/png;base64,...)
    return NextResponse.json({
      ok: true,
      qr: data.qr,
      message: 'Escanea el código QR con WhatsApp Business',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API] Error fatal:', error.message || error)

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

/**
 * DELETE /api/whatsapp/session
 * Detener y eliminar la sesión
 */
export async function DELETE() {
  try {
    console.log('[API] Deteniendo sesión...')

    // Detener la sesión
    const response = await fetch(`${WAHA}/api/session/default/stop`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Error deteniendo sesión')
    }

    return NextResponse.json({
      ok: true,
      message: 'Sesión detenida correctamente',
    })
  } catch (error: any) {
    console.error('[API] Error deteniendo sesión:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 })
  }
}
