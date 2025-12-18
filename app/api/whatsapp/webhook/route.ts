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

    // 🔍 Lógica sugerida por el usuario para extraer el JID real del cliente
    function pickClientJid(m: any) {
      const k = m?.key || {}
      const remote = String(k.remoteJid || payload.from || "")
      const participant = String(k.participant || "")

      // grupo => el cliente es participant
      if (remote.endsWith("@g.us")) return participant

      // 1:1 => el cliente es remoteJid (aunque fromMe sea true/false)
      return remote
    }

    const clientJid = pickClientJid(message)
    
    // ⚠️ FILTRO CRÍTICO Sugerido: Ignorar estados y grupos
    const remoteJid = message.key?.remoteJid || payload.from || clientJid;
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      console.log('🔕 Ignorado estado o grupo (estructura remoteJid)', { remoteJid })
      return
    }

    const body = message.body || message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || ''
    const pushName = message.pushName || message.notifyName || ''
    const type = message.type || 'text'

    // ⚠️ VALIDACIÓN CRÍTICA: Verificar que 'clientJid' no sea vacío ni inválido
    if (!clientJid || typeof clientJid !== 'string') {
      console.error('❌ JID de origen inválido o vacío:', clientJid)
      return
    }

    // Ignorar mensajes propios (enviados por nosotros)
    if (message.fromMe || message.key?.fromMe) {
      console.log('📤 Mensaje enviado por nosotros, ignorando...')
      return
    }

    // ✅ Normalizar y validar número ANTES de guardar
    const formattedPhone = formatPhone(clientJid)

    // Validación estricta: debe tener entre 10 y 16 dígitos
    if (!formattedPhone || formattedPhone.length < 10 || formattedPhone.length > 16) {
      console.error('❌ Número normalizado inválido, rechazando mensaje:', {
        original: clientJid,
        formatted: formattedPhone
      })
      return
    }

    // Obtener la línea activa (wa_number)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: waAccount } = await supabase
      .from('crm_whatsapp_accounts')
      .select('wa_number')
      .eq('key', 'active')
      .single()
    
    const activeWaNumber = waAccount?.wa_number || '0000000000'

    console.log('💬 Mensaje entrante para CRM:', {
      from: formattedPhone,
      original: clientJid,
      remoteJid,
      activeWaNumber,
      text: body.substring(0, 50) + (body.length > 50 ? '...' : ''),
      type,
      clientName: pushName,
    })

    // Crear o actualizar conversación en el CRM con número validado y JID
    const conversation = await getOrCreateConversation(
      formattedPhone, 
      pushName,
      body,
      remoteJid,
      activeWaNumber
    )

    console.log('📋 Conversación CRM:', {
      id: conversation.id,
      status: conversation.status,
      phone: conversation.phone,
      remote_jid: conversation.remote_jid,
    })

    // Guardar el mensaje
    await saveMessage(
      conversation.id!,
      'client',
      body,
      type as any,
      {
        originalFrom: clientJid,
        remoteJid,
        pushName,
        timestamp: message.timestamp || Date.now(),
      },
      activeWaNumber
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

