import { NextResponse } from 'next/server'

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000'

/**
 * GET /api/whatsapp/session
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    const response = await fetch(`${WAHA_URL}/api/sessions/default`, {
      method: 'GET',
    })

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        error: 'No se pudo obtener el estado de la sesión',
        needsSetup: true,
      }, { status: 500 })
    }

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      session: {
        name: data.name,
        status: data.status,
        connected: data.status === 'WORKING',
        needsQR: data.status === 'SCAN_QR_CODE' || data.status === 'STARTING',
      },
    })
  } catch (error: any) {
    console.error('Error getting session:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
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
    const webhookUrl = process.env.NEXT_PUBLIC_URL
      ? `${process.env.NEXT_PUBLIC_URL}/api/whatsapp/webhook`
      : undefined

    const config = {
      name: 'default',
      config: webhookUrl ? {
        webhooks: [{
          url: webhookUrl,
          events: ['message', 'message.any', 'session.status', 'state.change'],
        }],
      } : undefined,
    }

    const response = await fetch(`${WAHA_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        ok: false,
        error: `Error iniciando sesión: ${errorText}`,
      }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      ok: true,
      session: {
        name: data.name,
        status: data.status,
        message: 'Sesión iniciada. Obtén el código QR para conectar.',
      },
    })
  } catch (error: any) {
    console.error('Error starting session:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 })
  }
}

/**
 * DELETE /api/whatsapp/session
 * Detener y eliminar la sesión
 */
export async function DELETE() {
  try {
    // Primero detener
    await fetch(`${WAHA_URL}/api/sessions/default/stop`, {
      method: 'POST',
    })

    // Luego eliminar
    const response = await fetch(`${WAHA_URL}/api/sessions/default`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Error eliminando sesión')
    }

    return NextResponse.json({
      ok: true,
      message: 'Sesión eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error deleting session:', error)
    return NextResponse.json({
      ok: false,
      error: error.message,
    }, { status: 500 })
  }
}

