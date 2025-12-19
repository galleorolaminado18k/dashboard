/**
 * API Route: Webhook público para WhatsApp (Baileys)
 * - Guarda conversaciones/mensajes en CRM
 * - Soporta JID @lid y @s.whatsapp.net
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type AnyObj = Record<string, any>

function digitsFromJid(jid: string) {
    const left = jid.split('@')[0] || ''
    const digits = left.replace(/\D/g, '')
    return digits.length ? digits : null
}

function safeClientJid(jid?: string | null) {
    if (!jid) return null
    if (jid === 'status@broadcast') return null
    if (jid.endsWith('@g.us')) return null
    if (!jid.includes('@')) return null
    return jid
}

/**
 * Regla real:
 * - 1:1 => remoteJid (puede ser @lid)
 * - grupos/status => participant
 */
function pickClientJid(msg: AnyObj, payload: AnyObj) {
    const k = msg?.key || {}
    const remote = String(k.remoteJid || payload.from || '')
    const participant = String(k.participant || '')

    if (remote === 'status@broadcast') return participant || null
    if (remote.endsWith('@g.us')) return participant || null
    return remote || null
}

export async function POST(request: NextRequest) {
    try {
        const event = await request.json()
        const supabase = createClient()

        const eventType = event.event || event.type
        const payload = event.payload || event.data || event
        const message = payload.message || payload

        console.log('📩 Webhook recibido:', { eventType, ts: new Date().toISOString() })

        if (!(eventType === 'messages.upsert' || eventType === 'message' || eventType === 'message.any')) {
            return NextResponse.json({ ok: true, ignored: 'eventType', eventType })
        }

        // Ignorar mensajes propios
        if (message?.fromMe || message?.key?.fromMe) {
            return NextResponse.json({ ok: true, ignored: 'fromMe' })
        }

        const rawPicked = pickClientJid(message, payload)
        const client_jid = safeClientJid(rawPicked)

        if (!client_jid) {
            console.log('🔕 Ignorado (sin client_jid válido):', { rawPicked })
            return NextResponse.json({ ok: true, ignored: 'no_client_jid' })
        }

        const phone_norm = digitsFromJid(client_jid)

        // Línea activa (wa_number)
        const { data: waAccount } = await supabase
            .from('crm_whatsapp_accounts')
            .select('wa_number')
            .eq('key', 'active')
            .single()

        const wa_number = waAccount?.wa_number || '0000000000'

        console.log('🟨 JID ENTRANTE REAL:', { client_jid, phone_norm, wa_number })

        // Texto
        const body =
            message?.body ||
            message?.message?.conversation ||
            message?.message?.extendedTextMessage?.text ||
            ''

        const pushName = message?.pushName || message?.notifyName || ''

        // ✅ UPSERT REAL por (wa_number, client_jid)
        const { data: conversation, error: upsertError } = await supabase
            .from('crm_conversations')
            .upsert(
                {
                    wa_number,
                    client_jid,                 // guarda EXACTO (@lid o @s.whatsapp.net)
                    phone_norm: phone_norm,     // solo dígitos (para búsquedas)
                    phone: phone_norm || client_jid, // display
                    client_name: pushName || (phone_norm ? `Cliente ${phone_norm.slice(-4)}` : 'Cliente WhatsApp'),
                    last_message: body,
                    canal: 'whatsapp',
                    status: 'por-contestar',
                    timestamp: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'wa_number,client_jid' } // 👈 requiere el índice único del SQL
            )
            .select()
            .single()

        if (upsertError) {
            console.error('❌ Error upsert conversación:', upsertError)
            return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
        }

        // Guardar mensaje
        const incomingType = message?.type || payload?.type || 'text'
        const metadata: AnyObj = {}

        if (payload?.mediaUrl) metadata.mediaUrl = payload.mediaUrl
        if (payload?.mimetype) metadata.mimetype = payload.mimetype
        if (payload?.filename) metadata.filename = payload.filename
        if (message?.mediaUrl) metadata.mediaUrl = message.mediaUrl
        if (message?.mimetype) metadata.mimetype = message.mimetype
        if (message?.filename) metadata.filename = message.filename

        const { saveMessage } = await import('@/lib/crm-service')
        await saveMessage(conversation.id, 'client', body, incomingType as any, metadata, wa_number)

        console.log('✅ Conversación y mensaje guardados:', conversation.id)
        return NextResponse.json({ ok: true })
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
