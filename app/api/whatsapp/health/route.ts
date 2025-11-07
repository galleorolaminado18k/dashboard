import { NextResponse } from 'next/server'

// ✅ FIX PRODUCCIÓN: Lee desde variable de entorno para Vercel
const WAHA_URL = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'

/**
 * GET /api/whatsapp/health
 * Verificar que WAHA esté corriendo
 */
export async function GET() {
  try {
    console.log('[HEALTH] Verificando WAHA en:', WAHA_URL)

    const response = await fetch(`${WAHA_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 segundos timeout
    })

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        waha: 'unhealthy',
        url: WAHA_URL,
        error: `WAHA respondió con status ${response.status}`,
      }, { status: 503 })
    }

    const data = await response.json()
    console.log('[HEALTH] WAHA está funcionando:', data)

    return NextResponse.json({
      ok: true,
      waha: 'healthy',
      url: WAHA_URL,
      data,
    })
  } catch (error: any) {
    console.error('[HEALTH] WAHA no responde:', error.message)

    return NextResponse.json({
      ok: false,
      waha: 'offline',
      url: WAHA_URL,
      error: error.message,
      hint: 'Ejecuta: docker-compose -f docker-compose.waha.yml up -d',
    }, { status: 503 })
  }
}

