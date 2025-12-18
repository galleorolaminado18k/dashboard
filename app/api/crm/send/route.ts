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

function buildToJid(conversation: any) {
    const jid = conversation?.client_jid
    if (jid && typeof jid === "string" && jid.includes("@")) return jid

    const raw = String(conversation?.phone_norm || conversation?.phone || "")
    const digits = raw.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 15) return null
    return `${digits}@s.whatsapp.net`
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

        let targetPhone: string | null = phone || null
        let waNumber: string | null = waNumberFromBody || null

        // ✅ Si hay conversationId: SIEMPRE sacar destinatario de BD (client_jid o phone_norm)
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

            const to_jid = buildToJid(conv)
            if (!to_jid) {
                return NextResponse.json({ ok: false, error: "No se encontró un destinatario válido para esta conversación" }, { status: 404 })
            }

            // ✅ ESTE ES el destinatario real
            targetPhone = to_jid

            // ✅ wa_number (tu línea) para guardar mensajes
            if (conv?.wa_number) waNumber = conv.wa_number
            else if (conv?.metadata?.wa_number) waNumber = conv.metadata.wa_number

            console.log("🚨 CRÍTICO - JID FINAL que se enviará al gateway:", targetPhone)
        } else {
            // ✅ si no hay conversationId, normalizar phone directo
            if (!targetPhone) {
                return NextResponse.json({ ok: false, error: "Se requiere phone si no hay conversationId" }, { status: 400 })
            }

            if (!targetPhone.includes("@")) {
                const validationResult = formatPhone(targetPhone)
                if (validationResult) targetPhone = `${validationResult}@s.whatsapp.net`
            }
        }

        if (type === "text" && !message) {
            return NextResponse.json({ ok: false, error: "Se requiere message para tipo texto" }, { status: 400 })
        }

        if (!GATEWAY_URL || GATEWAY_URL === "http://localhost:3010") {
            return NextResponse.json({ ok: false, error: "Gateway no configurado. Configura WHATSAPP_GATEWAY_URL en Vercel." }, { status: 503 })
        }

        // ✅ SOLO 1 ENVÍO al gateway y SIEMPRE con "phone"
        console.log("🚨 CRÍTICO - Destinatario FINAL (phone) al gateway:", targetPhone, "| Mensaje:", message?.substring(0, 30))

        let gatewayData: any
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000)

            const gatewayResponse = await fetch(`${GATEWAY_URL}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: targetPhone, // ✅ el gateway pide "phone"
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
            gatewayData = await gatewayResponse.json()
        } catch (fetchError: any) {
            console.error("❌ Error de conexión con gateway:", fetchError?.message)
            return NextResponse.json(
                { ok: false, error: `No se pudo conectar con el gateway de WhatsApp: ${fetchError?.message}` },
                { status: 503 }
            )
        }

        if (!gatewayData?.ok) {
            console.error("❌ Error del gateway:", gatewayData)
            return NextResponse.json({ ok: false, error: gatewayData?.error || "Error enviando mensaje" }, { status: 500 })
        }

        // ✅ Guardar el mensaje en BD
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
                console.log("[CRM] Mensaje guardado correctamente en CRM")
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
