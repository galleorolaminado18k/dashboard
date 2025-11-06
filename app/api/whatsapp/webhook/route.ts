import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/whatsapp/webhook
 * Recibir eventos de WAHA (mensajes, cambios de estado, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    console.log('📩 Webhook recibido de WAHA:', {
      event: event.event,
      session: event.session,
      timestamp: new Date().toISOString(),
    })

    // Procesar diferentes tipos de eventos
    switch (event.event) {
      case 'message':
      case 'message.any':
        await handleIncomingMessage(event)
        break

      case 'session.status':
        await handleSessionStatus(event)
        break

      case 'state.change':
        await handleStateChange(event)
        break

      default:
        console.log('⚠️ Evento no manejado:', event.event)
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
 * Manejar mensaje entrante
 */
async function handleIncomingMessage(event: any) {
  const { payload } = event

  console.log('💬 Mensaje recibido:', {
    from: payload.from,
    text: payload.body,
    type: payload.type,
  })

  // TODO: Implementar lógica de negocio
  // - Guardar mensaje en base de datos
  // - Responder automáticamente
  // - Notificar a usuarios
  // - Actualizar CRM
}

/**
 * Manejar cambio de estado de sesión
 */
async function handleSessionStatus(event: any) {
  const { payload } = event

  console.log('🔄 Estado de sesión:', {
    session: event.session,
    status: payload.status,
  })

  // TODO: Implementar lógica de negocio
  // - Actualizar estado en base de datos
  // - Notificar a usuarios si se desconecta
  // - Reintentar conexión automáticamente
}

/**
 * Manejar cambio de estado general
 */
async function handleStateChange(event: any) {
  const { payload } = event

  console.log('📡 Cambio de estado:', {
    session: event.session,
    state: payload.state,
  })

  // TODO: Implementar lógica de negocio
  // - Registrar cambios de estado
  // - Monitorear salud de la conexión
}

