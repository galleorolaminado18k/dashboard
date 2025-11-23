import { NextRequest, NextResponse } from "next/server"

const WA_GATEWAY_URL =
    process.env.WA_GATEWAY_URL || "https://wpp.galle18k.com"

// ⚠️ Lo ideal es poner esta key en Vercel como WA_GATEWAY_API_KEY.
// Dejo el valor por defecto igual al de tu script limpiar-waha-session.sh
const WA_GATEWAY_API_KEY =
    process.env.WA_GATEWAY_API_KEY || "bb841979e8b66e6a0f563235b5df3d9a"

async function handleStart(_req: NextRequest) {
    try {
        const url = `${WA_GATEWAY_URL}/api/default/auth/qr`
        console.log("📡 Llamando a WA_GATEWAY:", url)

        // Llamamos al gateway de WhatsApp (WAHA)
        const gatewayRes = await fetch(url, {
            method: "GET",
            headers: {
                "X-Api-Key": WA_GATEWAY_API_KEY,
                Accept: "application/json",
            },
            cache: "no-store",
        })

        const raw = await gatewayRes.text()

        if (!gatewayRes.ok) {
            console.error(
                "❌ Error WA_GATEWAY /api/default/auth/qr:",
                gatewayRes.status,
                raw,
            )

            return NextResponse.json(
                {
                    ok: false,
                    error: "WA_GATEWAY_ERROR",
                    detail: `HTTP ${gatewayRes.status}`,
                },
                { status: 502 },
            )
        }

        let qrJson: any
        try {
            qrJson = JSON.parse(raw)
        } catch (e) {
            console.error("❌ JSON inválido desde WA_GATEWAY:", e, raw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_GATEWAY_JSON",
                    detail: "Respuesta inválida del gateway",
                },
                { status: 502 },
            )
        }

        const qrcode = qrJson.qr || qrJson.qrcode || null

        return NextResponse.json(
            {
                ok: true,
                hasQR: !!qrJson.hasQR,
                isConnected: !!qrJson.isConnected,
                qrcode,
                session: qrJson.session || null,
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

// Aceptar **GET y POST** para que nunca salga 405
export async function GET(req: NextRequest) {
    return handleStart(req)
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}
