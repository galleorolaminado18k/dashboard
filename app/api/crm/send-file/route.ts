/**
 * API Route: Upload y envío directo de archivos para WhatsApp
 * Convierte el archivo a base64 y lo envía al gateway
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://31.220.58.83:3010'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conversationId = formData.get('conversationId') as string
    const phone = formData.get('phone') as string
    const caption = formData.get('caption') as string || ''

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!conversationId && !phone) {
      return NextResponse.json({ ok: false, error: 'Se requiere conversationId o phone' }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: 'Archivo muy grande. Máximo 10MB.' }, { status: 400 })
    }

    console.log('📤 Procesando archivo:', file.name, file.type, file.size, 'bytes')

    // Obtener teléfono si solo tenemos conversationId
    let targetPhone = phone
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
        return NextResponse.json({ ok: false, error: 'No se encontró el teléfono' }, { status: 404 })
      }
    }

    // Convertir archivo a base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const base64DataUrl = `data:${file.type};base64,${base64}`

    // Determinar tipo de mensaje
    let type = 'document'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'
    else if (file.type.startsWith('audio/')) type = 'audio'

    console.log('📤 Enviando a gateway:', { phone: targetPhone, type, filename: file.name, size: file.size })

    // Enviar al gateway con el archivo como base64 data URL
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 segundos para archivos grandes

    try {
      const gatewayResponse = await fetch(`${GATEWAY_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          type,
          filename: file.name,
          mimetype: file.type,
          mediaData: base64DataUrl, // Enviar como data URL base64
          caption: caption || undefined,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const gatewayData = await gatewayResponse.json()

      console.log('📤 Respuesta gateway:', gatewayData)

      if (!gatewayData.ok) {
        console.error('❌ Error del gateway:', gatewayData.error)
        return NextResponse.json({ ok: false, error: gatewayData.error || 'Error enviando archivo' }, { status: 500 })
      }

      // Guardar mensaje en la base de datos
      if (conversationId) {
        const supabase = createClient()
        const contentToSave = caption || `[${type}: ${file.name}]`

        await supabase.from('crm_messages').insert({
          conversation_id: conversationId,
          sender: 'agent',
          content: contentToSave,
          type: type,
          timestamp: new Date().toISOString(),
          read: true,
        })

        await supabase
          .from('crm_conversations')
          .update({
            last_message: contentToSave,
            timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId)
      }

      console.log('✅ Archivo enviado correctamente')
      return NextResponse.json({ ok: true, message: 'Archivo enviado', type })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ ok: false, error: 'Timeout enviando archivo. Intenta con un archivo más pequeño.' }, { status: 504 })
      }
      console.error('❌ Error de conexión:', fetchError.message)
      return NextResponse.json({ ok: false, error: `Error de conexión: ${fetchError.message}` }, { status: 503 })
    }

  } catch (error: any) {
    console.error('❌ Error en send-file:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

