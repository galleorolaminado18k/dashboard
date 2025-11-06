import { NextResponse } from 'next/server'
import { wahaClient } from '@/lib/waha-client'

/**
 * GET /api/whatsapp/qr
 * Obtener código QR para escanear con WhatsApp
 */
export async function GET() {
  try {
    // Verificar que la sesión esté en estado SCAN_QR_CODE
    const session = await wahaClient.getSession('default')

    if (session.status !== 'SCAN_QR_CODE') {
      return NextResponse.json({
        ok: false,
        error: `La sesión está en estado: ${session.status}. Debe estar en SCAN_QR_CODE para obtener el QR.`,
        status: session.status,
        needsRestart: session.status === 'WORKING' || session.status === 'STOPPED',
      })
    }

    // Obtener el código QR
    const qrResponse = await wahaClient.getQRCode('default')

    if (!qrResponse.qr) {
      return NextResponse.json({
        ok: false,
        error: 'No se pudo obtener el código QR. Intenta reiniciar la sesión.',
      }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      qr: qrResponse.qr, // Base64 del QR
      message: 'Escanea este código QR con tu WhatsApp Business',
    })
  } catch (error: any) {
    console.error('Error getting QR:', error)

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        hint: 'Asegúrate de que WAHA esté corriendo y que hayas iniciado una sesión primero.',
      },
      { status: 500 }
    )
  }
}

