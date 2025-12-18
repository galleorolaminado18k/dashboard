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

function digitsFromJid(jid?: string | null) {
    if (!jid) return null
    const base = jid.split("@")[0]
    const digits = base.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 15) return null
    return digits
}

function buildSendTargetFromConversation(conv: any) {
    // 1) Preferir client_jid si es válido
    const clientJid = typeof conv?.client_jid === "string" ? conv.client_jid : null

    // Si viene @s.whatsapp.net / @c.us -> OK
    if (clientJid && clientJid.includes("@") && !clientJid.endsWith("@g.us") && clientJid !== "status@broadcast") {
        // phone para gateway SOLO si es sendable como dígitos reales
        const phone = clientJid.endsWith("@s.whatsapp.net") || clientJid.endsWith("@c.us") ? digitsFromJid(clientJid) : null
        return { to_jid: clientJid, phone_for_gateway: phone }
    }

    // 2) Si no hay jid usable, usar phone_norm si existe
    const pn = String(conv?.phone_norm || "").replace(/\D/g, "")
    if (pn.length >= 10 && pn.length <= 15) {
        return { to_jid: `${pn}@s.whatsapp.net`, phone_for_gateway: pn }
    }

    // 3) Fallback: phone (display) normalizado
    const raw = String(conv?.phone || "")
    const dig = raw.replace(/\D/g, "")
    if (dig.length >= 10 && dig.length <= 15) {
        return { to_jid: `${dig}@s.whatsapp.net`, phone_for_gateway: dig }
    }

    return { to_jid: null as any, phone_for_gateway: null as any }
}

/**
 * POST /api/crm/send
 * Enviar un mensaje de WhatsApp
 */
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

        let waNumber = waNumberFromBody || null
        let to_jid: string | null = null
        let phone_for_gateway: string | null = null

        // ✅ SI hay conversationId: SIEMPRE sacar destino desde BD
        if (conversationId) {
            const supabase = createClient()
            const { data: conv, error: convError } = await supabase
                .from("crm_conversations")
                .select("*")
                .eq("id", conversationId)
                .single()

            if (convError) {
                console.error("❌ Error consultando conversación:", convError)
                console.log("🔍 ID buscado:", conversationId)
                return NextResponse.json({ ok: false, error: "Error consultando la conversación en la base de datos" }, { status: 500 })
            }

            const target = buildSendTargetFromConversation(conv)
            to_jid = target.to_jid
            phone_for_gateway = target.phone_for_gateway

            console.log("🚨 CRÍTICO ENVÍO - Datos en BD:", {
                id: conversationId,
                client_jid: conv?.client_jid,
                phone: conv?.phone,
                phone_norm: conv?.phone_norm,
                to_jid,
                phone_for_gateway,
            })

            if (!to_jid) {
                return NextResponse.json({ ok: false, error: "No se encontró un destinatario válido para esta conversación" }, { status: 404 })
            }

            // Intentar obtener wa_number
            if (conv?.wa_number) waNumber = conv.wa_number
            else if (conv?.metadata?.wa_number) waNumber = conv.metadata.wa_number
        } else {
            // ✅ SI NO hay conversationId: usar phone del request
            if (!phone) return NextResponse.json({ ok: false, error: "Se requiere phone si no hay conversationId" }, { status: 400 })

            // si viene jid completo
            if (String(phone).includes("@")) {
                to_jid = String(phone)
                phone_for_gateway =
                    to_jid.endsWith("@s.whatsapp.net") || to_jid.endsWith("@c.us") ? digitsFromJid(to_jid) : null
            } else {
                const validated = formatPhone(String(phone))
                if (!validated) return NextResponse.json({ ok: false, error: "Phone inválido" }, { status: 400 })
                phone_for_gateway = validated
                to_jid = `${validated}@s.whatsapp.net`
            }
        }

        if (type === "text" && !message) {
            return NextResponse.json({ ok: false, error: "Se requiere message para tipo texto" }, { status: 400 })
        }

        // ✅ IMPORTANTE: un SOLO envío al gateway, con ambos campos (compat)
        console.log("🚨 CRÍTICO - JID FINAL que se enviará al gateway:", to_jid)
        console.log("🚨 CRÍTICO - PHONE FINAL que se enviará al gateway:", phone_for_gateway)

        if (!GATEWAY_URL || GATEWAY_URL.includes("localhost")) {
            return NextResponse.json({ ok: false, error: "Gateway no configurado. Configura WHATSAPP_GATEWAY_URL en Vercel." }, { status: 503 })
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const gatewayResponse = await fetch(`${GATEWAY_URL}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // Compat: algunos gateways esperan phone, otros to
                phone: phone_for_gateway, // ✅ si el gateway exige phone
                to: to_jid,               // ✅ si el gateway soporta JID
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

        const gatewayData = await gatewayResponse.json().catch(() => ({}))

        if (!gatewayData?.ok) {
            console.error("❌ Error del gateway:", gatewayData)
            return NextResponse.json({ ok: false, error: gatewayData?.error || "Error enviando mensaje" }, { status: 500 })
        }

        // Guardar mensaje
        if (conversationId) {
            try {
                const contentToSave =
                    type === "text" ? message : caption || (type === "audio" ? "[Nota de voz]" : `[${type}]`)

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

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("❌ Error en /api/crm/send:", error)
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
    }
}
