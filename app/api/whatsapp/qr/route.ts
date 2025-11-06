import { NextResponse } from 'next/server'

/**
 * GET /api/whatsapp/qr
 * Obtener código QR REAL de WhatsApp Web desde WAHA
 */
export async function GET() {
  try {
    const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000'

    // Obtener el QR REAL de WAHA
    const response = await fetch(`${WAHA_URL}/api/sessions/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error de WAHA:', errorText)

      return NextResponse.json({
        ok: false,
        error: `Error obteniendo QR de WAHA: ${response.status}`,
        hint: 'Asegúrate de que WAHA esté corriendo en Docker y que hayas iniciado una sesión.',
        needsSessionStart: true,
      }, { status: response.status })
    }

    const data = await response.json()

    // data.qr contiene el QR en formato base64
    if (!data.qr) {
      return NextResponse.json({
        ok: false,
        error: 'No se pudo obtener el código QR. La sesión puede estar ya conectada o en otro estado.',
        currentState: data.state || 'UNKNOWN',
      }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      qr: data.qr, // Base64 del QR REAL de WhatsApp Web
      message: 'Escanea este código QR con tu WhatsApp Business',
    })
  } catch (error: any) {
    console.error('Error conectando con WAHA:', error)

    return NextResponse.json({
      ok: false,
      error: error.message,
      hint: 'Verifica que WAHA esté corriendo: docker ps | grep waha',
    },
    { status: 500 })
  }
}

