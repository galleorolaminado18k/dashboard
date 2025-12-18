import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { saveMessage } from "@/lib/crm-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://31.220.58.83:3010"

function buildToJid(conversation: any) {
    const jid = conversation?.client_jid
    if (jid && typeof jid === "string" && jid.includes("@")) return jid

    const raw = String(conversation?.phone_norm || conversation?.phone || "")
    const digits = raw.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 15) return null
    return `${digits}@s.whatsapp.net`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { conversationId, message, type = "text", mediaUrl, mimetype, filename, caption } = body

        if (!conversationId) {
            return NextResponse.json({ ok: false, error: "Se requiere conversationId" }, { status: 400 })
        }

        const supabase = createClient()
        const { data: conv, error: convError } = await supabase
            .from("crm_conversations")
            .select("*")
            .eq("id", conversationId)
            .single()

        if (convError || !conv) {
            console.error("❌ Error consultando conversación:", convError)
            return NextResponse.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 })
        }

        const to_jid = buildToJid(conv)
        if (!to_jid) {
            return NextResponse.json({ ok: false, error: "Destinatario inválido" }, { status: 400 })
        }

        console.log("🚨 CRÍTICO - JID FINAL que se enviará al gateway:", to_jid)

        const res = await fetch(`${GATEWAY_URL}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: to_jid, message, type, mediaUrl, mimetype, filename, caption }),
        })
        const gatewayData = await res.json().catch(() => ({}))

        if (!gatewayData?.ok) {
            console.error("❌ Error del gateway:", gatewayData)
            return NextResponse.json({ ok: false, error: gatewayData?.error || "Gateway error" }, { status: 500 })
        }

        const waNumber = conv?.wa_number || conv?.metadata?.wa_number || "0000000000"
        const contentToSave =
            type === "text" ? message : caption || (type === "audio" ? "[Nota de voz]" : `[${type}]`)

        await saveMessage(conversationId, "agent", contentToSave, type as any, { type, filename, mimetype, mediaUrl }, waNumber)

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        console.error("❌ Error en /api/crm/send:", e)
        return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
    }
}
