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
    const { conversationId, phone, message, type = 'text', mediaUrl, mimetype, filename, caption, wa_number: waNumberFromBody } = body

    if (!phone && !conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere phone o conversationId' },
        { status: 400 }
      )
    }

    let targetPhone = phone
    let waNumber = waNumberFromBody || null

    // Si hay conversationId, preferimos el teléfono y wa_number guardados en la base de datos
    if (conversationId) {
      const supabase = createClient()
      const { data: conv, error: convError } = await supabase
        .from('crm_conversations')
        .select('phone, wa_number')
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
      if (conv?.wa_number) {
        waNumber = conv.wa_number
      }
    }

    // Mejor normalización y validación de número
    function normalizeAndValidatePhone(raw: string): string | null {
      if (!raw) return null;
      let cleaned = raw.replace(/[^\d]/g, ''); // Solo dígitos
      // Si empieza por 57 y tiene 12 dígitos, es válido para Colombia
      if (cleaned.startsWith('57') && cleaned.length === 12) return cleaned;
      // Si tiene 10 dígitos, anteponer 57
      if (cleaned.length === 10) return '57' + cleaned;
      // Si tiene entre 8 y 15 dígitos, devolver tal cual (internacional)
      if (cleaned.length >= 8 && cleaned.length <= 15) return cleaned;
      // Si no cumple, es inválido
      return null;
    }

    const cleanedPhone = normalizeAndValidatePhone(targetPhone);
    if (!cleanedPhone) {
      console.error('❌ Teléfono con formato inválido (después de limpiar):', targetPhone)
      return NextResponse.json({ ok: false, error: 'Teléfono con formato inválido' }, { status: 400 })
    }
    targetPhone = cleanedPhone;
    console.log('📞 Teléfono final para envío:', targetPhone)

    if (type === 'text' && !message) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere message para tipo texto' },
        { status: 400 }
      )
    }

    console.log(`📤 Enviando mensaje a ${targetPhone}:`, { type, message: message?.substring(0, 50), gateway: GATEWAY_URL, mediaUrl, mimetype, filename, caption })

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
      console.error('❌ Error del gateway:', gatewayData.error, { mediaUrl, mimetype, filename, caption })
      return NextResponse.json(
        { ok: false, error: gatewayData.error || 'Error enviando mensaje' },
        { status: 500 }
      )
    }

    // Guardar el mensaje en la base de datos
    if (conversationId) {
      const supabase = createClient()
      const contentToSave = type === 'text'
        ? message
        : caption || (type === 'audio' ? '[Nota de voz]' : `[${type}]`)
      const insertData = {
        conversation_id: conversationId,
        wa_number: waNumber || '0000000000', // Siempre guardar wa_number
        sender: 'agent',
        content: contentToSave,
        type,
        direction: 'outbound',
        metadata: { type, filename, mimetype, mediaUrl },
        timestamp: new Date().toISOString(),
        read: true,
        created_at: new Date().toISOString(),
      }
      // LOG: Verificar datos antes de guardar
      console.log('[CRM] Insertando en crm_messages:', JSON.stringify(insertData, null, 2))
      const { error: insertError } = await supabase
        .from('crm_messages')
        .insert(insertData)
      if (insertError) {
        console.error('❌ Error insertando mensaje en crm_messages:', insertError)
      } else {
        console.log('[CRM] Mensaje guardado correctamente en crm_messages')
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error en /api/crm/send:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
