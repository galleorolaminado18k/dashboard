import { NextResponse } from 'next/server'

// ✅ FIX PRODUCCIÓN DEFINITIVO: Cloudflare Tunnel o ngrok
const WAHA_URL = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'

// Timeout para evitar colgarse
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
    console.log('[API QR] Solicitando QR a WAHA:', WAHA_URL)

    if (!WAHA_URL || WAHA_URL === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // Obtener el QR REAL de WAHA
    const response = await fetchWithTimeout(`${WAHA_URL}/api/session/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

    return NextResponse.json({
      ok: true,
      qr: data.qr, // Base64 del QR REAL de WhatsApp Web
      message: 'Escanea este código QR con tu WhatsApp Business',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API QR] Error fatal:', error.message || error)
    console.error('[API QR] WAHA_URL configurada:', WAHA_URL)

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

