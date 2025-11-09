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

    // Iniciar sesión en WAHA
    const response = await fetch(`${WAHA}/api/session/default/start?apiKey=${WAHA_API_KEY}`, {
      method: 'POST',
      headers: {
        'X-Api-Key': WAHA_API_KEY,
        'Authorization': `Bearer ${WAHA_API_KEY}`,
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

