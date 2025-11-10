import { NextResponse } from 'next/server'

// ✅ Forzar Node.js runtime (Edge no puede hacer fetch a IPs externas)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Evolution API configuración desde variables de entorno
const EVO_BASE_URL = process.env.EVO_BASE_URL || 'http://127.0.0.1:8080'
const EVO_API_KEY = process.env.EVO_API_KEY || ''
const EVO_BEARER = process.env.EVO_BEARER || ''

console.log('[EVOLUTION] Usando base URL:', EVO_BASE_URL)
console.log('[EVOLUTION] API Key configurada:', EVO_API_KEY ? 'Sí' : 'No')
console.log('[EVOLUTION] Bearer configurado:', EVO_BEARER ? 'Sí' : 'No')

// Helper para agregar headers de autenticación
function withAuth(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  // Evolution API acepta 'apikey' header
  if (EVO_API_KEY) {
    headers['apikey'] = EVO_API_KEY
  }

  // O Bearer token
  if (EVO_BEARER) {
    headers['Authorization'] = `Bearer ${EVO_BEARER}`
  }

  return headers
}

// Helper para hacer fetch a Evolution API con autenticación
async function evoFetch(path: string, init: RequestInit = {}) {
  const url = `${EVO_BASE_URL}${path}`
  console.log(`[EVOLUTION] Llamando a: ${url}`)

  const response = await fetch(url, {
    ...init,
    headers: withAuth(init.headers as Record<string, string>),
    cache: 'no-store',
  })

  const text = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    text,
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
      return NextResponse.json(
        { ok: false, error: 'ENV_EVO_BASE_URL_MISSING', needsSetup: true },
        { status: 500, headers: corsHeaders() }
      )
    }

    // Endpoint: GET /sessions/default/status
    const result = await evoFetch('/sessions/default/status')

    if (!result.ok && result.status !== 404) {
      console.error('[EVOLUTION] Error obteniendo estado:', result.status, result.text)
      return NextResponse.json(
        { ok: false, error: `EVO_STATE_${result.status}`, detail: result.text, needsSetup: true },
        { status: result.status, headers: corsHeaders() }
      )
    }

    // Si es 404, la sesión no existe aún
    if (result.status === 404) {
      console.log('[EVOLUTION] Sesión no existe aún')
      return NextResponse.json(
        {
          ok: true,
          session: { name: 'default', status: 'NOT_CREATED', connected: false, needsQR: true },
        },
        { headers: corsHeaders() }
      )
    }

    const data = JSON.parse(result.text)
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
    const startResult = await evoFetch('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionName: 'default',
        whatsappVersion: 'v2',
      }),
    })

    // 409 significa que la sesión ya existe - esto es OK (idempotente)
    if (!startResult.ok && startResult.status !== 409) {
      console.error('[EVOLUTION] Error creando sesión:', startResult.status, startResult.text)
      return NextResponse.json(
        { ok: false, error: `EVO_START_${startResult.status}`, detail: startResult.text },
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] Sesión creada/existente:', startResult.status)

    // Paso 2: Obtener QR
    console.log('[EVOLUTION] Paso 2: Obtener QR...')
    const qrResult = await evoFetch('/sessions/default/qrcode')

    if (!qrResult.ok) {
      console.error('[EVOLUTION] Error obteniendo QR:', qrResult.status, qrResult.text)
      return NextResponse.json(
        { ok: false, error: `EVO_QR_${qrResult.status}`, detail: qrResult.text },
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] QR obtenido exitosamente')

    // Retornar el JSON tal cual { qrcode: "data:image/png;base64,..." }
    return new Response(qrResult.text, {
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
    const result = await evoFetch('/sessions/default', {
      method: 'DELETE',
    })

    if (!result.ok && result.status !== 404) {
      console.error('[EVOLUTION] Error eliminando sesión:', result.status, result.text)
      return NextResponse.json(
        { ok: false, error: `EVO_DELETE_${result.status}`, detail: result.text },
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

