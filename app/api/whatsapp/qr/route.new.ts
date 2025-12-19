import { NextResponse } from 'next/server'

// ✅ Runtime Node.js serverless (mejor para timeouts largos)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ WAHA_BASE_URL desde variable de entorno (Railway/Vercel)
const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'

// Timeout para evitar colgarse (60 segundos)
const FETCH_TIMEOUT = 60000

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
 * GET /api/whatsapp/qr
 * Obtener código QR REAL de WhatsApp Web desde WAHA
 */
export async function GET() {
  try {
    console.log('[API QR] Solicitando QR a WAHA:', WAHA)

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    const response = await fetchWithTimeout(`${WAHA}/api/session/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`WAHA_QR_${response.status}`)
    }

    const data = await response.json()
    console.log('[API QR] QR recibido de WAHA')

    if (!data.qr) {
      console.warn('[API QR] No hay QR en la respuesta:', data)
      return NextResponse.json({
        ok: false,
        error: 'QR no disponible. La sesión puede estar ya conectada.',
        currentState: data.state || 'UNKNOWN',
      }, {
        status: 404,
        headers: corsHeaders()
      })
    }

    return NextResponse.json({
      ok: true,
      qr: data.qr,
      message: 'Escanea este código QR con tu WhatsApp Business',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API QR] Error fatal:', error.message || error)

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

