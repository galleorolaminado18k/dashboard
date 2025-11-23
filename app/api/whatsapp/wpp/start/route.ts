// app/api/whatsapp/wpp/start/route.ts
import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

const WAHA_BASE_URL = process.env.WAHA_BASE_URL
const WAHA_API_KEY = process.env.WAHA_API_KEY
const SESSION_NAME = "default" // ⚠️ Core SOLO permite "default"

function buildHeaders(extra: HeadersInit = {}): HeadersInit {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...extra,
    }

    if (WAHA_API_KEY) {
        headers["X-Api-Key"] = WAHA_API_KEY
    }

    return headers
}

export async function POST(_req: NextRequest) {
    if (!WAHA_BASE_URL) {
        console.error("WAHA_BASE_URL no está configurada en Vercel")
        return NextResponse.json(
            {
                ok: false,
                error: "WAHA_CONFIG_ERROR",
                detail: "Falta WAHA_BASE_URL en variables de entorno",
            },
            { status: 500 },
        )
    }

    const base = WAHA_BASE_URL.replace(/\/$/, "")

    try {
        // 1) Asegurar que la sesión "default" existe y está arrancada
        const startRes = await fetch(`${base}/api/sessions/${SESSION_NAME}`, {
            method: "POST", // "Start the session"
            headers: buildHeaders(),
        })

        if (!startRes.ok && startRes.status !== 409) {
            const raw = await startRes.text()
            console.error(
                "❌ WAHA_START_ERROR:",
                startRes.status,
                raw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_ERROR",
                    detail: `HTTP ${startRes.status}`,
                    raw,
                },
                { status: 502 },
            )
        }

        // 2) Pedir screenshot/QR de esa sesión (default)
        const qrRes = await fetch(
            `${base}/api/screenshot?session=${encodeURIComponent(SESSION_NAME)}`,
            {
                method: "GET",
                headers: buildHeaders({ Accept: "image/png" }),
            },
        )

        if (!qrRes.ok) {
            const raw = await qrRes.text()
            console.error(
                "❌ WAHA_QR_ERROR:",
                qrRes.status,
                raw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_QR_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                    raw,
                },
                { status: 502 },
            )
        }

        const buf = Buffer.from(await qrRes.arrayBuffer())
        const dataUri = `data:image/png;base64,${buf.toString("base64")}`

        return NextResponse.json(
            {
                ok: true,
                qr: dataUri,
                hasQR: true,
                isConnected: false,
                session: SESSION_NAME,
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

// Por si alguien hace GET manualmente al endpoint:
export async function GET(req: NextRequest) {
    return POST(req)
}
