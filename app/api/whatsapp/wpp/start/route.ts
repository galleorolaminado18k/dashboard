import { NextRequest, NextResponse } from "next/server"

const GATEWAY_URL = process.env.WA_GATEWAY_URL
const GATEWAY_TOKEN = process.env.WA_GATEWAY_TOKEN

if (!GATEWAY_URL) {
    console.error("❌ WA_GATEWAY_URL no configurada")
}
if (!GATEWAY_TOKEN) {
    console.error("❌ WA_GATEWAY_TOKEN no configurada")
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const session = searchParams.get("session")

        if (!session) {
            return NextResponse.json(
                { ok: false, error: "SESSION_REQUIRED" },
                { status: 400 },
            )
        }

        if (!GATEWAY_URL || !GATEWAY_TOKEN) {
            return NextResponse.json(
                { ok: false, error: "GATEWAY_ENV_MISSING" },
                { status: 500 },
            )
        }

        const gatewayRes = await fetch(
            `${GATEWAY_URL.replace(/\/$/, "")}/status?session=${encodeURIComponent(
                session,
            )}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // 👇 MISMO header que usas en /wpp/start
                    Authorization: `Bearer ${GATEWAY_TOKEN}`,
                },
                cache: "no-store",
            },
        )

        const gatewayJson = await gatewayRes.json().catch(() => ({}))

        if (!gatewayRes.ok) {
            console.error("❌ Error en WA gateway /status:", gatewayJson)
            return NextResponse.json(
                {
                    ok: false,
                    error: "GATEWAY_STATUS_ERROR",
                    detail: gatewayJson,
                },
                { status: 502 },
            )
        }

        // El gateway puede devolver isConnected o connected
        const isConnected = Boolean(
            gatewayJson?.connected ?? gatewayJson?.isConnected,
        )

        return NextResponse.json(
            {
                ok: true,
                connected: isConnected,
                raw: gatewayJson,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ Error inesperado en /api/whatsapp/wpp/status:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "UNEXPECTED_ERROR",
                detail: String(err?.message || err),
            },
            { status: 500 },
        )
    }
}
