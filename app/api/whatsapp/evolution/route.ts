// ✅ Forzar Node.js runtime (obligatorio)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Configuración desde variables de entorno
const BASE = process.env.EVO_BASE_URL!.replace(/\/+$/, '')      // sin / final
const PATH = (process.env.EVO_PATH || '').replace(/\/+$/, '')   // ej: '', '/api'
const APIKEY = process.env.EVO_API_KEY || ''
const NAME = 'default'

console.log('[EVOLUTION] Base URL:', BASE)
console.log('[EVOLUTION] Path Prefix:', PATH || '(ninguno)')
console.log('[EVOLUTION] API Key:', APIKEY ? 'Configurada' : 'No configurada')

// Helper para headers con autenticación opcional
const H = () => ({
  'Content-Type': 'application/json',
  ...(APIKEY ? { apikey: APIKEY } : {})
})

// Construir URL completa con prefijo
const url = (p: string) => `${BASE}${PATH}${p}`

// Helper para llamadas a Evolution API con parse JSON automático
async function jfetch(path: string, init: RequestInit = {}) {
  const fullUrl = url(path)
  console.log('[EVOLUTION] Llamando:', fullUrl)

  const r = await fetch(fullUrl, {
    ...init,
    headers: { ...H(), ...(init.headers || {}) },
    cache: 'no-store',
  })

  const text = await r.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    json = undefined
  }

  return { ok: r.ok, status: r.status, text, json }
}

// Reintentos por versión - Evolution tiene diferentes convenciones de rutas
async function startSession() {
  const body = JSON.stringify({ sessionName: NAME, whatsappVersion: 'v2' })

  // v1/v2 común: /sessions/start
  let r = await jfetch('/sessions/start', { method: 'POST', body })
  if (r.ok || r.status === 409) {
    console.log('[EVOLUTION] ✅ Sesión iniciada con /sessions/start')
    return r
  }

  // Algunas builds usan singular: /session/start
  r = await jfetch('/session/start', { method: 'POST', body })
  if (r.ok || r.status === 409) {
    console.log('[EVOLUTION] ✅ Sesión iniciada con /session/start')
    return r
  }

  // Otras usan: /instance/create
  r = await jfetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ sessionName: NAME })
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
    console.log('[EVOLUTION] POST: Iniciando sesión y obteniendo QR...')

    // 1) Health check opcional (si 404 aquí, la BASE/PATH está mal)
    const h = await jfetch('/health')
    if (!h.ok && h.status !== 404) {
      console.error(`[EVOLUTION] ❌ Health check falló: ${h.status}`)
      return new Response(
        JSON.stringify({ error: `EVO_HEALTH_${h.status}`, detail: h.text }),
        { status: 502, headers: corsHeaders() }
      )
    }
    console.log('[EVOLUTION] Health check:', h.ok ? '✅ OK' : '⚠️ 404 (ignorado)')

    // 2) Start session con fallback automático de rutas
    const s = await startSession()
    if (!s.ok && s.status !== 409) {
      console.error(`[EVOLUTION] ❌ Error start: ${s.status} - ${s.text}`)
      return new Response(
        JSON.stringify({ error: `EVO_START_${s.status}`, detail: s.text }),
        { status: 502, headers: corsHeaders() }
      )
    }
    console.log(`[EVOLUTION] Sesión: ${s.status === 409 ? 'Ya existe' : 'Creada'}`)

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

