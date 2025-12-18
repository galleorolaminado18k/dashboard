import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

function extractDigitsIfSendableJid(jid: string) {
    // Solo confiar si es @s.whatsapp.net o @c.us
    if (!(jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us"))) return null
    const base = jid.split("@")[0]
    const digits = base.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 15) return null
    return digits
}

export async function POST(request: NextRequest) {
    try {
        const event = await request.json()
        const supabase = createClient()

        const eventType = event.event || event.type
        console.log("📩 Webhook público recibido:", { event: eventType, timestamp: new Date().toISOString() })

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
                else if (metadata.mimetype?.startsWith("video/") || metadata.mimetype?.startsWith("audio/")) resourceType = "video"

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

        if (eventType === "messages.upsert" || eventType === "message" || eventType === "message.any") {
            const payload = event.payload || event.data || event
            const message = payload.message || payload

            function pickReplyJid(msg: any) {
                const k = msg?.key || {}
                const remote = String(k.remoteJid || payload.from || "")
                const participant = String(k.participant || "")
                const remoteAlt = String(k.remoteJidAlt || "")
                const participantAlt = String(k.participantAlt || "")

                if (remote === "status@broadcast") return { jid: participant || participantAlt, jidAlt: participantAlt || null }
                if (remote.endsWith("@g.us")) return { jid: participant || participantAlt, jidAlt: participantAlt || null }

                return { jid: remote, jidAlt: remoteAlt || null }
            }

            function safeJid(s?: string | null) {
                if (!s) return null
                if (s.endsWith("@g.us")) return null
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

            if (!clientJid) return NextResponse.json({ ok: true, ignored: "no_client_jid" })

            if (message.fromMe || message.key?.fromMe) return NextResponse.json({ ok: true, ignored: "fromMe" })

            const bodyText =
                message.body ||
                message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                ""

            const pushName = message.pushName || message.notifyName || ""

            // ✅ Solo calcular phone_norm si el jid es sendable como número real
            const phone_norm = extractDigitsIfSendableJid(clientJid)

            // Display phone (para UI). Si es @lid y NO hay phone_norm, NO inventar: deja digits solo si te sirve visualmente.
            const displayPhone = phone_norm || clientJid

            // wa_number (línea activa)
            const { data: waAccount } = await supabase
                .from("crm_whatsapp_accounts")
                .select("wa_number")
                .eq("key", "active")
                .single()

            const activeWaNumber = waAccount?.wa_number || "0000000000"

            // ✅ Upsert por client_jid (NO por id)
            const { data: conversation, error: upsertError } = await supabase
                .from("crm_conversations")
                .upsert(
                    {
                        client_jid: clientJid,
                        phone: displayPhone,
                        phone_norm: phone_norm, // puede ser null si llega @lid
                        client_name: pushName || "Cliente WhatsApp",
                        last_message: bodyText,
                        timestamp: new Date().toISOString(),
                        canal: "whatsapp",
                        status: "por-contestar",
                        wa_number: activeWaNumber,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "client_jid" }
                )
                .select()
                .single()

            if (upsertError) {
                console.error("❌ Error upsert conversación:", upsertError)
                return NextResponse.json({ ok: false, error: upsertError.message }, { status: 500 })
            }

            // Guardar mensaje
            const incomingType = message.type || payload.type || "text"
            const metadata: Record<string, any> = {}

            if (payload.mediaUrl) metadata.mediaUrl = payload.mediaUrl
            if (payload.mimetype) metadata.mimetype = payload.mimetype
            if (payload.filename) metadata.filename = payload.filename
            if (message.mediaUrl) metadata.mediaUrl = message.mediaUrl
            if (message.mimetype) metadata.mimetype = message.mimetype
            if (message.filename) metadata.filename = message.filename

            await uploadDataUrlToCloudinary(metadata)

            const { saveMessage } = await import("@/lib/crm-service")
            await saveMessage(conversation.id!, "client", bodyText, incomingType as any, metadata, activeWaNumber)

            console.log("✅ Mensaje y conversación procesados:", conversation.id)
            return NextResponse.json({ ok: true, processed: true })
        }

        return NextResponse.json({ ok: true, eventType })
    } catch (error: any) {
        console.error("❌ Error en webhook:", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: "ok", message: "WhatsApp Webhook público activo", timestamp: new Date().toISOString() })
}
