import { NextResponse } from 'next/server'

const WAHA_URL = process.env.WAHA_URL || 'http://127.0.0.1:3000'

/**
 * GET /api/whatsapp/session
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    console.log('[API] Verificando estado de sesión en WAHA...')
    const response = await fetch(`${WAHA_URL}/api/session/default/state`, {
      method: 'GET',
    })

    if (!response.ok) {
      console.error('[API] Error obteniendo estado:', response.status)
      return NextResponse.json({
        ok: false,
        error: 'No se pudo obtener el estado de la sesión',
        needsSetup: true,
      }, { status: 500 })
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
    })
  } catch (error: any) {
    console.error('[API] Error conectando con WAHA:', error)
    return NextResponse.json({
      ok: false,
      error: `WAHA no responde. ¿Está corriendo? Error: ${error.message}`,
      needsSetup: true,
    }, { status: 500 })
  }
}

/**
 * POST /api/whatsapp/session
 * Crear o iniciar una nueva sesión en WAHA
 */
export async function POST() {
  try {
    console.log('[API] Iniciando sesión de WhatsApp en WAHA...')

    // Intentar iniciar la sesión
    const response = await fetch(`${WAHA_URL}/api/session/default/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('[API] Respuesta de WAHA:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Error de WAHA:', errorText)
      return NextResponse.json({
        ok: false,
        error: `WAHA respondió con error: ${errorText}`,
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('[API] Sesión iniciada:', data)

    return NextResponse.json({
      ok: true,
      session: {
        name: 'default',
        status: data.state || data.status || 'STARTING',
        message: 'Sesión iniciada. Obtén el código QR para conectar.',
      },
    })
  } catch (error: any) {
    console.error('[API] Error fatal:', error)
    return NextResponse.json({
      ok: false,
      error: `No se pudo conectar con WAHA: ${error.message}. Verifica que Docker esté corriendo.`,
    }, { status: 500 })
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
    const response = await fetch(`${WAHA_URL}/api/session/default/stop`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Error deteniendo sesión')
    }

    return NextResponse.json({
      ok: true,
      message: 'Sesión detenida correctamente',
    })
  } catch (error: any) {
    console.error('[API] Error deteniendo sesión:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 })
  }
}

