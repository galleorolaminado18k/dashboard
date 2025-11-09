import { NextResponse } from 'next/server'

// ✅ Runtime Edge (permite HTTP desde Vercel HTTPS)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ✅ WAHA_BASE_URL desde variable de entorno (Railway/Vercel)
const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY || '4876d997cc954b7d8b966b9fd4863f73'

console.log('[QR] Usando WAHA:', WAHA)

// Helper para fetch con timeout para edge runtime
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  return fetch(url, options)
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

    // Obtener el QR REAL de WAHA
    const response = await fetchWithTimeout(`${WAHA}/api/session/default/qr?apiKey=${WAHA_API_KEY}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': WAHA_API_KEY,
        'Authorization': `Bearer ${WAHA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API QR] Error de WAHA:', response.status, errorText)

      return NextResponse.json({
        ok: false,
        error: `WAHA_QR_${response.status}`,
        hint: 'La sesión puede no estar lista aún. Espera unos segundos e intenta de nuevo.',
        needsSessionStart: true,
      }, {
        status: response.status,
        headers: corsHeaders()
      })
    }

    const data = await response.json()
    console.log('[API QR] QR recibido de WAHA')

    // data.qr contiene el QR en formato base64 o data URL
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

    // Retornar QR directamente (data:image/png;base64,...)
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

