/**
 * API Route: Webhook público para WhatsApp
 * Recibe mensajes entrantes desde Baileys / BuilderBot
 * Guarda conversaciones y mensajes correctamente (multi-cuenta)
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

        if (
            eventType !== 'messages.upsert' &&
            eventType !== 'message' &&
            eventType !== 'message.any'
        ) {
            return NextResponse.json({ ok: true, ignored: 'event_type' })
        }

        const payload = event.payload || event.data || event
        const msg = payload.message || payload
        const key = msg?.key || {}

        // ❌ Ignorar mensajes propios
        if (key.fromMe) {
            return NextResponse.json({ ok: true, ignored: 'fromMe' })
        }

        // ===============================
        // 📌 Extraer JID REAL DEL CLIENTE
        // ===============================
        function pickClientJid() {
            const remote = String(key.remoteJid || payload.from || '')
            const participant = String(key.participant || '')

            if (remote === 'status@broadcast') return null
            if (remote.endsWith('@g.us')) return participant || null

            return remote || null
        }

        const clientJidRaw = pickClientJid()
        if (!clientJidRaw) {
            return NextResponse.json({ ok: true, ignored: 'no_client_jid' })
        }

        const client_jid = clientJidRaw.replace('@lid', '@s.whatsapp.net')

        // ===============================
        // 📌 Normalizar teléfono (digits)
        // ===============================
        const digits = client_jid.split('@')[0].replace(/\D/g, '')
        const phone_norm =
            digits.length >= 10 && digits.length <= 15 ? digits : null

        const body =
            msg.body ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ''

        const pushName = msg.pushName || msg.notifyName || ''

        // ===============================
        // 📌 Obtener línea activa (wa_number)
        // ===============================
        const { data: waAccount } = await supabase
            .from('crm_whatsapp_accounts')
            .select('wa_number')
            .eq('key', 'active')
            .single()

        const wa_number = waAccount?.wa_number || '0000000000'

        console.log('🚨 JID ENTRANTE REAL:', {
            client_jid,
            phone_norm,
            wa_number,
        })

        // ===============================
        // 📌 UPSERT CONVERSACIÓN (CLAVE REAL)
        // UNIQUE (wa_number, client_jid)
        // ===============================
        const { data: conversation, error: upsertError } = await supabase
            .from('crm_conversations')
            .upsert(
                {
                    wa_number,
                    client_jid,
                    phone: phone_norm ?? digits ?? client_jid,
                    phone_norm,
                    client_name:
                        pushName || `Cliente ${digits?.slice(-4) || 'WhatsApp'}`,
                    last_message: body,
                    canal: 'whatsapp',
                    status: 'por-contestar',
                    timestamp: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'wa_number,client_jid' }
            )
            .select()
            .single()

        if (upsertError) {
            console.error('❌ Error upsert conversación:', upsertError)
            return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
        }

        // ===============================
        // 📌 Guardar mensaje
        // ===============================
        const { saveMessage } = await import('@/lib/crm-service')

        await saveMessage(
            conversation.id,
            'client',
            body,
            msg.type || 'text',
            {},
            wa_number
        )

        console.log('✅ Conversación y mensaje guardados:', conversation.id)

        return NextResponse.json({ ok: true, conversationId: conversation.id })
    } catch (error: any) {
        console.error('❌ Error webhook-public:', error)
        return NextResponse.json(
            { ok: false, error: error.message },
            { status: 500 }
        )
    }
}

/**
 * GET - Health check
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook público activo',
        timestamp: new Date().toISOString(),
    })
}
