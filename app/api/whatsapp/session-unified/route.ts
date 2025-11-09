import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://31.220.58.83:3000'
const KEY = process.env.WAHA_API_KEY || ''

console.log('[SESSION-UNIFIED] WAHA Base URL:', BASE)
console.log('[SESSION-UNIFIED] API Key configurada:', KEY ? 'SI' : 'NO')

function headers(useKey: boolean) {
  return {
    'Content-Type': 'application/json',
    ...(useKey && KEY ? { 'X-Api-Key': KEY } : {})
  }
}

async function call(path: string, init: RequestInit = {}, useKey = true) {
  const url = `${BASE}${path}`
  const r = await fetch(url, {
    ...init,
    headers: { ...headers(useKey), ...(init.headers || {}) },
    cache: 'no-store'
  })
  const text = await r.text()
  return {
    ok: r.ok,
    status: r.status,
    text,
    json: () => (text ? JSON.parse(text) : {})
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[SESSION-UNIFIED] Iniciando proceso completo: Health → Start → QR')

    // 1) Health check (con key; si falla por 401/403/422, reintentar sin key)
    console.log('[SESSION-UNIFIED] 1/3 - Verificando health...')
    let h = await call('/health', {}, true)
    if (!h.ok && [401, 403, 422].includes(h.status)) {
      console.log('[SESSION-UNIFIED] Health falló con key, reintentando sin key...')
      h = await call('/health', {}, false)
    }
    if (!h.ok) {
      throw new Error(`HEALTH_${h.status}:${h.text}`)
    }
    console.log('[SESSION-UNIFIED] ✅ Health OK')

    // 2) Start session (ruta real de WAHA)
    console.log('[SESSION-UNIFIED] 2/3 - Iniciando sesión...')
    let s = await call('/api/sessions/default/start', { method: 'POST' }, true)
    if (!s.ok && [401, 403, 422].includes(s.status)) {
      console.log('[SESSION-UNIFIED] Start falló con key, reintentando sin key...')
      s = await call('/api/sessions/default/start', { method: 'POST' }, false)
    }
    // 409 = sesión ya existe, es OK
    if (!s.ok && s.status !== 409) {
      throw new Error(`START_${s.status}:${s.text}`)
    }
    console.log('[SESSION-UNIFIED] ✅ Sesión iniciada (status:', s.status, ')')

    // 3) Obtener QR
    console.log('[SESSION-UNIFIED] 3/3 - Obteniendo QR...')
    let q = await call('/api/default/auth/qr', {}, true)
    if (!q.ok && [401, 403, 422].includes(q.status)) {
      console.log('[SESSION-UNIFIED] QR falló con key, reintentando sin key...')
      q = await call('/api/default/auth/qr', {}, false)
    }
    if (!q.ok) {
      throw new Error(`QR_${q.status}:${q.text}`)
    }
    console.log('[SESSION-UNIFIED] ✅ QR obtenido')

    // Retornar QR
    const qrData = q.json()
    return NextResponse.json({
      ok: true,
      qr: qrData.qr || qrData,
      message: 'QR generado exitosamente'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (e: any) {
    console.error('[SESSION-UNIFIED] ❌ Error:', e.message)
    return NextResponse.json({
      ok: false,
      error: 'WAHA_UNREACHABLE',
      detail: String(e)
    }, {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

