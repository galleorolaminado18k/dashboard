import { NextResponse } from 'next/server'

// ✅ Runtime Edge (permite HTTP desde Vercel HTTPS)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ✅ Evolution API URL desde variable de entorno
const EVO_BASE_URL = process.env.EVO_BASE_URL || 'http://127.0.0.1:8080'

console.log('[EVOLUTION] Usando base URL:', EVO_BASE_URL)

// Helper para fetch con manejo de errores
async function evoFetch(path: string, init: RequestInit = {}) {
  const url = `${EVO_BASE_URL}${path}`
  console.log(`[EVOLUTION] Llamando a: ${url}`)

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const text = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    text,
    data: text ? (text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : text) : null,
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
 * GET /api/whatsapp/evolution
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    console.log('[EVOLUTION] Verificando estado de sesión...')

    if (!EVO_BASE_URL || EVO_BASE_URL === '') {
      throw new Error('ENV_EVO_BASE_URL_MISSING')
    }

    // Endpoint: GET /sessions/default/status
    const result = await evoFetch('/sessions/default/status')

    if (!result.ok && result.status !== 404) {
      console.error('[EVOLUTION] Error obteniendo estado:', result.status, result.text)
      return NextResponse.json({
        ok: false,
        error: `EVO_STATE_${result.status}`,
        detail: result.text,
        needsSetup: true,
      }, {
        status: result.status,
        headers: corsHeaders()
      })
    }

    // Si es 404, la sesión no existe aún
    if (result.status === 404) {
      console.log('[EVOLUTION] Sesión no existe aún')
      return NextResponse.json({
        ok: true,
        session: {
          name: 'default',
          status: 'NOT_CREATED',
          connected: false,
          needsQR: true,
        },
      }, {
        headers: corsHeaders()
      })
    }

    const data = result.data
    console.log('[EVOLUTION] Estado de sesión:', data)

    // Evolution API retorna: { state: "open" | "connecting" | "close" }
    const isConnected = data.state === 'open'
    const needsQR = data.state === 'connecting' || data.state === 'close'

    return NextResponse.json({
      ok: true,
      session: {
        name: 'default',
        status: data.state,
        connected: isConnected,
        needsQR,
      },
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[EVOLUTION] Error conectando:', error.message || error)
    return NextResponse.json({
      ok: false,
      error: 'EVO_UNREACHABLE',
      detail: error.message || String(error),
      needsSetup: true,
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}

/**
 * POST /api/whatsapp/evolution
 * Iniciar sesión y obtener QR
 */
export async function POST() {
  try {
    console.log('[EVOLUTION] Iniciando sesión y obteniendo QR...')

    if (!EVO_BASE_URL || EVO_BASE_URL === '') {
      throw new Error('ENV_EVO_BASE_URL_MISSING')
    }

    // Paso 1: Iniciar/crear sesión
    console.log('[EVOLUTION] Paso 1: Crear sesión...')
    const startResult = await evoFetch('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionName: 'default',
        whatsappVersion: 'v2',
      }),
    })

    // 409 significa que la sesión ya existe - esto es OK
    if (!startResult.ok && startResult.status !== 409) {
      console.error('[EVOLUTION] Error creando sesión:', startResult.status, startResult.text)
      throw new Error(`EVO_START_${startResult.status}: ${startResult.text}`)
    }

    console.log('[EVOLUTION] Sesión creada/existente:', startResult.status)

    // Paso 2: Obtener QR
    console.log('[EVOLUTION] Paso 2: Obtener QR...')
    const qrResult = await evoFetch('/sessions/default/qrcode')

    if (!qrResult.ok) {
      console.error('[EVOLUTION] Error obteniendo QR:', qrResult.status, qrResult.text)
      throw new Error(`EVO_QR_${qrResult.status}: ${qrResult.text}`)
    }

    const qrData = qrResult.data
    console.log('[EVOLUTION] QR obtenido:', qrData ? 'OK' : 'VACIO')

    // Evolution retorna: { qrcode: "data:image/png;base64,..." }
    if (!qrData || !qrData.qrcode) {
      throw new Error('QR no disponible - la sesión puede estar ya conectada')
    }

    return NextResponse.json({
      ok: true,
      qr: qrData.qrcode, // base64 data URL
      message: 'QR generado correctamente',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[EVOLUTION] Error:', error.message || error)
    return NextResponse.json({
      ok: false,
      error: 'EVO_UNREACHABLE',
      detail: error.message || String(error),
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}

/**
 * DELETE /api/whatsapp/evolution
 * Desconectar y eliminar sesión
 */
export async function DELETE() {
  try {
    console.log('[EVOLUTION] Eliminando sesión...')

    if (!EVO_BASE_URL || EVO_BASE_URL === '') {
      throw new Error('ENV_EVO_BASE_URL_MISSING')
    }

    // Endpoint: DELETE /sessions/default
    const result = await evoFetch('/sessions/default', {
      method: 'DELETE',
    })

    if (!result.ok && result.status !== 404) {
      console.error('[EVOLUTION] Error eliminando sesión:', result.status, result.text)
      throw new Error(`EVO_DELETE_${result.status}: ${result.text}`)
    }

    console.log('[EVOLUTION] Sesión eliminada correctamente')

    return NextResponse.json({
      ok: true,
      message: 'Sesión eliminada correctamente',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[EVOLUTION] Error eliminando sesión:', error.message || error)
    return NextResponse.json({
      ok: false,
      error: 'EVO_DELETE_ERROR',
      detail: error.message || String(error),
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}

