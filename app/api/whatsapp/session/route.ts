import { NextResponse } from 'next/server'

// ✅ FIX PRODUCCIÓN DEFINITIVO: Cloudflare Tunnel o ngrok
// En desarrollo: http://127.0.0.1:3000
// En producción: https://xxxxx.trycloudflare.com (o ngrok)
const WAHA_URL = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'

// Timeout para evitar colgarse (30 segundos)
const FETCH_TIMEOUT = 30000

// Helper para fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
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
    console.log('[API] Verificando estado de sesión en WAHA:', WAHA_URL)

    if (!WAHA_URL || WAHA_URL === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    const response = await fetchWithTimeout(`${WAHA_URL}/api/session/default/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
      wahaUrl: WAHA_URL,
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
    console.log('[API] Iniciando sesión de WhatsApp en WAHA:', WAHA_URL)

    if (!WAHA_URL || WAHA_URL === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // 1. Iniciar sesión
    const startResponse = await fetchWithTimeout(`${WAHA_URL}/api/session/default/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!startResponse.ok) {
      const errorText = await startResponse.text()
      console.error('[API] Error de WAHA al iniciar:', errorText)
      throw new Error(`WAHA_START_${startResponse.status}`)
    }

    console.log('[API] Sesión iniciada, obteniendo QR...')

    // 2. Esperar un momento para que genere el QR
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 3. Obtener QR
    const qrResponse = await fetchWithTimeout(`${WAHA_URL}/api/session/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!qrResponse.ok) {
      throw new Error(`WAHA_QR_${qrResponse.status}`)
    }

    const qrData = await qrResponse.json()
    console.log('[API] QR obtenido exitosamente')

    return NextResponse.json({
      ok: true,
      qr: qrData.qr,
      message: 'Sesión iniciada. Escanea el código QR con WhatsApp Business.',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API] Error fatal:', error.message || error)
    console.error('[API] WAHA_URL configurada:', WAHA_URL)

    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: error.message || String(error),
      hint: 'En producción: configura WAHA_BASE_URL con Cloudflare Tunnel (https://xxxxx.trycloudflare.com)',
      wahaUrl: WAHA_URL,
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
    const response = await fetch(`${WAHA_URL}/api/session/default/stop`, {
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

