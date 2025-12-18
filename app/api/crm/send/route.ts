import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { saveMessage } from '@/lib/crm-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://31.220.58.83:3010'

function toDigits(raw: string) {
    return String(raw || '').replace(/\D/g, '')
}

function buildDestJid(conv: any) {
    // 1) Si hay client_jid, RESPONDER A ESO TAL CUAL (incluye @lid)
    if (conv?.client_jid && typeof conv.client_jid === 'string' && conv.client_jid.includes('@')) {
        return conv.client_jid
    }
    // 2) Si no hay, construir desde phone_norm o phone
    const digits = toDigits(conv?.phone_norm || conv?.phone || '')
    if (digits.length < 10 || digits.length > 15) return null
    return `${digits}@s.whatsapp.net`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversationId, message, type = 'text', mediaUrl, mimetype, filename, caption } = body

        if (!conversationId) {
            return NextResponse.json({ ok: false, error: 'Se requiere conversationId' }, { status: 400 })
        }

        if (type === 'text' && !message) {
            return NextResponse.json({ ok: false, error: 'Se requiere message para tipo texto' }, { status: 400 })
        }

        if (!GATEWAY_URL || GATEWAY_URL.includes('localhost')) {
            return NextResponse.json({ ok: false, error: 'Gateway no configurado. Configura WHATSAPP_GATEWAY_URL en Vercel.' }, { status: 503 })
        }

        const supabase = createClient()
        const { data: conv, error: convError } = await supabase
            .from('crm_conversations')
            .select('*')
            .eq('id', conversationId)
            .single()

        if (convError || !conv) {
            console.error('❌ Error consultando conversación:', convError)
            return NextResponse.json({ ok: false, error: 'Error consultando conversación' }, { status: 500 })
        }

        const destJid = buildDestJid(conv)
        if (!destJid) {
            return NextResponse.json({ ok: false, error: 'Destinatario inválido (sin client_jid y phone inválido)' }, { status: 400 })
        }

        console.log('🚨 CRÍTICO - DESTINO FINAL AL GATEWAY:', destJid)

        // ✅ UNA SOLA LLAMADA AL GATEWAY Y CON "phone"
        const gatewayRes = await fetch(`${GATEWAY_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: destJid,
                message,
                type,
                mediaUrl,
                mimetype,
                filename,
                caption,
            }),
        })

        const gatewayData = await gatewayRes.json().catch(() => ({}))

        if (!gatewayData?.ok) {
            console.error('❌ Error del gateway:', gatewayData)
            return NextResponse.json({ ok: false, error: gatewayData?.error || 'Error enviando mensaje' }, { status: 500 })
        }

        // Guardar mensaje
        const contentToSave =
            type === 'text' ? message : caption || (type === 'audio' ? '[Nota de voz]' : `[${type}]`)

        await saveMessage(
            conversationId,
            'agent',
            contentToSave,
            type as any,
            { type, filename, mimetype, mediaUrl },
            conv?.wa_number || '0000000000'
        )

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('❌ Error en /api/crm/send:', error)
        return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
    }
}
