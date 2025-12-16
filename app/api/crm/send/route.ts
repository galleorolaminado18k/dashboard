/**
 * API Route: CRM Send Message
 * Envía mensaje por WhatsApp y lo guarda en el CRM
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveMessage, updateConversationStatus, CRM_ESTADOS } from '@/lib/crm-service'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuración del Gateway de WhatsApp
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || process.env.WAHA_BASE_URL || ''

/**
 * POST /api/crm/send
 * Enviar mensaje desde el CRM por WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, phone, message, updateStatus } = body

    if (!phone || !message) {
      return NextResponse.json(
        { ok: false, error: 'phone y message son requeridos' },
        { status: 400 }
      )
    }

    // Formatear número
    let formattedPhone = phone.replace(/\D/g, '')
    if (!formattedPhone.startsWith('57') && formattedPhone.length === 10) {
      formattedPhone = '57' + formattedPhone
    }

    console.log('📤 Enviando mensaje desde CRM:', {
      to: formattedPhone,
      messagePreview: message.substring(0, 50) + '...',
    })

    // Intentar enviar por el Gateway de WhatsApp
    let sent = false
    let sendError = null

    if (GATEWAY_URL) {
      try {
        const response = await fetch(`${GATEWAY_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
          }),
        })

        if (response.ok) {
          sent = true
          console.log('✅ Mensaje enviado por Gateway')
        } else {
          const errorData = await response.json().catch(() => ({}))
          sendError = errorData.error || `Error ${response.status}`
        }
      } catch (error: any) {
        sendError = error.message
        console.error('❌ Error enviando por Gateway:', error.message)
      }
    }

    // Intentar por la API interna si el Gateway falló
    if (!sent) {
      try {
        const internalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
          }),
        })

        if (internalResponse.ok) {
          sent = true
          console.log('✅ Mensaje enviado por API interna')
        }
      } catch (error: any) {
        console.error('❌ Error enviando por API interna:', error.message)
      }
    }

    // Guardar mensaje en el CRM (incluso si no se pudo enviar por WhatsApp)
    if (conversationId) {
      try {
        await saveMessage(
          conversationId,
          'agent',
          message,
          'text',
          {
            sent,
            sendError,
            sentAt: new Date().toISOString(),
          }
        )

        // Actualizar estado si se especifica
        if (updateStatus) {
          await updateConversationStatus(conversationId, updateStatus)
        }

        // Actualizar last_message en la conversación
        const supabase = createClient()
        await supabase
          .from('crm_conversations')
          .update({
            last_message: message,
            timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)

        console.log('💾 Mensaje guardado en CRM')
      } catch (error) {
        console.error('❌ Error guardando en CRM:', error)
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      message: sent ? 'Mensaje enviado correctamente' : 'Mensaje guardado pero no enviado por WhatsApp',
      error: sendError,
    })
  } catch (error: any) {
    console.error('❌ Error en CRM send:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

