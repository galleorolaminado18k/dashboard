/**
 * API Route: Webhook público para WhatsApp
 * Endpoint sin auth para recibir eventos del gateway (Baileys/BuilderBot)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
    try {
        const event = await request.json()
        const supabase = createClient()

        const eventType = event.event || event.type
        console.log('📩 Webhook recibido:', eventType)

        // Solo procesamos mensajes
        if (!(eventType === 'messages.upsert' || eventType === 'message' || eventType === 'message.any')) {
            return NextResponse.json({ ok: true, eventType })
        }

        const payload = event.payload || event.data || event
        const msg = payload.message || payload

        // Ignorar mensajes propios
        if (msg?.fromMe || msg?.key?.fromMe) {
            return NextResponse.json({ ok: true, ignored: 'fromMe' })
        }

        // ---- 1) Determinar JID real para responder (NO inventar números) ----
        function pickClientJid(message: any) {
            const k = message?.key || {}
            const remote = String(k.remoteJid || payload.from || '')
            const participant = String(k.participant || '')
            const remoteAlt = String(k.remoteJidAlt || '')
            const participantAlt = String(k.participantAlt || '')

            // status/broadcast
            if (remote === 'status@broadcast') return participant || participantAlt || null

            // grupos
            if (remote.endsWith('@g.us')) return participant || participantAlt || null

            // 1:1 -> el que venga (puede ser @lid o @s.whatsapp.net)
            return remote || remoteAlt || null
        }

        const clientJid = pickClientJid(msg)

        if (!clientJid || clientJid === 'status@broadcast' || clientJid.endsWith('@g.us')) {
            return NextResponse.json({ ok: true, ignored: 'no_client_jid' })
        }

        // ---- 2) Normalización CORRECTA ----
        // OJO: si es @lid NO es teléfono. NO convertir a s.whatsapp.net.
        function digitsFromJid(jid: string) {
            return jid.split('@')[0].replace(/\D/g, '')
        }

        const isLid = clientJid.endsWith('@lid')
        const isWaNet = clientJid.endsWith('@s.whatsapp.net') || clientJid.endsWith('@c.us')

        const digits = digitsFromJid(clientJid)

        // phone_norm SOLO si realmente es wa-net (teléfono real)
        const phone_norm =
            isWaNet && digits.length >= 10 && digits.length <= 15 ? digits : null

        const pushName = msg.pushName || msg.notifyName || ''
        const body =
            msg.body ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ''

        // ---- 3) Línea activa (wa_number) ----
        const { data: waAccount } = await supabase
            .from('crm_whatsapp_accounts')
            .select('wa_number')
            .eq('key', 'active')
            .single()

        const wa_number = waAccount?.wa_number || '0000000000'

        console.log('🚨 JID ENTRANTE REAL:', {
            client_jid: clientJid,
            isLid,
            isWaNet,
            phone_norm,
            wa_number,
        })

        // ---- 4) Upsert de conversación (con unique wa_number+client_jid) ----
        // IMPORTANTE: siempre guardar client_jid EXACTO como llega (incluye @lid si aplica)
        const upsertPayload: any = {
            wa_number,
            client_jid: clientJid,
            phone: phone_norm ?? digits ?? clientJid, // display
            phone_norm, // para filtros (puede ser null si @lid)
            client_name: pushName || (phone_norm ? `Cliente ${phone_norm.slice(-4)}` : 'Cliente WhatsApp'),
            last_message: body,
            timestamp: new Date().toISOString(),
            canal: 'whatsapp',
            status: 'por-contestar',
            updated_at: new Date().toISOString(),
        }

        const { data: conversation, error: upsertError } = await supabase
            .from('crm_conversations')
            .upsert(upsertPayload, { onConflict: 'wa_number,client_jid' })
            .select('*')
            .single()

        if (upsertError) {
            console.error('❌ Error upsert conversación:', upsertError)
            return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
        }

        // ---- 5) Guardar mensaje ----
        const incomingType = msg.type || payload.type || 'text'
        const metadata: Record<string, any> = {}

        // media fields si llegan
        if (payload.mediaUrl) metadata.mediaUrl = payload.mediaUrl
        if (payload.mimetype) metadata.mimetype = payload.mimetype
        if (payload.filename) metadata.filename = payload.filename
        if (msg.mediaUrl) metadata.mediaUrl = msg.mediaUrl
        if (msg.mimetype) metadata.mimetype = msg.mimetype
        if (msg.filename) metadata.filename = msg.filename

        const { saveMessage } = await import('@/lib/crm-service')
        await saveMessage(
            conversation.id,
            'client',
            body,
            incomingType as any,
            metadata,
            wa_number
        )

        console.log('✅ Conversación y mensaje guardados:', conversation.id)

        return NextResponse.json({ ok: true, processed: true, conversationId: conversation.id })
    } catch (error: any) {
        console.error('❌ Error en webhook-public:', error)
        return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'WhatsApp Webhook público activo',
        timestamp: new Date().toISOString(),
    })
}
