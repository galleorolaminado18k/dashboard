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

    // Crear headers con múltiples variantes de autenticación
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Agregar API key en múltiples formatos (Evolution API puede usar cualquiera)
    if (KEY) {
      headers['apikey'] = KEY
      headers['api-key'] = KEY
      headers['x-api-key'] = KEY
      headers['Authorization'] = `Bearer ${KEY}`
    }

    console.log('[EVOLUTION] 📤 Headers enviados:', Object.keys(headers).join(', '))

    const r = await fetch(url, {
      ...init,
      headers: {
        ...headers,
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
      console.error(`[EVOLUTION] ❌ Error HTTP ${r.status}:`, text.substring(0, 500))

      // Logging detallado para errores de autenticación
      if (r.status === 401 || r.status === 403) {
        console.error('[EVOLUTION] 🔐 Error de autenticación detectado')
        console.error('[EVOLUTION] 🔑 API Key configurada:', KEY ? `${KEY.substring(0, 10)}...` : 'NO')
        console.error('[EVOLUTION] 📋 Posibles causas:')
        console.error('  1. API Key incorrecta o no configurada en Evolution')
        console.error('  2. Variable EVO_API_KEY no está en Vercel')
        console.error('  3. Evolution requiere AUTHENTICATION_API_KEY diferente')
      }

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

    // Evolution v2.2.3 - Crear instancia con QR
    console.log('[EVOLUTION] 🔄 Creando instancia...')
    const sessionData = await evo('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: NAME,
        token: NAME,
        qrcode: true
      })
    })
    console.log('[EVOLUTION] ✅ Instancia creada:', sessionData)

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
    let statusCode = 502

    if (error.message?.includes('EVO_UNREACHABLE')) {
      userMessage = `No se puede conectar a Evolution API en ${BASE}. Verifica que esté corriendo.`
      statusCode = 503
    } else if (error.message?.includes('EVO_TIMEOUT')) {
      userMessage = 'Evolution API no respondió a tiempo. Verifica que esté corriendo correctamente.'
      statusCode = 504
    } else if (error.message?.includes('EVO_HTTP_401') || error.message?.includes('EVO_HTTP_403')) {
      userMessage = `Error de autenticación (${error.message.includes('401') ? '401' : '403'}). La API Key no es válida o no está configurada. En producción (Vercel), agrega la variable EVO_API_KEY en Settings → Environment Variables.`
      statusCode = 401
    } else if (error.message?.includes('EVO_HTTP_400')) {
      userMessage = 'Error 400: La petición no es válida. Verifica la configuración de Evolution API.'
      statusCode = 400
    } else if (error.message?.includes('EVO_HTTP_404')) {
      userMessage = 'Endpoint no encontrado en Evolution API. Verifica que esté usando Evolution v2.'
      statusCode = 404
    }

    return new Response(
      JSON.stringify({
        error: error.message.split(':')[0] || 'EVO_ERROR',
        message: userMessage,
        detail: error.message,
        config: {
          baseUrl: BASE,
          hasApiKey: !!KEY
        }
      }),
      { status: statusCode, headers: corsHeaders() }
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

    // Evolution v2 - Usar fetchInstances para verificar estado
    const data = await evo(`/instance/fetchInstances?instanceName=${NAME}`)

    console.log('[EVOLUTION] Respuesta fetchInstances:', JSON.stringify(data).substring(0, 300))

    // Si data es un array, buscar la instancia
    let instance = null
    if (Array.isArray(data)) {
      instance = data.find((inst: any) => inst.instance?.instanceName === NAME)
    } else if (data.instance) {
      instance = data
    }

    if (!instance) {
      console.log('[EVOLUTION] Instancia no encontrada')
      return new Response(
        JSON.stringify({
          ok: true,
          session: { name: NAME, status: 'NOT_CREATED', connected: false, needsQR: true },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    const connectionStatus = instance.instance?.connectionStatus || instance.connectionStatus || 'close'
    const isConnected = connectionStatus === 'open'
    const needsQR = connectionStatus === 'connecting' || connectionStatus === 'close'

    console.log('[EVOLUTION] Estado de conexión:', connectionStatus)

    return new Response(
      JSON.stringify({
        ok: true,
        session: {
          name: NAME,
          status: connectionStatus,
          connected: isConnected,
          needsQR
        },
      }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error GET:', error.message)

    // Si es 404 o error de instancia no encontrada, la sesión no existe
    if (error.message?.includes('EVO_HTTP_404') || error.message?.includes('not found')) {
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

    // Evolution v2 - Usar endpoint correcto para eliminar instancia
    await evo(`/instance/delete/${NAME}`, { method: 'DELETE' })

    console.log('[EVOLUTION] ✅ Sesión eliminada')

    return new Response(
      JSON.stringify({ ok: true, message: 'Sesión eliminada' }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (error: any) {
    console.error('[EVOLUTION] Error DELETE:', error.message)

    // Si es 404, ya estaba eliminada
    if (error.message?.includes('EVO_HTTP_404') || error.message?.includes('not found')) {
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

