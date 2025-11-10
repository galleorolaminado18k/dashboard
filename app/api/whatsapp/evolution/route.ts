import { NextResponse } from 'next/server'

// ✅ Forzar Node.js runtime (obligatorio)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ✅ Configuración desde variables de entorno
const BASE = process.env.EVO_BASE_URL!
const APIKEY = process.env.EVO_API_KEY || ''

console.log('[EVOLUTION] Base URL:', BASE)
console.log('[EVOLUTION] API Key:', APIKEY ? 'Configurada' : 'No configurada')

// Helper para headers con autenticación opcional
function h(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (APIKEY) headers['apikey'] = APIKEY
  return headers
}

// Helper para llamadas a Evolution API
async function evo(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path}`
  console.log(`[EVOLUTION] Llamando: ${url}`)

  const response = await fetch(url, {
    ...init,
    headers: { ...h(), ...(init.headers || {}) },
    cache: 'no-store',
  })

  const text = await response.text()

  return {
    ok: response.ok,
    status: response.status,
    text,
  }
}

// CORS headers
function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    console.log('[EVOLUTION] POST: Iniciando sesión y obteniendo QR...')

    // Paso 1: Iniciar/crear sesión (idempotente)
    const s = await evo('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionName: 'default',
        whatsappVersion: 'v2',
      }),
    })

    // 409 = sesión ya existe, es OK
    if (!s.ok && s.status !== 409) {
      console.error(`[EVOLUTION] Error start: ${s.status} - ${s.text}`)
      throw new Error(`EVO_START_${s.status}:${s.text}`)
    }

    console.log(`[EVOLUTION] Sesión iniciada/existente (${s.status})`)

    // Paso 2: Obtener QR
    const q = await evo('/sessions/default/qrcode')

    if (!q.ok) {
      console.error(`[EVOLUTION] Error QR: ${q.status} - ${q.text}`)
      throw new Error(`EVO_QR_${q.status}:${q.text}`)
    }

    // Normalizar respuesta - Evolution puede usar diferentes campos
    let data: any = {}
    try {
      data = JSON.parse(q.text)
    } catch (e) {
      console.error('[EVOLUTION] Error parsing JSON:', e)
    }

    // Buscar QR en diferentes campos posibles
    const qr = data.qrcode || data.qrCode || data.image || data.base64 || ''

    if (!qr) {
      console.error(`[EVOLUTION] QR vacío. Respuesta: ${q.text.slice(0, 200)}`)
      throw new Error(`EVO_QR_EMPTY:${q.text.slice(0, 200)}`)
    }

    console.log('[EVOLUTION] QR obtenido exitosamente')

    // Retornar siempre con campo normalizado "qrcode"
    return new Response(
      JSON.stringify({ qrcode: qr }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    )
  } catch (e: any) {
    console.error('[EVOLUTION] Error:', e)
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 502,
        headers: corsHeaders(),
      }
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

    const result = await evo('/sessions/default/status')

    if (result.status === 404) {
      return new Response(
        JSON.stringify({
          ok: true,
          session: { name: 'default', status: 'NOT_CREATED', connected: false, needsQR: true },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    if (!result.ok) {
      throw new Error(`EVO_STATE_${result.status}:${result.text}`)
    }

    const data = JSON.parse(result.text)
    const isConnected = data.state === 'open'
    const needsQR = data.state === 'connecting' || data.state === 'close'

    return new Response(
      JSON.stringify({
        ok: true,
        session: { name: 'default', status: data.state, connected: isConnected, needsQR },
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
 * Eliminar sesión
 */
export async function DELETE() {
  try {
    console.log('[EVOLUTION] DELETE: Eliminando sesión...')

    const result = await evo('/sessions/default', { method: 'DELETE' })

    if (!result.ok && result.status !== 404) {
      throw new Error(`EVO_DELETE_${result.status}:${result.text}`)
    }

    console.log('[EVOLUTION] Sesión eliminada')

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

