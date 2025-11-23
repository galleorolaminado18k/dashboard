import { NextRequest, NextResponse } from "next/server"

// Usamos primero WAHA (que es lo que ya funciona en tu script bash)
const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    "https://wpp.galle18k.com"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY ||
    process.env.WA_GATEWAY_API_KEY ||
    process.env.WA_API_KEY ||
    ""

// Función común para GET y POST
async function handleStart(_req: NextRequest) {
    try {
        // ===== 1) Llamar al endpoint REAL de WAHA que entrega el QR =====
        const url = `${WAHA_BASE_URL.replace(/\/+$/, "")}/api/default/auth/qr`

        const gatewayRes = await fetch(url, {
            method: "GET",
            headers: {
                ...(WAHA_API_KEY ? { "X-Api-Key": WAHA_API_KEY } : {}),
                Accept: "application/json",
            },
        })

        const raw = await gatewayRes.text()

        if (!gatewayRes.ok) {
            console.error("❌ Error WAHA /api/default/auth/qr:", gatewayRes.status, raw)
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

        // ===== 2) Parsear JSON del gateway =====
        let qrJson: any
        try {
            qrJson = JSON.parse(raw)
        } catch (e) {
            console.error("❌ JSON inválido desde WAHA:", e, raw)
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

        // WAHA suele devolver "qr" o "qrcode" con la imagen base64
        const qrcode: string | null =
            qrJson.qr || qrJson.qrcode || null

        return NextResponse.json(
            {
                ok: true,
                hasQR: !!qrcode,
                isConnected: !!qrJson.isConnected,
                // mantenemos ambos nombres por compatibilidad con el front
                qr: qrcode,
                qrcode,
                session: qrJson.session || "default",
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

// Aceptar GET y POST
export async function GET(req: NextRequest) {
    return handleStart(req)
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}
