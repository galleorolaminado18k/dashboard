// ✅ Forzar Node.js runtime (obligatorio)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Configuración desde variables de entorno
const BASE = (process.env.EVO_BASE_URL || '').replace(/\/+$/, '')   // sin / final
const KEY = process.env.EVO_API_KEY || ''
const NAME = 'default'

console.log('[EVOLUTION] 🌐 Base URL:', BASE)
console.log('[EVOLUTION] 🔑 API Key:', KEY ? 'Configurada ✅' : 'No configurada ⚠️')

// ✅ Cliente robusto con timeout y normalización de URL
async function evo(p: string, init: RequestInit = {}) {
  // Normalizar path (evitar barras dobles)
  const path = p.startsWith('/') ? p : `/${p}`
  const url = `${BASE}${path}`

  console.log('[EVOLUTION] 🔗 Llamando:', url)

  // Timeout de 10 segundos
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 10000)

  try {
    const r = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'apikey': KEY,
        ...init.headers
      },
      signal: ctrl.signal,
      cache: 'no-store'
    })

    clearTimeout(timeout)

    if (!r.ok) {
      const text = await r.text().catch(() => r.statusText)
      throw new Error(`EVO_HTTP_${r.status}: ${text}`)
    }

    return r.json().catch(() => ({}))
  } catch (error: any) {
    clearTimeout(timeout)

    // Manejar errores específicos
    if (error.name === 'AbortError') {
      throw new Error('EVO_TIMEOUT: Evolution API no respondió en 10 segundos. Verifica que esté corriendo.')
    }

    if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      throw new Error(`EVO_UNREACHABLE: No se puede conectar a Evolution API en ${BASE}. Verifica que esté corriendo y accesible. Prueba: curl -i ${BASE}/health`)
    }

    throw error
  }
}

// CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  })
}

/**
 * POST /api/whatsapp/evolution
 * Iniciar sesión y obtener QR
 */
export async function POST() {
  try {
    console.log('[EVOLUTION] 🚀 Iniciando sesión de WhatsApp...')

    // 1) Health check
    console.log('[EVOLUTION] 📡 Verificando conexión a Evolution API...')
    await evo('/health')
    console.log('[EVOLUTION] ✅ Health check OK')

    // 2) Start session (con QR)
    console.log('[EVOLUTION] 🔄 Iniciando sesión...')
    const sessionData = await evo('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionName: NAME,
        whatsappVersion: 'v2',
        qrcode: true
      })
    })
    console.log('[EVOLUTION] ✅ Sesión iniciada:', sessionData.status || 'OK')

    // 3) Get QR code
    console.log('[EVOLUTION] 📷 Obteniendo QR code...')
    const qrData = await evo(`/sessions/${NAME}/qrcode`)

    // Normalizar diferentes formatos de respuesta
    const qrcode = qrData.qrcode || qrData.qrCode || qrData.image || qrData.base64 || qrData.dataURL || ''

    if (!qrcode) {
      console.error('[EVOLUTION] ❌ QR vacío en respuesta:', JSON.stringify(qrData).substring(0, 200))
      return new Response(
        JSON.stringify({
          error: 'EVO_QR_EMPTY',
          detail: 'Evolution API no devolvió un código QR',
          raw: qrData
        }),
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] ✅ QR obtenido exitosamente!')

    return new Response(
      JSON.stringify({ qrcode }),
      { status: 200, headers: corsHeaders() }
    )

  } catch (error: any) {
    console.error('[EVOLUTION] ❌ Error:', error.message)

    // Mensajes claros para el usuario
    let userMessage = error.message

    if (error.message?.includes('EVO_UNREACHABLE')) {
      userMessage = `No se puede conectar a Evolution API. Verifica que esté corriendo en ${BASE}. Prueba ejecutar: curl -i ${BASE}/health`
    } else if (error.message?.includes('EVO_TIMEOUT')) {
      userMessage = 'Evolution API no respondió a tiempo. Verifica que esté corriendo correctamente.'
    } else if (error.message?.includes('EVO_HTTP_401')) {
      userMessage = 'Error de autenticación. Verifica que EVO_API_KEY sea correcta.'
    } else if (error.message?.includes('EVO_HTTP_404')) {
      userMessage = 'Endpoint no encontrado. Verifica la versión de Evolution API.'
    }

    return new Response(
      JSON.stringify({
        error: error.message.split(':')[0] || 'EVO_ERROR',
        detail: userMessage,
        fullError: error.message
      }),
      { status: 502, headers: corsHeaders() }
    )
  }
}


/**
 * GET /api/whatsapp/evolution
 * Obtener estado de la sesión
 */
export async function GET() {
  try {
    console.log('[EVOLUTION] GET: Verificando estado...')

    const data = await evo(`/sessions/${NAME}/status`)
    const isConnected = data.state === 'open'
    const needsQR = data.state === 'connecting' || data.state === 'close'

    return new Response(
      JSON.stringify({
        ok: true,
        session: { name: NAME, status: data.state, connected: isConnected, needsQR },
      }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error GET:', error.message)

    // Si es 404, la sesión no existe
    if (error.message?.includes('EVO_HTTP_404')) {
      return new Response(
        JSON.stringify({
          ok: true,
          session: { name: NAME, status: 'NOT_CREATED', connected: false, needsQR: true },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    return new Response(
      JSON.stringify({ ok: false, error: error.message, needsSetup: true }),
      { status: 502, headers: corsHeaders() }
    )
  }
}

/**
 * DELETE /api/whatsapp/evolution
 * Eliminar sesión
 */
export async function DELETE() {
  try {
    console.log('[EVOLUTION] DELETE: Eliminando sesión...')

    await evo(`/sessions/${NAME}`, { method: 'DELETE' })

    console.log('[EVOLUTION] ✅ Sesión eliminada')

    return new Response(
      JSON.stringify({ ok: true, message: 'Sesión eliminada' }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error DELETE:', error.message)

    // Si es 404, ya estaba eliminada
    if (error.message?.includes('EVO_HTTP_404')) {
      return new Response(
        JSON.stringify({ ok: true, message: 'Sesión ya no existía' }),
        { status: 200, headers: corsHeaders() }
      )
    }

    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 502, headers: corsHeaders() }
    )
  }
}

