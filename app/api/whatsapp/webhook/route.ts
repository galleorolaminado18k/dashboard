import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateConversation,
  saveMessage,
  updateConversationStatus,
  CRM_ESTADOS,
  formatPhone,
} from '@/lib/crm-service'

/**
 * POST /api/whatsapp/webhook
 * Recibir eventos de WAHA/Baileys (mensajes, cambios de estado, etc)
 * Integra con el CRM para distribuir chats según filtros
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    console.log('📩 Webhook recibido:', {
      event: event.event || event.type,
      session: event.session,
      timestamp: new Date().toISOString(),
    })

    // Soportar diferentes formatos de eventos (WAHA, Baileys, etc.)
    const eventType = event.event || event.type

    // Procesar diferentes tipos de eventos
    switch (eventType) {
      case 'message':
      case 'message.any':
      case 'messages.upsert':
        await handleIncomingMessage(event)
        break

      case 'session.status':
      case 'connection.update':
        await handleSessionStatus(event)
        break

      case 'state.change':
        await handleStateChange(event)
        break

      default:
        console.log('⚠️ Evento no manejado:', eventType)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
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
 * Manejar mensaje entrante e integrarlo con el CRM
 */
async function handleIncomingMessage(event: any) {
  try {
    // Extraer datos del mensaje (soportar diferentes formatos)
    const payload = event.payload || event.data || event
    const message = payload.message || payload

    // Obtener información del remitente
    const from = message.from || message.key?.remoteJid || payload.from
    const body = message.body || message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || ''
    const pushName = message.pushName || message.notifyName || ''
    const type = message.type || 'text'

    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que 'from' no sea vacío ni inválido
    if (!from || typeof from !== 'string') {
      console.error('❌ Número de origen inválido o vacío:', from)
      return
    }

    // Ignorar mensajes propios (enviados por nosotros)
    if (message.fromMe || message.key?.fromMe) {
      console.log('📤 Mensaje enviado por nosotros, ignorando...')
      return
    }

    // Ignorar mensajes de grupos o broadcasts
    if (from?.includes('@g.us') || from?.includes('@broadcast')) {
      console.log('👥 Mensaje de grupo/broadcast, ignorando...')
      return
    }

    // ✅ Normalizar y validar número ANTES de guardar
    const formattedPhone = formatPhone(from)

    // Validación estricta: debe tener entre 10 y 15 dígitos
    if (!formattedPhone || formattedPhone.length < 10 || formattedPhone.length > 15) {
      console.error('❌ Número normalizado inválido, rechazando mensaje:', {
        original: from,
        formatted: formattedPhone
      })
      return
    }

    // Validación extra: no debe contener letras ni guiones
    if (!/^\d+$/.test(formattedPhone)) {
      console.error('❌ Número contiene caracteres inválidos después de normalizar:', formattedPhone)
      return
    }

    console.log('💬 Mensaje entrante para CRM:', {
      from: formattedPhone,
      original: from,
      text: body.substring(0, 50) + (body.length > 50 ? '...' : ''),
      type,
      clientName: pushName,
    })

    // Crear o actualizar conversación en el CRM con número validado
    const conversation = await getOrCreateConversation(
      formattedPhone, // ✅ Usar número ya normalizado y validado
      pushName,
      body
    )

    console.log('📋 Conversación CRM:', {
      id: conversation.id,
      status: conversation.status,
      phone: conversation.phone,
      clientType: conversation.client_type,
    })

    // Guardar el mensaje
    await saveMessage(
      conversation.id!,
      'client',
      body,
      type as any,
      {
        originalFrom: from,
        pushName,
        timestamp: message.timestamp || Date.now(),
      }
    )

    console.log('✅ Mensaje guardado en CRM')

    // Aquí puedes agregar lógica adicional:
    // - Respuestas automáticas
    // - Notificaciones en tiempo real
    // - Asignación a agentes específicos

  } catch (error) {
    console.error('❌ Error procesando mensaje para CRM:', error)
  }
}

/**
 * Manejar cambio de estado de sesión
 */
async function handleSessionStatus(event: any) {
  const payload = event.payload || event.data || event

  console.log('🔄 Estado de sesión:', {
    session: event.session,
    status: payload.status || payload.connection,
  })

  // Guardar estado de conexión si es necesario
  // Esto permite saber si WhatsApp está conectado o no
}

/**
 * Manejar cambio de estado general
 */
async function handleStateChange(event: any) {
  const payload = event.payload || event.data || event

  console.log('📡 Cambio de estado:', {
    session: event.session,
    state: payload.state,
  })
}

/**
 * GET - Verificación del webhook (para WAHA)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp Webhook activo',
    timestamp: new Date().toISOString(),
  })
}

