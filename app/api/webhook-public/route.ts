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

    // Helper: subir data URL (base64) a Cloudinary y devolver metadata actualizada
    async function uploadDataUrlToCloudinary(metadata: Record<string, any>) {
      try {
        if (!metadata?.mediaUrl || typeof metadata.mediaUrl !== 'string') return metadata

        const MAX = 10 * 1024 * 1024
        let mediaDataUrl: string | null = null

        // Si es data URL ya lista
        if (metadata.mediaUrl.startsWith('data:')) {
          mediaDataUrl = metadata.mediaUrl
        } else if (metadata.mediaUrl.startsWith('http://') || metadata.mediaUrl.startsWith('https://')) {
          // Intentar descargar el recurso remoto
          try {
            // Hacer HEAD para conocer tamaño y tipo si es posible
            const headRes = await fetch(metadata.mediaUrl, { method: 'HEAD' })
            let contentLength = headRes.headers.get('content-length')
            const contentType = metadata.mimetype || headRes.headers.get('content-type') || ''

            if (contentLength) {
              const size = parseInt(contentLength, 10)
              if (!isNaN(size) && size > MAX) {
                console.warn('⚠️ Recurso remoto demasiado grande, se omitirá mediaUrl:', size)
                delete metadata.mediaUrl
                return metadata
              }
            }

            // Descargar el recurso completo
            const getRes = await fetch(metadata.mediaUrl)
            if (!getRes.ok) {
              console.warn('⚠️ No se pudo descargar recurso remoto:', getRes.status)
              return metadata
            }

            const arrayBuffer = await getRes.arrayBuffer()
            if (arrayBuffer.byteLength > MAX) {
              console.warn('⚠️ Recurso descargado supera el máximo, omitiendo mediaUrl')
              delete metadata.mediaUrl
              return metadata
            }

            const b64 = Buffer.from(arrayBuffer).toString('base64')
            const mime = contentType || metadata.mimetype || 'application/octet-stream'
            mediaDataUrl = `data:${mime};base64,${b64}`
            // actualizar mimetype si estaba ausente
            if (!metadata.mimetype) metadata.mimetype = mime
          } catch (downloadErr) {
            console.warn('⚠️ Error descargando recurso remoto:', downloadErr)
            return metadata
          }
        } else {
          // No es data ni http
          return metadata
        }

        if (!mediaDataUrl) return metadata

        // Ahora tenemos mediaDataUrl y podemos medir
        const base64 = mediaDataUrl.split(',')[1] || ''
        const byteLength = Buffer.from(base64, 'base64').length
        if (byteLength > MAX) {
          console.warn('⚠️ Media demasiado grande para subir a Cloudinary, se omitirá mediaUrl')
          delete metadata.mediaUrl
          return metadata
        }

        // Cloudinary config (usar env vars si están definidas)
        const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dusyyg1dd'
        const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'galleorolaminadosubida'

        // Determinar resourceType
        let resourceType = 'raw'
        if (metadata.mimetype && metadata.mimetype.startsWith('image/')) resourceType = 'image'
        else if (metadata.mimetype && (metadata.mimetype.startsWith('video/') || metadata.mimetype.startsWith('audio/'))) resourceType = 'video'

        const cloudForm = new FormData()
        cloudForm.append('file', mediaDataUrl)
        cloudForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
        cloudForm.append('folder', 'whatsapp-media')

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
        const uploadRes = await fetch(uploadUrl, { method: 'POST', body: cloudForm })
        const result = await uploadRes.json()

        if (result && result.secure_url) {
          console.log('✅ Subido a Cloudinary desde webhook-public:', result.secure_url)
          metadata.mediaUrl = result.secure_url
          metadata.cloudinary_id = result.public_id
          metadata.cloudinary_raw = result
        } else {
          console.error('❌ Error subiendo a Cloudinary desde webhook-public:', result)
        }

        return metadata
      } catch (err) {
        console.error('❌ Excepción subiendo data URL a Cloudinary:', err)
        return metadata
      }
    }

    // Procesar mensajes
    if (eventType === 'messages.upsert' || eventType === 'message' || eventType === 'message.any') {
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

      function digitsFromJid(jid: string) {
        if (!jid) return null
        const base = jid.split("@")[0]
        const digits = base.replace(/\D/g, "")
        return digits || null
      }

    const clientJid = pickClientJid(message)
    const rawPhone = digitsFromJid(clientJid)

    // ⚠️ FILTRO CRÍTICO Sugerido: Ignorar estados y grupos (algunos grupos ya se filtran por pickClientJid si remoteJid es null)
    const remoteJid = message.key?.remoteJid || payload.from || clientJid;
    if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      console.log('🔕 Ignorado estado o grupo (estructura remoteJid)', { remoteJid })
      return NextResponse.json({ ok: true, ignored: 'broadcast_or_group' })
    }

    const body = message.body || message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || ''
    const pushName = message.pushName || message.notifyName || ''

    // 🔍 LOG DETALLADO: Ver QUÉ está llegando
    console.log('🔍 WEBHOOK DEBUG:', {
      clientJid,
      remoteJid,
      rawPhone,
      body: body?.substring(0, 50),
      pushName,
      fromMe: message.fromMe || message.key?.fromMe,
    })

    // Ignorar mensajes propios
    if (message.fromMe || message.key?.fromMe) {
      console.log('🔕 Ignorado mensaje propio')
      return NextResponse.json({ ok: true, ignored: 'fromMe' })
    }

    // ✅ NORMALIZAR teléfono correctamente (Colombia: 57XXXXXXXXXX)
    function normalizePhone(cleaned: string | null): string | null {
      if (!cleaned) return null
      
      // Validar longitud mínima
      if (cleaned.length < 8) return null

      // Colombia: 10 dígitos con 3 → 57XXXXXXXXXX
      if (cleaned.length === 10 && cleaned.startsWith('3')) {
        return `57${cleaned}`
      }

      // Ya tiene 12 dígitos y empieza con 57 → correcto
      if (cleaned.length === 12 && cleaned.startsWith('57')) {
        return cleaned
      }

      // Evitar duplicación 5757XXXXXXXXXX
      if (cleaned.startsWith('5757')) {
        return `57${cleaned.slice(4)}`
      }

      // Internacional (8-16 dígitos)
      if (cleaned.length >= 8 && cleaned.length <= 16) {
        return cleaned
      }

      return null
    }

    const phone = normalizePhone(rawPhone)
    if (!phone) {
      console.warn('⚠️ Número inválido recibido en webhook:', { clientJid, rawPhone, phone })
      return NextResponse.json({ ok: false, error: 'invalid phone' })
    }

    // Obtener la línea activa (wa_number)
    const { data: waAccount } = await supabase
      .from('crm_whatsapp_accounts')
      .select('wa_number')
      .eq('key', 'active')
      .single()
    
    const activeWaNumber = waAccount?.wa_number || '0000000000'

    console.log('✅ Datos procesados:', { original: clientJid, normalized: phone, remoteJid, activeWaNumber })

    // 🚨 LOG CRÍTICO: Ver número exacto antes de guardar en DB
    console.log('🚨 CRÍTICO - Guardando conversación:', { phone, remoteJid, activeWaNumber, name: pushName })

    // Usar la función centralizada para obtener o crear conversación
    const { getOrCreateConversation, saveMessage } = await import('@/lib/crm-service')
    
    const conversation = await getOrCreateConversation(
      phone,
      pushName,
      body,
      remoteJid,
      activeWaNumber
    )

    if (conversation) {
      // Preparar metadata
      const incomingType = message.type || payload.type || 'text'
      const metadata: Record<string, any> = {}
      if (payload.mediaUrl) metadata.mediaUrl = payload.mediaUrl
      if (payload.mimetype) metadata.mimetype = payload.mimetype
      if (payload.filename) metadata.filename = payload.filename
      if (message.mediaUrl) metadata.mediaUrl = message.mediaUrl
      if (message.mimetype) metadata.mimetype = message.mimetype
      if (message.filename) metadata.filename = message.filename

      // Subir si es data URL
      await uploadDataUrlToCloudinary(metadata)

      // Guardar mensaje
      await saveMessage(
        conversation.id!,
        'client',
        body,
        incomingType as any,
        metadata,
        activeWaNumber
      )

      console.log('✅ Mensaje y conversación procesados:', conversation.id)
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
