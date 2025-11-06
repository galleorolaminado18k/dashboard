import { NextResponse } from 'next/server'
import { wahaClient } from '@/lib/waha-client'

/**
 * GET /api/whatsapp/session
 * Obtener estado de la sesión actual
 */
export async function GET() {
  try {
    const session = await wahaClient.getSession('default')
    return NextResponse.json({
      ok: true,
      session: {
        name: session.name,
        status: session.status,
        connected: session.status === 'WORKING',
        needsQR: session.status === 'SCAN_QR_CODE',
      },
    })
  } catch (error: any) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        needsSetup: true,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp/session
 * Crear o iniciar una nueva sesión
 */
export async function POST() {
  try {
    // URL del webhook para recibir eventos
    const webhookUrl = process.env.NEXT_PUBLIC_URL
      ? `${process.env.NEXT_PUBLIC_URL}/api/whatsapp/webhook`
      : undefined

    const session = await wahaClient.startSession('default', webhookUrl)

    return NextResponse.json({
      ok: true,
      session: {
        name: session.name,
        status: session.status,
        message: 'Sesión iniciada. Escanea el código QR para conectar.',
      },
    })
  } catch (error: any) {
    console.error('Error starting session:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/whatsapp/session
 * Detener y eliminar la sesión
 */
export async function DELETE() {
  try {
    await wahaClient.stopSession('default')
    await wahaClient.deleteSession('default')

    return NextResponse.json({
      ok: true,
      message: 'Sesión eliminada correctamente',
    })
  } catch (error: any) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

