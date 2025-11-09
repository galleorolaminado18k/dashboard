import { NextResponse } from 'next/server'

// ✅ Forzar Node.js runtime (Edge no puede hacer fetch a IPs externas)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Evolution API URL desde variable de entorno
const EVO_BASE_URL = process.env.EVO_BASE_URL || 'http://127.0.0.1:8080'

console.log('[EVOLUTION] Usando base URL:', EVO_BASE_URL)

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
      return NextResponse.json(
        { ok: false, error: 'ENV_EVO_BASE_URL_MISSING', needsSetup: true },
        { status: 500, headers: corsHeaders() }
      )
    }

    // Endpoint: GET /sessions/default/status
    const response = await fetch(`${EVO_BASE_URL}/sessions/default/status`, {
      cache: 'no-store',
    })

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text()
      console.error('[EVOLUTION] Error obteniendo estado:', response.status, errorText)
      return NextResponse.json(
        { ok: false, error: `EVO_STATE_${response.status}`, detail: errorText, needsSetup: true },
        { status: response.status, headers: corsHeaders() }
      )
    }

    // Si es 404, la sesión no existe aún
    if (response.status === 404) {
      console.log('[EVOLUTION] Sesión no existe aún')
      return NextResponse.json(
        {
          ok: true,
          session: { name: 'default', status: 'NOT_CREATED', connected: false, needsQR: true },
        },
        { headers: corsHeaders() }
      )
    }

    const data = await response.json()
    console.log('[EVOLUTION] Estado de sesión:', data)

    // Evolution API retorna: { state: "open" | "connecting" | "close" }
    const isConnected = data.state === 'open'
    const needsQR = data.state === 'connecting' || data.state === 'close'

    return NextResponse.json(
      {
        ok: true,
        session: { name: 'default', status: data.state, connected: isConnected, needsQR },
      },
      { headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error conectando:', error.message || error)
    return NextResponse.json(
      { ok: false, error: 'EVO_UNREACHABLE', detail: error.message || String(error), needsSetup: true },
      { status: 502, headers: corsHeaders() }
    )
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
      return NextResponse.json(
        { ok: false, error: 'ENV_EVO_BASE_URL_MISSING' },
        { status: 500, headers: corsHeaders() }
      )
    }

    // Paso 1: Iniciar/crear sesión
    console.log('[EVOLUTION] Paso 1: Crear sesión...')
    const startResponse = await fetch(`${EVO_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        sessionName: 'default',
        whatsappVersion: 'v2',
      }),
    })

    // 409 significa que la sesión ya existe - esto es OK
    if (!startResponse.ok && startResponse.status !== 409) {
      const errorText = await startResponse.text()
      console.error('[EVOLUTION] Error creando sesión:', startResponse.status, errorText)
      return NextResponse.json(
        { ok: false, error: `EVO_START_${startResponse.status}`, detail: errorText },
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] Sesión creada/existente:', startResponse.status)

    // Paso 2: Obtener QR
    console.log('[EVOLUTION] Paso 2: Obtener QR...')
    const qrResponse = await fetch(`${EVO_BASE_URL}/sessions/default/qrcode`, {
      cache: 'no-store',
    })

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text()
      console.error('[EVOLUTION] Error obteniendo QR:', qrResponse.status, errorText)
      return NextResponse.json(
        { ok: false, error: `EVO_QR_${qrResponse.status}`, detail: errorText },
        { status: 502, headers: corsHeaders() }
      )
    }

    // Obtener el JSON con el QR
    const qrText = await qrResponse.text()
    console.log('[EVOLUTION] QR obtenido exitosamente')

    // Evolution retorna: { qrcode: "data:image/png;base64,..." }
    return new Response(qrText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('[EVOLUTION] Error:', error.message || error)
    return NextResponse.json(
      { ok: false, error: 'EVO_UNREACHABLE', detail: error.message || String(error) },
      { status: 502, headers: corsHeaders() }
    )
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
      return NextResponse.json(
        { ok: false, error: 'ENV_EVO_BASE_URL_MISSING' },
        { status: 500, headers: corsHeaders() }
      )
    }

    // Endpoint: DELETE /sessions/default
    const response = await fetch(`${EVO_BASE_URL}/sessions/default`, {
      method: 'DELETE',
      cache: 'no-store',
    })

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text()
      console.error('[EVOLUTION] Error eliminando sesión:', response.status, errorText)
      return NextResponse.json(
        { ok: false, error: `EVO_DELETE_${response.status}`, detail: errorText },
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] Sesión eliminada correctamente')

    return NextResponse.json(
      { ok: true, message: 'Sesión eliminada correctamente' },
      { headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error eliminando sesión:', error.message || error)
    return NextResponse.json(
      { ok: false, error: 'EVO_DELETE_ERROR', detail: error.message || String(error) },
      { status: 502, headers: corsHeaders() }
    )
  }
}

