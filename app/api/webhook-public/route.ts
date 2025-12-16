/**
 * API Route: Webhook público para WhatsApp
 * Este endpoint NO tiene protección de Vercel
 *
 * En Vercel Dashboard:
 * Settings > Deployment Protection > Protection Bypass for Automation
 * Agregar: /api/webhook-public
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Desactivar cualquier cache
export const revalidate = 0

/**
 * POST /api/webhook-public
 * Recibir eventos de WhatsApp sin autenticación
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json()
    const supabase = createClient()

    console.log('📩 Webhook público recibido:', {
      event: event.event || event.type,
      timestamp: new Date().toISOString(),
    })

    const eventType = event.event || event.type

    // Procesar mensajes
    if (eventType === 'messages.upsert' || eventType === 'message' || eventType === 'message.any') {
      const payload = event.payload || event.data || event
      const message = payload.message || payload

      const from = message.from || message.key?.remoteJid || payload.from
      const body = message.body || message.message?.conversation ||
                   message.message?.extendedTextMessage?.text || ''
      const pushName = message.pushName || message.notifyName || ''

      // Ignorar mensajes propios y grupos
      if (message.fromMe || message.key?.fromMe) {
        return NextResponse.json({ ok: true, ignored: 'fromMe' })
      }
      if (from?.includes('@g.us') || from?.includes('@broadcast')) {
        return NextResponse.json({ ok: true, ignored: 'group' })
      }

      // Formatear teléfono
      const phone = from?.replace(/@.*$/, '').replace(/\D/g, '') || ''
      if (!phone || phone.length < 8) {
        return NextResponse.json({ ok: false, error: 'invalid phone' })
      }

      console.log('💬 Procesando mensaje:', { phone, body: body.substring(0, 50), pushName })

      // Buscar o crear conversación
      const { data: existing } = await supabase
        .from('crm_conversations')
        .select('*')
        .eq('phone', phone)
        .single()

      if (existing) {
        // Actualizar conversación existente
        await supabase
          .from('crm_conversations')
          .update({
            last_message: body,
            timestamp: new Date().toISOString(),
            unread: (existing.unread || 0) + 1,
            status: 'por-contestar',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        // Guardar mensaje
        await supabase
          .from('crm_messages')
          .insert({
            conversation_id: existing.id,
            sender: 'client',
            content: body,
            type: 'text',
            timestamp: new Date().toISOString(),
            read: false,
          })

        console.log('✅ Conversación actualizada:', existing.id)
      } else {
        // Crear nueva conversación
        const { data: newConv, error: convError } = await supabase
          .from('crm_conversations')
          .insert({
            phone,
            client_name: pushName || `Cliente ${phone.slice(-4)}`,
            last_message: body,
            timestamp: new Date().toISOString(),
            unread: 1,
            status: 'por-contestar',
            canal: 'whatsapp',
            client_type: 'Nuevo',
          })
          .select()
          .single()

        if (newConv) {
          // Guardar mensaje
          await supabase
            .from('crm_messages')
            .insert({
              conversation_id: newConv.id,
              sender: 'client',
              content: body,
              type: 'text',
              timestamp: new Date().toISOString(),
              read: false,
            })

          console.log('✅ Nueva conversación creada:', newConv.id)
        } else {
          console.error('❌ Error creando conversación:', convError)
        }
      }

      return NextResponse.json({ ok: true, processed: true })
    }

    return NextResponse.json({ ok: true, eventType })
  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

/**
 * GET - Verificación del webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp Webhook público activo',
    timestamp: new Date().toISOString(),
  })
}

