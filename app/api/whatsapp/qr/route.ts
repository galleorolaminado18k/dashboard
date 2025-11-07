import { NextResponse } from 'next/server'

// ✅ FIX PRODUCCIÓN: Lee desde variable de entorno para Vercel
const WAHA_URL = process.env.WAHA_BASE_URL || process.env.WAHA_URL || 'http://127.0.0.1:3000'

/**
 * GET /api/whatsapp/qr
 * Obtener código QR REAL de WhatsApp Web desde WAHA
 */
export async function GET() {
  try {
    console.log('[API QR] Solicitando QR a WAHA...')

    // Obtener el QR REAL de WAHA
    const response = await fetch(`${WAHA_URL}/api/session/default/qr`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API QR] Error de WAHA:', response.status, errorText)

      return NextResponse.json({
        ok: false,
        error: `Error obteniendo QR: ${response.status}`,
        hint: 'La sesión puede no estar lista aún. Espera unos segundos e intenta de nuevo.',
        needsSessionStart: true,
      }, { status: response.status })
    }

    const data = await response.json()
    console.log('[API QR] QR recibido de WAHA')

    // data.qr contiene el QR en formato base64 o data URL
    if (!data.qr) {
      console.warn('[API QR] No hay QR en la respuesta:', data)
      return NextResponse.json({
        ok: false,
        error: 'QR no disponible. La sesión puede estar ya conectada.',
        currentState: data.state || 'UNKNOWN',
      }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      qr: data.qr, // Base64 del QR REAL de WhatsApp Web
      message: 'Escanea este código QR con tu WhatsApp Business',
    })
  } catch (error: any) {
    console.error('[API QR] WAHA_URL configurada:', WAHA_URL)
    console.error('[API QR] Error fatal:', error)

    return NextResponse.json({
      error: `No se pudo conectar con WAHA: fetch failed`,
      hint: 'En producción, configura WAHA_BASE_URL en Vercel con tu URL pública de WAHA',
      wahaUrl: WAHA_URL,
      hint: 'Verifica que WAHA esté corriendo: docker ps | grep waha',
    { status: 502 })
    { status: 500 })
  }
}

