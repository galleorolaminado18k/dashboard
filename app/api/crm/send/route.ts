/**
 * API Route: Enviar mensajes de WhatsApp
 * Envía mensajes a través del gateway de WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { formatPhone, saveMessage } from '@/lib/crm-service'

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

    // Si hay conversationId, SIEMPRE usar el teléfono y wa_number de la base de datos
    if (conversationId) {
      const supabase = createClient()
      const { data: conv, error: convError } = await supabase
        .from('crm_conversations')
        .select('phone, wa_number, client_name')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('❌ Error consultando conversación:', convError)
        return NextResponse.json(
          { ok: false, error: 'Error consultando la conversación' },
          { status: 500 }
        )
      }

      // 🚨 LOG CRÍTICO: Ver qué phone está en la BD para esta conversación
      console.log('🚨 CRÍTICO ENVÍO - conversationId:', conversationId, '| Phone en BD:', conv?.phone, '| Cliente:', conv?.client_name, '| Phone recibido del frontend:', phone)

      if (conv?.phone) {
        // SIEMPRE usar el phone de la BD, ignorar el enviado por el cliente
        targetPhone = conv.phone
        console.log('✅ Usando phone de BD:', targetPhone)
      } else {
        return NextResponse.json(
          { ok: false, error: 'No se encontró el teléfono de la conversación' },
          { status: 404 }
        )
      }
      if (conv?.wa_number) {
        waNumber = conv.wa_number
      }
    } else {
      // Si no hay conversationId, debe venir phone en el request
      if (!targetPhone) {
        return NextResponse.json(
          { ok: false, error: 'Se requiere phone si no hay conversationId' },
          { status: 400 }
        )
      }
    }

    // Normalización y validación de número usando la lógica unificada
    const cleanedPhone = formatPhone(targetPhone);
    if (!cleanedPhone) {
      console.error('❌ Teléfono con formato inválido (después de limpiar):', targetPhone)
      return NextResponse.json({ ok: false, error: 'Teléfono con formato inválido' }, { status: 400 })
    }
    targetPhone = cleanedPhone;

    // 🚨 LOG CRÍTICO FINAL: Ver número exacto que se enviará al gateway
    console.log('🚨 CRÍTICO - Número FINAL que se enviará al gateway:', targetPhone, '| Mensaje:', message?.substring(0, 30))

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

    // Guardar el mensaje en la base de datos usando la función centralizada
    if (conversationId) {
      try {
        const contentToSave = type === 'text'
          ? message
          : caption || (type === 'audio' ? '[Nota de voz]' : `[${type}]`)
        
        await saveMessage(
          conversationId,
          'agent',
          contentToSave,
          type as any,
          { type, filename, mimetype, mediaUrl },
          waNumber || '0000000000'
        )
        console.log('[CRM] Mensaje guardado correctamente en CRM')
      } catch (saveError) {
        console.error('❌ Error guardando mensaje en CRM:', saveError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Error en /api/crm/send:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
