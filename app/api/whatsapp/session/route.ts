import { NextResponse } from 'next/server'

// ✅ Runtime Edge (permite HTTP desde Vercel HTTPS)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ✅ WAHA_BASE_URL desde variable de entorno (Railway/Vercel)
const WAHA = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'
const WAHA_API_KEY = process.env.WAHA_API_KEY // OPCIONAL - No funciona en CORE/WEBJS

console.log('[SESSION] Usando WAHA:', WAHA)
console.log('[SESSION] API Key:', WAHA_API_KEY ? 'Disponible (NO usar en CORE/WEBJS)' : 'NO')

// Helper para fetch con timeout para edge runtime
async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  return fetch(url, options)
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
 * GET /api/whatsapp/session
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    console.log('[API] Verificando estado de sesión en WAHA:', WAHA)

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    // Headers con API Key (WAHA la genera automáticamente)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}),
    }

    // Endpoint correcto: /api/sessions/:session (plural)
    const url = `${WAHA}/api/sessions/default`

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: new Headers(headers),
    })

    if (!response.ok) {
      console.error('[API] Error obteniendo estado:', response.status)
      return NextResponse.json({
        ok: false,
        error: `WAHA_STATE_${response.status}`,
        needsSetup: true,
      }, {
        status: response.status,
        headers: corsHeaders()
      })
    }

    const data = await response.json()
    console.log('[API] Estado de sesión:', data)

    return NextResponse.json({
      ok: true,
      session: {
        name: 'default',
        status: data.state || data.status,
        connected: data.state === 'WORKING' || data.status === 'WORKING',
        needsQR: data.state === 'SCAN_QR_CODE' || data.state === 'STARTING',
      },
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API] Error conectando con WAHA:', error.message || error)
    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: error.message || String(error),
      needsSetup: true,
      wahaUrl: WAHA,
    }, {
      status: 502,
      headers: corsHeaders()
    })
  }
}

/**
 * POST /api/whatsapp/session
 * Crear o iniciar una nueva sesión en WAHA + Obtener QR
 */
export async function POST() {
  try {
    console.log('[API] Iniciando sesión de WhatsApp en WAHA:', WAHA)

    if (!WAHA || WAHA === '') {
      throw new Error('ENV_WAHA_BASE_URL_MISSING')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}),
    }

    // 1. Intentar iniciar sesión
    const startUrl = `${WAHA}/api/sessions/default/start`
    let start = await fetchWithTimeout(startUrl, {
      method: 'POST',
      headers: new Headers(headers),
    })

    // Si WAHA responde que la sesión no existe (422), intentar crearla y reintentar start
    if (!start.ok) {
      let startBody: any = null
      try { startBody = await start.json() } catch (e) { startBody = await start.text().catch(() => null) }

      console.warn('[API] WAHA start failed:', start.status, startBody)

      if (start.status === 422 && startBody && (String(startBody.error || startBody).includes('does not exist') || String(startBody.error || '').includes('not exist'))) {
        // Intentar crear la sesión 'default'
        console.log('[API] Sesión default no existe en WAHA, intentando crearla...')
        const create = await fetchWithTimeout(`${WAHA}/api/sessions`, {
          method: 'POST',
          headers: new Headers(headers),
          body: JSON.stringify({ name: 'default' }),
        })

        if (!create.ok) {
          const createText = await create.text().catch(() => String(create.status))
          throw new Error(`WAHA_CREATE_${create.status}: ${createText}`)
        }

        console.log('[API] Sesión creada, reintentando start...')
        start = await fetchWithTimeout(startUrl, {
          method: 'POST',
          headers: new Headers(headers),
        })

        if (!start.ok) {
          const txt = await start.text().catch(() => String(start.status))
          throw new Error(`WAHA_START_${start.status}: ${txt}`)
        }
      } else {
        const txt = await start.text().catch(() => String(start.status))
        throw new Error(`WAHA_START_${start.status}: ${txt}`)
      }
    }

    console.log('[API] Sesión iniciada, esperando QR...')

    // 2. Esperar generación del QR (3 segundos)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 3. Obtener QR
    // Usar ruta plural y auth: /api/sessions/default/auth/qr
    const qrUrl = `${WAHA}/api/sessions/default/auth/qr`
    const qr = await fetchWithTimeout(qrUrl, {
      method: 'GET',
      headers: new Headers({ ...headers, 'Cache-Control': 'no-store' }),
    })

    if (!qr.ok) {
      const body = await qr.text().catch(() => null)
      console.error('[API] Error obteniendo QR:', qr.status, body)
      throw new Error(`WAHA_QR_${qr.status}: ${body}`)
    }

    const data = await qr.json()
    console.log('[API] QR obtenido exitosamente')

    // Retornar QR directamente (data:image/png;base64,...)
    return NextResponse.json({
      ok: true,
      qr: data.qr,
      message: 'Escanea el código QR con WhatsApp Business',
    }, {
      headers: corsHeaders()
    })
  } catch (error: any) {
    console.error('[API] Error fatal:', error.message || error)

    // Si el error viene con WAHA detalles ya incluídos, devolverlos al cliente
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

/**
 * DELETE /api/whatsapp/session
 * Detener y eliminar la sesión
 */
export async function DELETE() {
  try {
    console.log('[API] Deteniendo sesión...')

    // Detener la sesión
    // Usar endpoint plural para stop
    const response = await fetch(`${WAHA}/api/sessions/default/stop`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Error deteniendo sesión')
    }

    return NextResponse.json({
      ok: true,
      message: 'Sesión detenida correctamente',
    }, { headers: corsHeaders() })
  } catch (error: any) {
    console.error('[API] Error deteniendo sesión:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500, headers: corsHeaders() })
  }
}
