/**
 * API Route: Estado del Gateway de WhatsApp
 * Verifica si el gateway está accesible desde Vercel
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://31.220.58.83:3010'

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    gateway_url: GATEWAY_URL,
    env_configured: !!process.env.WHATSAPP_GATEWAY_URL,
  }

  try {
    console.log('🔍 Verificando gateway en:', GATEWAY_URL)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${GATEWAY_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    result.gateway_reachable = true
    result.gateway_status = response.status
    result.gateway_response = data
    result.whatsapp_connected = data.isConnected
    result.phone = data.phone

    console.log('✅ Gateway accesible:', data)

    return NextResponse.json({
      ok: true,
      ...result
    })
  } catch (error: any) {
    console.error('❌ Error conectando al gateway:', error.message)

    result.gateway_reachable = false
    result.error = error.message
    result.hint = error.name === 'AbortError'
      ? 'Timeout - El gateway tardó demasiado en responder'
      : 'No se pudo conectar al gateway. Verifica que esté corriendo y el puerto esté abierto.'

    return NextResponse.json({
      ok: false,
      ...result
    }, { status: 503 })
  }
}

