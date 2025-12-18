/**
 * API Route: Enviar mensajes de WhatsApp
 * Envía mensajes a través del gateway de WhatsApp
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { formatPhone, saveMessage } from "@/lib/crm-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// URL del gateway de WhatsApp en el VPS
const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://31.220.58.83:3010"

function digitsOnly(raw: string) {
    return String(raw || "").replace(/\D/g, "")
}

/**
 * Convierte cualquier cosa que venga como:
 * - 57300...@s.whatsapp.net ✅
 * - 57300...@c.us ✅
 * - 6030...@lid ❌  -> ✅ 6030...@s.whatsapp.net
 * - " +57 300..." -> ✅ 57300...@s.whatsapp.net
 */
function toSendableJid(input: any): string | null {
    const s = String(input || "")
    // ya es jid válido
    if (s.includes("@")) {
        const [left, domain] = s.split("@")
        const d = digitsOnly(left)
        if (d.length < 10 || d.length > 15) return null

        // 🔥 CLAVE: lid -> s.whatsapp.net
        if (domain === "lid") return `${d}@s.whatsapp.net`

        // normaliza dominios conocidos
        if (domain === "c.us") return `${d}@s.whatsapp.net`
        if (domain === "s.whatsapp.net") return `${d}@s.whatsapp.net`

        // grupos / broadcast, no los tocamos
        return `${d}@${domain}`
    }

    // no trae @ -> convertir a dígitos y a jid
    const d = digitsOnly(s)
    if (d.length < 10 || d.length > 15) return null
    return `${d}@s.whatsapp.net`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            conversationId,
            phone,
            message,
            type = "text",
            mediaUrl,
            mimetype,
            filename,
            caption,
            wa_number: waNumberFromBody,
        } = body

        if (!phone && !conversationId) {
            return NextResponse.json({ ok: false, error: "Se requiere phone o conversationId" }, { status: 400 })
        }

        if (type === "text" && !message) {
            return NextResponse.json({ ok: false, error: "Se requiere message para tipo texto" }, { status: 400 })
        }

        if (!GATEWAY_URL || GATEWAY_URL.includes("localhost")) {
            return NextResponse.json(
                { ok: false, error: "Gateway no configurado. Configura WHATSAPP_GATEWAY_URL en Vercel." },
                { status: 503 }
            )
        }

        const supabase = createClient()

        let waNumber: string | null = waNumberFromBody || null
        let toJid: string | null = null
        let conv: any = null

        if (conversationId) {
            const { data, error } = await supabase.from("crm_conversations").select("*").eq("id", conversationId).single()
            if (error) {
                console.error("❌ Error consultando conversación:", error)
                return NextResponse.json({ ok: false, error: "Error consultando la conversación en la base de datos" }, { status: 500 })
            }
            conv = data

            // ✅ usar client_jid si existe, pero ARREGLANDO @lid
            toJid = toSendableJid(conv?.client_jid) || toSendableJid(conv?.phone_norm) || toSendableJid(conv?.phone)

            // wa_number para guardar el mensaje
            waNumber = conv?.wa_number || conv?.metadata?.wa_number || waNumber
        } else {
            // si viene por phone directo
            // formatPhone (tu helper) puede devolver e164 sin @
            const formatted = phone?.includes("@") ? phone : formatPhone(phone)
            toJid = toSendableJid(formatted || phone)
        }

        if (!toJid) {
            return NextResponse.json({ ok: false, error: "No se encontró un destinatario válido (JID) para enviar" }, { status: 400 })
        }

        console.log("🚨 CRÍTICO - JID FINAL que se enviará al gateway:", toJid)

        // 🔥 ENVIAR SOLO UNA VEZ (no doble envío)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        let gatewayRes: Response
        let gatewayData: any

        try {
            gatewayRes = await fetch(`${GATEWAY_URL}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: toJid,      // ✅ lo correcto para Baileys
                    phone: toJid,   // ✅ por compatibilidad si tu gateway lee "phone"
                    message,
                    type,
                    mediaUrl,
                    mimetype,
                    filename,
                    caption,
                }),
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            // algunos gateways devuelven vacío; intenta json pero no te mueras si falla
            try {
                gatewayData = await gatewayRes.json()
            } catch {
                gatewayData = { ok: gatewayRes.ok }
            }
        } catch (e: any) {
            clearTimeout(timeoutId)
            console.error("❌ Error de conexión con gateway:", e?.message || e)
            return NextResponse.json({ ok: false, error: `No se pudo conectar con el gateway: ${e?.message || e}` }, { status: 503 })
        }

        if (!gatewayData?.ok) {
            console.error("❌ Error del gateway:", gatewayData)
            return NextResponse.json({ ok: false, error: gatewayData?.error || "Error enviando mensaje" }, { status: 500 })
        }

        // Guardar el mensaje en BD
        if (conversationId) {
            const contentToSave =
                type === "text" ? message : caption || (type === "audio" ? "[Nota de voz]" : `[${type}]`)

            try {
                await saveMessage(
                    conversationId,
                    "agent",
                    contentToSave,
                    type as any,
                    { type, filename, mimetype, mediaUrl },
                    waNumber || "0000000000"
                )
            } catch (saveError) {
                console.error("❌ Error guardando mensaje en CRM:", saveError)
            }
        }

        return NextResponse.json({ ok: true, to: toJid })
    } catch (error) {
        console.error("❌ Error en /api/crm/send:", error)
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
    }
}
