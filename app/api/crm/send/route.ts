/**
 * API Route: Enviar mensajes de WhatsApp
 * Envía mensajes a través del gateway de WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// URL del gateway de WhatsApp en el VPS
const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://31.220.58.83:3010'

/**
 * POST /api/crm/send
 * Enviar un mensaje de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, phone, message, type = 'text', mediaUrl, mimetype, filename } = body

    if (!phone && !conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere phone o conversationId' },
        { status: 400 }
      )
    }

    let targetPhone = phone

    // Si no hay phone pero sí conversationId, buscar el teléfono
    if (!targetPhone && conversationId) {
      const supabase = createClient()
      const { data: conv } = await supabase
        .from('crm_conversations')
        .select('phone')
        .eq('id', conversationId)
        .single()

      if (conv?.phone) {
        targetPhone = conv.phone
      } else {
        return NextResponse.json(
          { ok: false, error: 'No se encontró el teléfono de la conversación' },
          { status: 404 }
        )
      }
    }

    if (type === 'text' && !message) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere message para tipo texto' },
        { status: 400 }
      )
    }

    console.log(`📤 Enviando mensaje a ${targetPhone}:`, { type, message: message?.substring(0, 50), gateway: GATEWAY_URL })

    // Verificar que el gateway esté configurado
    if (!GATEWAY_URL || GATEWAY_URL === 'http://localhost:3010') {
      console.error('❌ WHATSAPP_GATEWAY_URL no configurado correctamente')
      return NextResponse.json(
        { ok: false, error: 'Gateway no configurado. Configura WHATSAPP_GATEWAY_URL en Vercel.' },
        { status: 503 }
      )
    }

    // Enviar al gateway con timeout
    let gatewayResponse: Response
    let gatewayData: any

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

      gatewayResponse = await fetch(`${GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          message,
          type,
          mediaUrl,
          mimetype,
          filename,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      gatewayData = await gatewayResponse.json()
    } catch (fetchError: any) {
      console.error('❌ Error de conexión con gateway:', fetchError.message)
      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo conectar con el gateway de WhatsApp: ${fetchError.message}`,
          hint: 'Verifica que el gateway esté corriendo en el VPS y que WHATSAPP_GATEWAY_URL esté configurado en Vercel'
        },
        { status: 503 }
      )
    }

    if (!gatewayData.ok) {
      console.error('❌ Error del gateway:', gatewayData.error)
      return NextResponse.json(
        { ok: false, error: gatewayData.error || 'Error enviando mensaje' },
        { status: 500 }
      )
    }

    // Guardar el mensaje en la base de datos
    if (conversationId) {
      const supabase = createClient()

      await supabase.from('crm_messages').insert({
        conversation_id: conversationId,
        sender: 'agent',
        content: message || `[${type}]`,
        type: type,
        timestamp: new Date().toISOString(),
        read: true,
      })

      // Actualizar la conversación
      await supabase
        .from('crm_conversations')
        .update({
          last_message: message || `[${type}]`,
          timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    }

    console.log('✅ Mensaje enviado correctamente')

    return NextResponse.json({
      ok: true,
      message: 'Mensaje enviado',
      type,
    })
  } catch (error: any) {
    console.error('❌ Error en /api/crm/send:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

