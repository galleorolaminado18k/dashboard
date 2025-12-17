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
    const { conversationId, phone, message, type = 'text', mediaUrl, mimetype, filename, caption } = body

    if (!phone && !conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere phone o conversationId' },
        { status: 400 }
      )
    }

    let targetPhone = phone

    // Si hay conversationId, preferimos el teléfono guardado en la base de datos
    if (conversationId) {
      const supabase = createClient()
      const { data: conv, error: convError } = await supabase
        .from('crm_conversations')
        .select('phone')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('❌ Error consultando conversación:', convError)
        return NextResponse.json(
          { ok: false, error: 'Error consultando la conversación' },
          { status: 500 }
        )
      }

      if (conv?.phone) {
        // Si el cliente envió un phone distinto, loggear advertencia y usar el de la BD
        if (phone && phone !== conv.phone) {
          console.warn('⚠️ phone enviado por el cliente difiere del phone de la conversación. Usando el de la BD.', { sentPhone: phone, dbPhone: conv.phone })
        }
        targetPhone = conv.phone
      } else if (!targetPhone) {
        return NextResponse.json(
          { ok: false, error: 'No se encontró el teléfono de la conversación' },
          { status: 404 }
        )
      }
    }

    // Normalizar y validar número: dejar sólo dígitos
    const normalizePhone = (p: string) => p.replace(/\D/g, '')
    if (!targetPhone || typeof targetPhone !== 'string') {
      return NextResponse.json({ ok: false, error: 'Teléfono inválido' }, { status: 400 })
    }

    let cleanedPhone = normalizePhone(targetPhone)

    // Validación mínima: longitud razonable (entrel 8 y 15 dígitos)
    if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
      console.error('❌ Teléfono con formato inválido:', targetPhone)
      return NextResponse.json({ ok: false, error: 'Teléfono con formato inválido' }, { status: 400 })
    }

    // Si el número no tiene código de país y parece local (10 dígitos), mantener comportamiento antiguo: prefijar 57
    if (!cleanedPhone.startsWith('57') && cleanedPhone.length === 10) {
      cleanedPhone = '57' + cleanedPhone
      console.log('ℹ️ Asumiendo código de país CO (57) para phone local; phone final:', cleanedPhone)
    }

    // Reemplazar targetPhone por cleanedPhone para enviar
    targetPhone = cleanedPhone

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
          caption, // Descripción opcional para medios
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

      // Para medios con caption, mostrar el caption como contenido
      const contentToSave = type === 'text'
        ? message
        : caption || (type === 'audio' ? '[Nota de voz]' : `[${type}]`)

      await supabase
        .from('crm_messages')
        .insert({ conversation_id: conversationId, content: contentToSave, direction: 'outbound', metadata: { type, filename, mimetype, mediaUrl }, created_at: new Date().toISOString() })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error en /api/crm/send:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
