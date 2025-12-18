import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function extractDigitsFromJid(jid: string) {
    return jid.split("@")[0].replace(/\D/g, "")
}

function safeClientJid(jid?: string | null) {
    if (!jid) return null
    if (jid === "status@broadcast") return null
    if (jid.includes("@g.us")) return null
    return jid
}

export async function POST(request: NextRequest) {
    try {
        const event = await request.json()
        const supabase = createClient()
        const eventType = event.event || event.type

        if (eventType !== "messages.upsert" && eventType !== "message" && eventType !== "message.any") {
            return NextResponse.json({ ok: true, eventType })
        }

        const payload = event.payload || event.data || event
        const msg = (payload.message || payload) as any
        const k = msg?.key || {}

        // 1) detectar jid real entrante
        const remote = String(k.remoteJid || payload.from || "")
        const participant = String(k.participant || "")

        let picked = remote
        if (remote === "status@broadcast") picked = participant
        if (remote.endsWith("@g.us")) picked = participant

        const client_jid = safeClientJid(picked)

        console.log("🚨 CRÍTICO - JID REAL ENTRANTE:", {
            remoteJid: k.remoteJid || payload.from,
            participant: k.participant,
            fromMe: k.fromMe,
            picked: client_jid,
        })

        if (!client_jid) return NextResponse.json({ ok: true, ignored: "no_client_jid" })
        if (k.fromMe) return NextResponse.json({ ok: true, ignored: "fromMe" })

        const digits = extractDigitsFromJid(client_jid)
        const phone_norm = digits.length >= 10 && digits.length <= 15 ? digits : null

        const body =
            msg.body ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""

        const pushName = msg.pushName || msg.notifyName || ""

        // 2) leer wa_number activo
        const { data: waAccount } = await supabase
            .from("crm_whatsapp_accounts")
            .select("wa_number")
            .eq("key", "active")
            .single()

        const activeWaNumber = waAccount?.wa_number || "0000000000"

        // 3) UPSERT correcto: wa_number + client_jid (no por id)
        const { data: conversation, error: upsertError } = await supabase
            .from("crm_conversations")
            .upsert(
                {
                    wa_number: activeWaNumber,
                    client_jid,
                    phone: phone_norm ?? digits,     // display
                    phone_norm: phone_norm ?? null,  // filtro
                    client_name: pushName || `Cliente ${digits.slice(-4)}`,
                    last_message: body,
                    timestamp: new Date().toISOString(),
                    canal: "whatsapp",
                    status: "por-contestar",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "wa_number,client_jid" }
            )
            .select()
            .single()

        if (upsertError) {
            console.error("❌ Error upsert conversación:", upsertError)
            return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
        }

        const { saveMessage } = await import("@/lib/crm-service")
        await saveMessage(
            conversation.id,
            "client",
            body,
            (msg.type || payload.type || "text") as any,
            {},
            activeWaNumber
        )

        return NextResponse.json({ ok: true, processed: true })
    } catch (e: any) {
        console.error("❌ Error en webhook:", e)
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
}
