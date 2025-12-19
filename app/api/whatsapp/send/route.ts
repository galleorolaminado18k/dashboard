import { NextRequest, NextResponse } from 'next/server'
import { wahaClient } from '@/lib/waha-client'

/**
 * POST /api/whatsapp/send
 * Enviar mensaje de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, countryCode = '57' } = body

    if (!phone || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Faltan parámetros requeridos: phone, message',
        },
        { status: 400 }
      )
    }

    // Verificar que la sesión esté conectada
    const isConnected = await wahaClient.isConnected('default')
    if (!isConnected) {
      return NextResponse.json(
        {
          ok: false,
          error: 'WhatsApp no está conectado. Escanea el código QR primero.',
        },
        { status: 503 }
      )
    }

    // Formatear el chatId
    const chatId = wahaClient.formatChatId(phone, countryCode)

    // Enviar mensaje
    const result = await wahaClient.sendText({
      chatId,
      text: message,
      session: 'default',
    })

    console.log('✅ Mensaje enviado:', {
      to: chatId,
      message: message.substring(0, 50) + '...',
      result,
    })

    return NextResponse.json({
      ok: true,
      message: 'Mensaje enviado correctamente',
      data: result,
    })
  } catch (error: any) {
    console.error('❌ Error enviando mensaje:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

