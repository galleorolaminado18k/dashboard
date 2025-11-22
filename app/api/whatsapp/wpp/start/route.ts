import { NextRequest, NextResponse } from "next/server"

const GATEWAY_URL =
    process.env.WPP_GATEWAY_URL || "http://31.220.58.83:3001"

export async function GET(req: NextRequest) {
    try {
        const base = GATEWAY_URL.replace(/\/$/, "")
        const url = `${base}/status`

        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))

        // No tiramos error, solo devolvemos el estado tal cual
        return NextResponse.json(
            {
                ok: true,
                connected: Boolean(data?.isConnected),
                raw: data,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("Error en /api/whatsapp/wpp/status:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "GATEWAY_STATUS_ERROR",
                detail: err?.message || "Error al consultar el gateway",
            },
            { status: 500 },
        )
    }
}
