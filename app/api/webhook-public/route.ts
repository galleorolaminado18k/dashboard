/**
 * API Route: Webhook público para WhatsApp (sin auth)
 * Guarda conversaciones + mensajes en CRM
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
        console.log('📩 Webhook recibido:', { eventType, ts: new Date().toISOString() })

        // Solo mensajes
        if (!(eventType === 'messages.upsert' || eventType === 'message' || eventType === 'message.any')) {
            return NextResponse.json({ ok: true, ignored: 'not_message_event', eventType })
        }

        const payload = event.payload || event.data || event
        const msg = payload.message || payload

        // -------- helpers ----------
        const stripNonDigits = (s: string) => s.replace(/\D/g, '')
        const toJidDigits = (jid: string | null) => {
            if (!jid) return null
            const left = jid.split('@')[0] || ''
            const d = stripNonDigits(left)
            if (d.length < 10 || d.length > 15) return null
            return d
        }

        function pickClientJid(m: any) {
            const k = m?.key || {}
            const remote = String(k.remoteJid || payload.from || '')
            const participant = String(k.participant || '')

            // Ignorar status
            if (remote === 'status@broadcast') return null

            // Grupos: usar participant (autor)
            if (remote.endsWith('@g.us')) return participant || null

            // 1:1: usar remote tal cual (puede ser @lid o @s.whatsapp.net)
            return remote || null
        }

        const clientJid = pickClientJid(msg)
        if (!clientJid) {
            console.log('🔕 Ignorado (sin clientJid o status/grupo)')
            return NextResponse.json({ ok: true, ignored: 'no_client_jid' })
        }

        // Ignorar mensajes propios
        if (msg?.fromMe || msg?.key?.fromMe) {
            console.log('🔕 Ignorado mensaje propio')
            return NextResponse.json({ ok: true, ignored: 'fromMe' })
        }

        const phone_norm = toJidDigits(clientJid) // dígitos limpios
        const pushName = msg.pushName || msg.notifyName || ''
        const body =
            msg.body ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ''

        // Línea activa (wa_number)
        const { data: waAccount } = await supabase
            .from('crm_whatsapp_accounts')
            .select('wa_number')
            .eq('key', 'active')
            .single()

        const wa_number = waAccount?.wa_number || '0000000000'

        console.log('🚨 JID ENTRANTE REAL:', {
            client_jid: clientJid,
            phone_norm,
            wa_number,
        })

        // 1) Buscar conversación existente por (wa_number + client_jid)
        const { data: existing, error: findErr } = await supabase
            .from('crm_conversations')
            .select('id')
            .eq('wa_number', wa_number)
            .eq('client_jid', clientJid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (findErr) {
            console.error('❌ Error buscando conversación:', findErr)
            return NextResponse.json({ ok: false, error: findErr.message }, { status: 500 })
        }

        const nowIso = new Date().toISOString()
        const convoPayload: any = {
            wa_number,
            client_jid: clientJid,
            phone: phone_norm || clientJid, // display
            phone_norm: phone_norm || null,
            client_name: pushName || (phone_norm ? `Cliente ${phone_norm.slice(-4)}` : 'Cliente WhatsApp'),
            last_message: body,
            timestamp: nowIso,
            canal: 'whatsapp',
            status: 'por-contestar',
            updated_at: nowIso,
        }

        let conversationId: string | null = null

        // 2) Update o Insert
        if (existing?.id) {
            const { data: updated, error: updErr } = await supabase
                .from('crm_conversations')
                .update(convoPayload)
                .eq('id', existing.id)
                .select('id')
                .single()

            if (updErr) {
                console.error('❌ Error actualizando conversación:', updErr)
                return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
            }
            conversationId = updated.id
        } else {
            const { data: inserted, error: insErr } = await supabase
                .from('crm_conversations')
                .insert(convoPayload)
                .select('id')
                .single()

            if (insErr) {
                console.error('❌ Error insertando conversación:', insErr)
                return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
            }
            conversationId = inserted.id
        }

        // 3) Guardar mensaje
        const incomingType = msg.type || payload.type || 'text'
        const metadata: Record<string, any> = {}

        // (Si ya mandas mediaUrl/mimetype desde tu gateway al webhook, lo guardamos)
        if (payload.mediaUrl) metadata.mediaUrl = payload.mediaUrl
        if (payload.mimetype) metadata.mimetype = payload.mimetype
        if (payload.filename) metadata.filename = payload.filename
        if (msg.mediaUrl) metadata.mediaUrl = msg.mediaUrl
        if (msg.mimetype) metadata.mimetype = msg.mimetype
        if (msg.filename) metadata.filename = msg.filename

        const { saveMessage } = await import('@/lib/crm-service')
        await saveMessage(
            conversationId!,
            'client',
            body,
            incomingType as any,
            metadata,
            wa_number
        )

        console.log('✅ Conversación y mensaje guardados:', conversationId)
        return NextResponse.json({ ok: true, processed: true, conversationId })
    } catch (error: any) {
        console.error('❌ Error en webhook-public:', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'WhatsApp Webhook público activo',
        timestamp: new Date().toISOString(),
    })
}
