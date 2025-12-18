import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { formatPhone } from "@/lib/crm-service"

const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ✅ Supabase (service role para escribir config global)
const SUPABASE_URL = process.env.SUPABASE_URL || ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
        : null

function extractConnectedNumber(status: any): { wa_number: string | null; wa_jid: string | null } {
    const candidates: Array<string | null | undefined> = [
        status?.user?.id,
        status?.me?.id,
        status?.user,
        status?.me,
        status?.wid,
        status?.jid,
    ]

    const jid = candidates.find(v => typeof v === "string" && v.includes("@")) as string | undefined
    const raw = (jid || candidates.find(v => typeof v === "string")) as string | undefined

    return {
        wa_number: formatPhone(raw || null),
        wa_jid: jid || (raw?.includes("@") ? raw : null),
    }
}

async function saveActiveLineToSupabase(status: any) {
    if (!supabase) {
        console.log("⚠️ Supabase no configurado (SUPABASE_URL / SERVICE_ROLE_KEY faltan). No se guardará wa_number.")
        return
    }

    const { wa_number, wa_jid } = extractConnectedNumber(status)

    // Si está conectado pero no pudimos leer número, igual marcamos estado
    const payload = {
        key: "active",
        wa_number: wa_number,
        wa_jid: wa_jid,
        is_connected: Boolean(status?.isConnected),
        last_seen: new Date().toISOString(),
        metadata: status ?? {},
    }

    const { error } = await supabase
        .from("crm_whatsapp_accounts")
        .upsert(payload, { onConflict: "key" })

    if (error) console.log("❌ Error guardando línea activa:", error)
    else console.log("✅ Línea activa guardada:", { wa_number, wa_jid })
}

async function handleStart(req: NextRequest) {
    try {
        // Verificar si se pide forzar nuevo QR
        const url = new URL(req.url)
        const forceNew = url.searchParams.get("forceNew") === "true"

        console.log(`🚀 WhatsApp Start - forceNew: ${forceNew}, Gateway: ${GATEWAY_URL}`)

        // Si se pide forzar nuevo QR, hacer logout + restart
        if (forceNew) {
            console.log(`🔄 Forzando nuevo QR...`)

            // Logout primero
            try {
                await fetch(`${GATEWAY_URL}/logout`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(10000),
                })
                console.log(`🧹 Logout ejecutado`)
            } catch (e) {
                console.log(`⚠️ Logout falló (puede ser normal):`, e)
            }

            // Esperar un poco
            await new Promise(r => setTimeout(r, 2000))

            // Restart para generar nuevo QR
            try {
                await fetch(`${GATEWAY_URL}/restart`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(30000),
                })
                console.log(`🔄 Restart ejecutado`)
            } catch (e) {
                console.log(`⚠️ Restart timeout (puede ser normal)`)
            }

            // Esperar a que se genere el QR
            await new Promise(r => setTimeout(r, 8000))
        }

        // Verificar el estado actual
        const statusRes = await fetch(`${GATEWAY_URL}/status`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const status = await statusRes.json()
        console.log(`📊 Estado:`, JSON.stringify(status))

        // ✅ Guardar línea conectada en Supabase (si está conectado o si cambió)
        await saveActiveLineToSupabase(status)

        const extracted = extractConnectedNumber(status)

        // Si ya está conectado, retornar éxito
        if (status.isConnected) {
            return NextResponse.json(
                {
                    ok: true,
                    isConnected: true,
                    hasQR: false,
                    qr: null,
                    qrcode: null,
                    waNumber: extracted.wa_number, // ✅ número automático
                    waJid: extracted.wa_jid,
                    message: "WhatsApp conectado",
                },
                { status: 200 }
            )
        }

        // Obtener QR
        const qrRes = await fetch(`${GATEWAY_URL}/qr`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const qrData = await qrRes.json()

        if (qrData.hasQR && qrData.qr) {
            return NextResponse.json(
                {
                    ok: true,
                    isConnected: false,
                    hasQR: true,
                    qr: qrData.qr,
                    qrcode: qrData.qr,
                    message: "Escanea el código QR",
                },
                { status: 200 }
            )
        }

        // Si no hay QR, intentar restart
        if (!forceNew) {
            console.log(`🔄 No hay QR, haciendo restart...`)

            try {
                await fetch(`${GATEWAY_URL}/restart`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(30000),
                })
            } catch (e) {
                console.log(`⚠️ Restart timeout`)
            }

            await new Promise(r => setTimeout(r, 8000))

            const newQrRes = await fetch(`${GATEWAY_URL}/qr`, {
                cache: "no-store",
                signal: AbortSignal.timeout(10000),
            })

            const newQrData = await newQrRes.json()

            return NextResponse.json(
                {
                    ok: newQrData.hasQR || newQrData.isConnected,
                    isConnected: newQrData.isConnected ?? false,
                    hasQR: newQrData.hasQR ?? false,
                    qr: newQrData.qr || null,
                    qrcode: newQrData.qr || null,
                    message: newQrData.message || "Esperando QR...",
                },
                { status: 200 }
            )
        }

        return NextResponse.json(
            {
                ok: false,
                isConnected: false,
                hasQR: false,
                message: "No se pudo generar QR. Intenta de nuevo.",
            },
            { status: 200 }
        )
    } catch (err: any) {
        console.error("❌ Error:", err)

        return NextResponse.json(
            {
                ok: false,
                error: "GATEWAY_ERROR",
                detail: String(err?.message || err),
                isConnected: false,
                hasQR: false,
            },
            { status: 502 }
        )
    }
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
