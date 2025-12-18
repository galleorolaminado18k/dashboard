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

    function extractJidAndDigits(remoteJid?: string | null) {
      const jid = remoteJid || null
      const digits = jid ? jid.split("@")[0].replace(/\D/g, "") : null
      return { jid, digits }
    }

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

      // 🔍 Lógica para extraer el JID real del cliente (según SOLUCIÓN REAL)
      function pickReplyJid(msg: any) {
        const k = msg?.key || {}
        const remote = String(k.remoteJid || payload.from || "")
        const participant = String(k.participant || "")
        const remoteAlt = String(k.remoteJidAlt || "")
        const participantAlt = String(k.participantAlt || "")

        // status/broadcast: el chat real puede ser participant (Baileys getChatId)
        if (remote === "status@broadcast") {
          return { jid: participant || participantAlt, jidAlt: participantAlt || null }
        }

        // grupos: responder al participant
        if (remote.endsWith("@g.us")) {
          return { jid: participant || participantAlt, jidAlt: participantAlt || null }
        }

        // 1:1: responder al remoteJid tal cual venga (puede ser @lid)
        return { jid: remote, jidAlt: remoteAlt || null }
      }

      function safeJid(s?: string | null) {
        if (!s) return null
        if (s.includes("@g.us")) return null
        if (s === "status@broadcast") return null
        return s
      }

      const { jid, jidAlt } = pickReplyJid(message)
      const clientJid = safeJid(jid)

      console.log("🚨 CRÍTICO - JID REAL ENTRANTE:", {
        remoteJid: message?.key?.remoteJid || payload.from,
        remoteJidAlt: message?.key?.remoteJidAlt,
        participant: message?.key?.participant,
        participantAlt: message?.key?.participantAlt,
        fromMe: message?.key?.fromMe,
        picked: clientJid,
        pickedAlt: jidAlt,
      })

      if (!clientJid) {
        console.log('🔕 Ignorado estado o grupo (no clientJid)')
        return NextResponse.json({ ok: true, ignored: 'no_client_jid' })
      }

      const { jid: client_jid, digits } = extractJidAndDigits(clientJid);
      const phone_norm = digits && digits.length >= 10 && digits.length <= 15 ? digits : null;

      const body = message.body || message.message?.conversation ||
                   message.message?.extendedTextMessage?.text || ''
      const pushName = message.pushName || message.notifyName || ''

      // Ignorar mensajes propios
      if (message.fromMe || message.key?.fromMe) {
        console.log('🔕 Ignorado mensaje propio')
        return NextResponse.json({ ok: true, ignored: 'fromMe' })
      }

      // Obtener la línea activa (wa_number)
      const { data: waAccount } = await supabase
        .from('crm_whatsapp_accounts')
        .select('wa_number')
        .eq('key', 'active')
        .single()
      
      const activeWaNumber = waAccount?.wa_number || '0000000000'

      // Guardar o actualizar conversación usando client_jid (según SOLUCIÓN REAL)
      const { data: conversation, error: upsertError } = await supabase
        .from("crm_conversations")
        .upsert({
          client_jid, // ✅ GUARDA EL JID EXACTO
          phone: phone_norm ?? (digits || clientJid), // display
          phone_norm, // display / filtros
          client_name: pushName || `Cliente ${digits?.slice(-4) || 'WhatsApp'}`,
          last_message: body,
          timestamp: new Date().toISOString(),
          canal: 'whatsapp',
          status: 'por-contestar',
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select()
        .single()

      if (upsertError) {
        console.error('❌ Error haciendo upsert de conversación:', upsertError)
        return NextResponse.json({ ok: false, error: upsertError.message })
      }

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
        const { saveMessage } = await import('@/lib/crm-service')
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
