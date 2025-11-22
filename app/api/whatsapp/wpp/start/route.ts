import { NextRequest, NextResponse } from "next/server"

const WA_GATEWAY_URL =
    process.env.WA_GATEWAY_URL || "http://31.220.58.83:3001"

async function handleStart(req: NextRequest) {
    try {
        let phone = ""
        try {
            const body = await req.json()
            phone = body?.phone || ""
        } catch {
            // si viene vacío o es GET, ignoramos
        }

        const res = await fetch(`${WA_GATEWAY_URL}/qr`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        })

        if (!res.ok) {
            const text = await res.text()
            console.error("WA gateway /qr error:", res.status, text)
            return NextResponse.json(
                {
                    ok: false,
                    error: "GATEWAY_ERROR",
                    detail: `WA gateway /qr respondió ${res.status}`,
                },
                { status: 502 },
            )
        }

        const qrJson = await res.json()

        return NextResponse.json(
            {
                ok: true,
                hasQR: !!qrJson.hasQR,
                isConnected: !!qrJson.isConnected,
                // 👇 nombre que usa page.tsx
                qrcode: qrJson.qr ?? null,
                session: phone ? `galle-${phone}` : null,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("Error en /api/whatsapp/wpp/start:", err)
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

export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
