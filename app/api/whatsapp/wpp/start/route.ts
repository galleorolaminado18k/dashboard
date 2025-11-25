import { NextRequest, NextResponse } from "next/server"

// Usamos las vars que ya tienes en Vercel
const BASE_URL =
    (process.env.WAHA_BASE_URL ||
        process.env.WA_GATEWAY_URL ||
        process.env.WHATSAPP_GATEWAY_URL ||
        "").replace(/\/+$/, "")

const API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY || ""

// Handler único
async function handleStart(_req: NextRequest) {
    if (!BASE_URL) {
        console.error("❌ WA gateway URL no configurada")
        return NextResponse.json(
            {
                ok: false,
                error: "MISSING_GATEWAY_URL",
                detail:
                    "Configura WAHA_BASE_URL o WA_GATEWAY_URL en las variables de entorno",
            },
            { status: 500 },
        )
    }

    try {
        const headers: Record<string, string> = {
            Accept: "application/json",
        }

        // WAHA usa X-API-Key (401 si falta)
        if (API_KEY) {
            headers["X-API-Key"] = API_KEY
        }

        console.log("🌐 Llamando al gateway:", `${BASE_URL}/qr`)

        const gatewayRes = await fetch(`${BASE_URL}/qr`, { headers })
        const raw = await gatewayRes.text()

        if (!gatewayRes.ok) {
            console.error(
                "❌ Error WA_GATEWAY /qr:",
                gatewayRes.status,
                raw || "<sin cuerpo>",
            )

            return NextResponse.json(
                {
                    ok: false,
                    error: "WA_GATEWAY_ERROR",
                    detail: `HTTP ${gatewayRes.status}`,
                    raw,
                },
                { status: 502 },
            )
        }

        let payload: any
        try {
            payload = JSON.parse(raw)
        } catch (e) {
            console.error("❌ JSON inválido desde WA_GATEWAY:", e, raw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_GATEWAY_JSON",
                    detail: "Respuesta inválida del gateway",
                    raw,
                },
                { status: 502 },
            )
        }

        const qrcode = payload.qrcode || payload.qr || null

        return NextResponse.json(
            {
                ok: true,
                hasQR: !!payload.hasQR,
                isConnected: !!payload.isConnected,
                qrcode,
                session: payload.session || "default",
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ Error en /api/whatsapp/wpp/start:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "GATEWAY_PROXY_ERROR",
                detail: String(err?.message || err),
            },
            { status: 500 },
        )
    }
}

// Aceptamos GET y POST
export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
