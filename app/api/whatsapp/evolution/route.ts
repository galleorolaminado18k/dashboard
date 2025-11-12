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
  console.log('[EVOLUTION] 📝 Método:', init.method || 'GET')
  console.log('[EVOLUTION] 🔑 API Key presente:', KEY ? 'Sí' : 'No')

  // Timeout de 30 segundos (más tiempo para Evolution API)
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 30000)

  try {
    const startTime = Date.now()
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

    const elapsed = Date.now() - startTime
    console.log(`[EVOLUTION] ⏱️  Respuesta en ${elapsed}ms - Status: ${r.status}`)

    clearTimeout(timeout)

    if (!r.ok) {
      const text = await r.text().catch(() => r.statusText)
      console.error(`[EVOLUTION] ❌ Error HTTP ${r.status}:`, text.substring(0, 200))
      throw new Error(`EVO_HTTP_${r.status}: ${text}`)
    }

    const data = await r.json().catch(() => ({}))
    console.log('[EVOLUTION] ✅ Respuesta exitosa')
    return data
  } catch (error: any) {
    clearTimeout(timeout)

    // Manejar errores específicos
    if (error.name === 'AbortError') {
      console.error('[EVOLUTION] ⏰ TIMEOUT después de 30 segundos')
      throw new Error('EVO_TIMEOUT: Evolution API no respondió en 30 segundos. Verifica que esté corriendo y que el puerto 8080 esté abierto.')
    }

    if (error.message?.includes('fetch failed') || error.code === 'ECONNREFUSED') {
      console.error('[EVOLUTION] 🚫 No se puede conectar:', error.message)
      throw new Error(`EVO_UNREACHABLE: No se puede conectar a Evolution API en ${BASE}. Verifica: 1) Evolution está corriendo (docker ps), 2) Puerto 8080 abierto (ufw allow 8080/tcp), 3) SERVER_HOST=0.0.0.0 en Evolution`)
    }

    console.error('[EVOLUTION] ❌ Error desconocido:', error)
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
    console.log('[EVOLUTION] 🌐 Base URL:', BASE)
    console.log('[EVOLUTION] 🔑 API Key configurada:', KEY ? 'Sí' : 'No')

    // Intentar iniciar sesión directamente (Evolution v2.2.3 no tiene /health)
    console.log('[EVOLUTION] 🔄 Iniciando sesión...')
    const sessionData = await evo('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: NAME,
        qrcode: true,
        number: ''
      })
    })
    console.log('[EVOLUTION] ✅ Sesión iniciada:', sessionData)

    // Intentar obtener QR code
    console.log('[EVOLUTION] 📷 Obteniendo QR code...')

    // Esperar un momento para que se genere el QR
    await new Promise(resolve => setTimeout(resolve, 2000))

    const qrData = await evo(`/instance/connect/${NAME}`)

    // Normalizar diferentes formatos de respuesta
    const qrcode = qrData.qrcode || qrData.qrCode || qrData.code || qrData.qr || qrData.base64 || qrData.image || ''

    if (!qrcode) {
      console.error('[EVOLUTION] ⚠️  QR no disponible aún, respuesta:', JSON.stringify(qrData).substring(0, 200))

      // Devolver la sesión creada aunque no haya QR todavía
      return new Response(
        JSON.stringify({
          message: 'Sesión iniciada, esperando QR...',
          session: sessionData,
          needsRetry: true
        }),
        { status: 202, headers: corsHeaders() }
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
      userMessage = `No se puede conectar a Evolution API. Verifica que esté corriendo en ${BASE}.`
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

