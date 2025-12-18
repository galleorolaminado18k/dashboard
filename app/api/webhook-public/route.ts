/**
 * API Route: Webhook público para WhatsApp
 * Este endpoint NO tiene protección de Vercel
 *
 * Vercel Dashboard:
 * Settings > Deployment Protection > Protection Bypass for Automation
 * Agregar: /api/webhook-public
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function digitsOnly(raw: any) {
    return String(raw || "").replace(/\D/g, "")
}

/**
 * 🔥 CLAVE: normaliza JID entrante a un JID ENVIABLE
 * - 6030...@lid  -> 6030...@s.whatsapp.net
 * - 57...@c.us   -> 57...@s.whatsapp.net
 * - 57...        -> 57...@s.whatsapp.net
 */
function toSendableJid(input: any): string | null {
    const s = String(input || "")
    if (!s) return null

    if (s.includes("@")) {
        const [left, domain] = s.split("@")
        const d = digitsOnly(left)
        if (d.length < 10 || d.length > 15) return null

        if (domain === "lid") return `${d}@s.whatsapp.net`
        if (domain === "c.us") return `${d}@s.whatsapp.net`
        if (domain === "s.whatsapp.net") return `${d}@s.whatsapp.net`

        // grupos/broadcast u otros dominios, no tocar
        return `${d}@${domain}`
    }

    const d = digitsOnly(s)
    if (d.length < 10 || d.length > 15) return null
    return `${d}@s.whatsapp.net`
}

function isIgnorableChat(jid: string | null) {
    if (!jid) return true
    if (jid === "status@broadcast") return true
    if (jid.endsWith("@g.us")) return true
    return false
}

async function uploadDataUrlToCloudinary(metadata: Record<string, any>) {
    try {
        if (!metadata?.mediaUrl || typeof metadata.mediaUrl !== "string") return metadata

        const MAX = 10 * 1024 * 1024
        let mediaDataUrl: string | null = null

        if (metadata.mediaUrl.startsWith("data:")) {
            mediaDataUrl = metadata.mediaUrl
        } else if (metadata.mediaUrl.startsWith("http://") || metadata.mediaUrl.startsWith("https://")) {
            try {
                const headRes = await fetch(metadata.mediaUrl, { method: "HEAD" })
                const contentLength = headRes.headers.get("content-length")
                const contentType = metadata.mimetype || headRes.headers.get("content-type") || ""

                if (contentLength) {
                    const size = parseInt(contentLength, 10)
                    if (!isNaN(size) && size > MAX) {
                        console.warn("⚠️ Recurso remoto demasiado grande, se omitirá mediaUrl:", size)
                        delete metadata.mediaUrl
                        return metadata
                    }
                }

                const getRes = await fetch(metadata.mediaUrl)
                if (!getRes.ok) return metadata

                const arrayBuffer = await getRes.arrayBuffer()
                if (arrayBuffer.byteLength > MAX) {
                    delete metadata.mediaUrl
                    return metadata
                }

                const b64 = Buffer.from(arrayBuffer).toString("base64")
                const mime = contentType || metadata.mimetype || "application/octet-stream"
                mediaDataUrl = `data:${mime};base64,${b64}`
                if (!metadata.mimetype) metadata.mimetype = mime
            } catch {
                return metadata
            }
        } else {
            return metadata
        }

        if (!mediaDataUrl) return metadata

        const base64 = mediaDataUrl.split(",")[1] || ""
        const byteLength = Buffer.from(base64, "base64").length
        if (byteLength > MAX) {
            delete metadata.mediaUrl
            return metadata
        }

        const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dusyyg1dd"
        const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "galleorolaminadosubida"

        let resourceType = "raw"
        if (metadata.mimetype?.startsWith("image/")) resourceType = "image"
        else if (metadata.mimetype && (metadata.mimetype.startsWith("video/") || metadata.mimetype.startsWith("audio/")))
            resourceType = "video"

        const cloudForm = new FormData()
        cloudForm.append("file", mediaDataUrl)
        cloudForm.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
        cloudForm.append("folder", "whatsapp-media")

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
        const uploadRes = await fetch(uploadUrl, { method: "POST", body: cloudForm })
        const result = await uploadRes.json()

        if (result?.secure_url) {
            metadata.mediaUrl = result.secure_url
            metadata.cloudinary_id = result.public_id
            metadata.cloudinary_raw = result
        }

        return metadata
    } catch {
        return metadata
    }
}

export async function POST(request: NextRequest) {
    try {
        const event = await request.json()
        const supabase = createClient()

        const eventType = event.event || event.type
        const payload = event.payload || event.data || event
        const msg = payload.message || payload
        const k = msg?.key || {}

        console.log("📩 Webhook público recibido:", { event: eventType, timestamp: new Date().toISOString() })

        // Solo procesamos mensajes
        if (!(eventType === "messages.upsert" || eventType === "message" || eventType === "message.any")) {
            return NextResponse.json({ ok: true, eventType })
        }

        // Ignorar mensajes propios
        if (msg?.fromMe || k?.fromMe) {
            return NextResponse.json({ ok: true, ignored: "fromMe" })
        }

        // Elegir JID del chat
        const remoteRaw = String(k.remoteJid || payload.from || "")
        const participant = String(k.participant || "")

        // status/broadcast: usa participant
        let rawClientJid = remoteRaw === "status@broadcast" ? participant : remoteRaw

        // grupos: ignorar (si quieres atender grupos, cambia esta regla)
        if (rawClientJid.endsWith("@g.us") || rawClientJid === "status@broadcast") {
            return NextResponse.json({ ok: true, ignored: "group_or_status" })
        }

        // ✅ Normalizar a JID enviable
        const client_jid = toSendableJid(rawClientJid)

        console.log("🚨 CRÍTICO - JID ENTRANTE:", {
            remoteJid: k.remoteJid || payload.from,
            participant: k.participant,
            fromMe: k.fromMe,
            rawPicked: rawClientJid,
            normalizedPicked: client_jid,
        })

        if (isIgnorableChat(client_jid)) {
            return NextResponse.json({ ok: true, ignored: "no_client_jid" })
        }

        const phone_norm = digitsOnly(client_jid?.split("@")[0])
        const bodyText =
            msg.body ||
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""

        const pushName = msg.pushName || msg.notifyName || ""

        // ✅ Obtener la línea activa (wa_number)
        const { data: waAccount } = await supabase
            .from("crm_whatsapp_accounts")
            .select("wa_number")
            .eq("key", "active")
            .single()

        const activeWaNumber = waAccount?.wa_number || "0000000000"

        // ✅ Buscar conversación existente (por wa_number + phone_norm) para NO duplicar
        let conversationId: string | null = null

        const { data: existing } = await supabase
            .from("crm_conversations")
            .select("id")
            .eq("wa_number", activeWaNumber)
            .eq("phone_norm", phone_norm)
            .maybeSingle()

        if (existing?.id) {
            conversationId = existing.id

            const { error: updErr } = await supabase
                .from("crm_conversations")
                .update({
                    client_jid, // ✅ ya normalizado (NO @lid)
                    phone: phone_norm,
                    phone_norm,
                    client_name: pushName || `Cliente ${phone_norm.slice(-4)}`,
                    last_message: bodyText,
                    timestamp: new Date().toISOString(),
                    canal: "whatsapp",
                    status: "por-contestar",
                    updated_at: new Date().toISOString(),
                    metadata: {
                        raw_client_jid: rawClientJid, // 👈 para debug
                    },
                })
                .eq("id", conversationId)

            if (updErr) {
                console.error("❌ Error actualizando conversación:", updErr)
                return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
            }
        } else {
            const { data: created, error: insErr } = await supabase
                .from("crm_conversations")
                .insert({
                    wa_number: activeWaNumber, // ✅ IMPORTANTÍSIMO
                    client_jid,                // ✅ NORMALIZADO
                    phone: phone_norm,
                    phone_norm,
                    client_name: pushName || `Cliente ${phone_norm.slice(-4)}`,
                    last_message: bodyText,
                    timestamp: new Date().toISOString(),
                    canal: "whatsapp",
                    status: "por-contestar",
                    updated_at: new Date().toISOString(),
                    metadata: {
                        raw_client_jid: rawClientJid,
                    },
                })
                .select("id")
                .single()

            if (insErr) {
                console.error("❌ Error creando conversación:", insErr)
                return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
            }
            conversationId = created?.id || null
        }

        if (!conversationId) {
            return NextResponse.json({ ok: false, error: "No se pudo determinar conversationId" }, { status: 500 })
        }

        // ✅ Guardar mensaje
        const incomingType = msg.type || payload.type || "text"
        const metadata: Record<string, any> = {
            raw_client_jid: rawClientJid,
            normalized_client_jid: client_jid,
        }

        // media helpers
        if (payload.mediaUrl) metadata.mediaUrl = payload.mediaUrl
        if (payload.mimetype) metadata.mimetype = payload.mimetype
        if (payload.filename) metadata.filename = payload.filename
        if (msg.mediaUrl) metadata.mediaUrl = msg.mediaUrl
        if (msg.mimetype) metadata.mimetype = msg.mimetype
        if (msg.filename) metadata.filename = msg.filename

        await uploadDataUrlToCloudinary(metadata)

        const { saveMessage } = await import("@/lib/crm-service")
        await saveMessage(
            conversationId,
            "client",
            bodyText,
            incomingType as any,
            metadata,
            activeWaNumber
        )

        console.log("✅ Mensaje y conversación procesados:", conversationId)

        return NextResponse.json({ ok: true, processed: true, conversationId })
    } catch (error: any) {
        console.error("❌ Error en webhook:", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "WhatsApp Webhook público activo",
        timestamp: new Date().toISOString(),
    })
}
