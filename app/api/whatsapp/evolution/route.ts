// ✅ Forzar Node.js runtime (obligatorio)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Configuración desde variables de entorno
const BASE = process.env.EVO_BASE_URL!.replace(/\/+$/, '')      // sin / final
const PATH = (process.env.EVO_PATH || '').replace(/\/+$/, '')   // ej: '', '/api'
const APIKEY = process.env.EVO_API_KEY || ''
const BEARER = process.env.EVO_BEARER || ''
const NAME = 'default'

console.log('[EVOLUTION] Base URL:', BASE)
console.log('[EVOLUTION] Path Prefix:', PATH || '(ninguno)')
console.log('[EVOLUTION] API Key:', APIKEY ? 'Configurada ✅' : 'No configurada ⚠️')
console.log('[EVOLUTION] Bearer Token:', BEARER ? 'Configurado ✅' : 'No configurado')

// Helper para headers con autenticación - soporta TODAS las variantes
const H = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // ✅ Enviar la API Key en TODAS las variantes posibles que Evolution puede usar
  if (APIKEY) {
    headers['apikey'] = APIKEY           // Variante común en Evolution
    headers['X-API-KEY'] = APIKEY        // Variante con prefijo X-
    headers['x-api-key'] = APIKEY        // Variante lowercase
  }
  // ✅ Bearer token si está configurado
  if (BEARER) {
    headers['Authorization'] = `Bearer ${BEARER}`
  }
  return headers
}


// Helper para llamadas a Evolution API con parse JSON automático y manejo de errores
async function jfetch(path: string, init: RequestInit = {}) {
  // Normalizar path (evitar barras dobles)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const fullUrl = `${BASE}${PATH}${normalizedPath}`

  console.log('[EVOLUTION] 🔗 Llamando:', fullUrl)
  console.log('[EVOLUTION] 📤 Headers:', Object.keys(H()).join(', '))

  try {
    const r = await fetch(fullUrl, {
      ...init,
      headers: { ...H(), ...(init.headers || {}) },
      cache: 'no-store',
      // Agregar timeout implícito con signal
      signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined, // 30s timeout
    })

    const text = await r.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      json = undefined
    }

    if (!r.ok) {
      console.error(`[EVOLUTION] ❌ HTTP ${r.status}: ${text.substring(0, 200)}`)
    }

    return { ok: r.ok, status: r.status, text, json }
  } catch (error: any) {
    // Manejar errores de red/timeout
    console.error('[EVOLUTION] ❌ Error de red:', error.message)
    throw new Error(`EVO_FETCH_FAILED: ${error.message} - Verifica que Evolution API esté corriendo y accesible desde Vercel`)
  }
}

// Reintentos por versión - Evolution tiene diferentes convenciones de rutas Y autenticación
async function startSession() {
  const bodyStd = JSON.stringify({ sessionName: NAME, whatsappVersion: 'v2' })

  // 1) /sessions/start con headers (método estándar)
  let r = await jfetch('/sessions/start', { method: 'POST', body: bodyStd })
  if (r.ok || r.status === 409) {
    console.log('[EVOLUTION] ✅ Sesión iniciada con /sessions/start (headers)')
    return r
  }

  // 2) /sessions/start con apikey en query string (fallback)
  if (APIKEY) {
    r = await jfetch(`/sessions/start?apikey=${encodeURIComponent(APIKEY)}`, {
      method: 'POST',
      body: bodyStd
    })
    if (r.ok || r.status === 409) {
      console.log('[EVOLUTION] ✅ Sesión iniciada con /sessions/start (query)')
      return r
    }
  }

  // 3) /session/start (singular) con headers
  r = await jfetch('/session/start', { method: 'POST', body: bodyStd })
  if (r.ok || r.status === 409) {
    console.log('[EVOLUTION] ✅ Sesión iniciada con /session/start (headers)')
    return r
  }

  // 4) /session/start con apikey en query
  if (APIKEY) {
    r = await jfetch(`/session/start?apikey=${encodeURIComponent(APIKEY)}`, {
      method: 'POST',
      body: bodyStd
    })
    if (r.ok || r.status === 409) {
      console.log('[EVOLUTION] ✅ Sesión iniciada con /session/start (query)')
      return r
    }
  }

  // 5) /instance/create (versiones antiguas, puede necesitar secretKey)
  r = await jfetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ sessionName: NAME, secretKey: APIKEY || undefined })
  })
  console.log('[EVOLUTION] Intento con /instance/create:', r.status)
  return r
}

async function getQR() {
  // v1 común: /sessions/{name}/qrcode
  let r = await jfetch(`/sessions/${NAME}/qrcode`)
  if (r.ok) {
    console.log('[EVOLUTION] ✅ QR obtenido con /sessions/{name}/qrcode')
    return r
  }

  // Variante singular: /session/{name}/qrcode
  r = await jfetch(`/session/${NAME}/qrcode`)
  if (r.ok) {
    console.log('[EVOLUTION] ✅ QR obtenido con /session/{name}/qrcode')
    return r
  }

  // Variante instance: /instance/qr/{name}
  r = await jfetch(`/instance/qr/${NAME}`)
  console.log('[EVOLUTION] Intento con /instance/qr/{name}:', r.status)
  return r
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
 * Iniciar sesión y obtener QR con detección automática de rutas
 */
export async function POST() {
  try {
    console.log('[EVOLUTION] 🚀 POST: Iniciando sesión y obteniendo QR...')
    console.log('[EVOLUTION] 🔧 Runtime:', runtime)
    console.log('[EVOLUTION] 🌐 BASE URL:', BASE)
    console.log('[EVOLUTION] 🔑 API Key configurada:', APIKEY ? 'Sí ✅' : 'No ⚠️')

    // 1) Health check opcional (si 404 aquí, la BASE/PATH está mal)
    let h
    try {
      h = await jfetch('/health')
    } catch (error: any) {
      console.error(`[EVOLUTION] ❌ Health check falló con error de red:`, error.message)
      return new Response(
        JSON.stringify({
          error: 'EVO_UNREACHABLE',
          detail: `No se puede conectar a Evolution API en ${BASE}. Verifica que esté corriendo y accesible.`,
          message: error.message
        }),
        { status: 502, headers: corsHeaders() }
      )
    }

    if (!h.ok && h.status !== 404) {
      console.error(`[EVOLUTION] ❌ Health check falló: ${h.status}`)
      return new Response(
        JSON.stringify({ error: `EVO_HEALTH_${h.status}`, detail: h.text }),
        { status: 502, headers: corsHeaders() }
      )
    }
    console.log('[EVOLUTION] ✅ Health check:', h.ok ? 'OK' : '404 (ignorado)')

    // 2) Start session con fallback automático de rutas
    const s = await startSession()
    if (!s.ok && s.status !== 409) {
      console.error(`[EVOLUTION] ❌ Error start: ${s.status} - ${s.text}`)
      return new Response(
        JSON.stringify({ error: `EVO_START_${s.status}`, detail: s.text }),
        { status: 502, headers: corsHeaders() }
      )
    }
    console.log(`[EVOLUTION] ✅ Sesión: ${s.status === 409 ? 'Ya existe' : 'Creada'}`)

    // 3) Get QR con fallback automático de rutas
    const q = await getQR()
    if (!q.ok) {
      console.error(`[EVOLUTION] ❌ Error QR: ${q.status} - ${q.text}`)
      return new Response(
        JSON.stringify({ error: `EVO_QR_${q.status}`, detail: q.text }),
        { status: 502, headers: corsHeaders() }
      )
    }

    // 4) Normalizar campo del QR - diferentes versiones usan diferentes nombres
    const d = q.json ?? {}
    const qr = d.qrcode || d.qrCode || d.image || d.base64 || d.dataURL || ''

    if (!qr) {
      console.error(`[EVOLUTION] ❌ QR vacío. Respuesta: ${(q.text || '').slice(0, 300)}`)
      return new Response(
        JSON.stringify({ error: 'EVO_QR_EMPTY', raw: (q.text || '').slice(0, 300) }),
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] ✅ QR obtenido exitosamente!')

    // ✅ Retornar siempre con campo normalizado "qrcode"
    return new Response(
      JSON.stringify({ qrcode: qr }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (e: any) {
    console.error('[EVOLUTION] ❌ Error crítico:', e)
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 502, headers: corsHeaders() }
    )
  }
}

/**
 * GET /api/whatsapp/evolution
 * Obtener estado de la sesión con fallback de rutas
 */
export async function GET() {
  try {
    console.log('[EVOLUTION] GET: Verificando estado...')

    // Intentar diferentes rutas de status
    let result = await jfetch(`/sessions/${NAME}/status`)

    if (result.status === 404) {
      // Intentar variante singular
      result = await jfetch(`/session/${NAME}/status`)
    }

    if (result.status === 404) {
      // Intentar variante instance
      result = await jfetch(`/instance/status/${NAME}`)
    }

    if (result.status === 404) {
      return new Response(
        JSON.stringify({
          ok: true,
          session: { name: NAME, status: 'NOT_CREATED', connected: false, needsQR: true },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    if (!result.ok) {
      console.error(`[EVOLUTION] Error status: ${result.status}`)
      return new Response(
        JSON.stringify({ ok: false, error: `EVO_STATE_${result.status}`, detail: result.text }),
        { status: 502, headers: corsHeaders() }
      )
    }

    const data = result.json || {}
    const isConnected = data.state === 'open'
    const needsQR = data.state === 'connecting' || data.state === 'close'

    return new Response(
      JSON.stringify({
        ok: true,
        session: { name: NAME, status: data.state, connected: isConnected, needsQR },
      }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (e: any) {
    console.error('[EVOLUTION] Error GET:', e)
    return new Response(
      JSON.stringify({ ok: false, error: String(e), needsSetup: true }),
      { status: 502, headers: corsHeaders() }
    )
  }
}

/**
 * DELETE /api/whatsapp/evolution
 * Eliminar sesión con fallback de rutas
 */
export async function DELETE() {
  try {
    console.log('[EVOLUTION] DELETE: Eliminando sesión...')

    // Intentar diferentes rutas de delete
    let result = await jfetch(`/sessions/${NAME}`, { method: 'DELETE' })

    if (result.status === 404) {
      // Intentar variante singular
      result = await jfetch(`/session/${NAME}`, { method: 'DELETE' })
    }

    if (result.status === 404) {
      // Intentar variante instance
      result = await jfetch(`/instance/delete/${NAME}`, { method: 'DELETE' })
    }

    if (!result.ok && result.status !== 404) {
      console.error(`[EVOLUTION] Error delete: ${result.status}`)
      return new Response(
        JSON.stringify({ ok: false, error: `EVO_DELETE_${result.status}`, detail: result.text }),
        { status: 502, headers: corsHeaders() }
      )
    }

    console.log('[EVOLUTION] ✅ Sesión eliminada')

    return new Response(
      JSON.stringify({ ok: true, message: 'Sesión eliminada' }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (e: any) {
    console.error('[EVOLUTION] Error DELETE:', e)
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 502, headers: corsHeaders() }
    )
  }
}

