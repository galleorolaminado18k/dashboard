import { NextRequest, NextResponse } from "next/server"

const WA_GATEWAY_URL =
    process.env.WA_GATEWAY_URL || "https://wpp.galle18k.com"

async function handleStart(_req: NextRequest) {
    try {
        // Llamamos al gateway de WhatsApp (WAHA / Evolution / etc.)
        const gatewayRes = await fetch(`${WA_GATEWAY_URL}/qr`)

        const raw = await gatewayRes.text()
        if (!gatewayRes.ok) {
            console.error("❌ Error WA_GATEWAY /qr:", gatewayRes.status, raw)
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
