import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

const WAHA_BASE_URL = process.env.WAHA_BASE_URL
const WAHA_API_KEY = process.env.WAHA_API_KEY
const DEFAULT_SESSION = "default" // ⚠️ Core solo permite "default"

function buildHeaders(extra: HeadersInit = {}): HeadersInit {
    const headers: HeadersInit = {
        ...extra,
    }

    if (WAHA_API_KEY) {
        headers["X-Api-Key"] = WAHA_API_KEY
    }

    return headers
}

export async function POST(req: NextRequest) {
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
        // Leemos el body solo por logging (el número se usa solo para estadísticas)
        const body = await req.json().catch(() => null)
        const phone = body?.phone
        console.log("Iniciando sesión WAHA para teléfono:", phone)

        // 1) Asegurar que la sesión "default" exista (Core solo soporta esa)
        const startRes = await fetch(`${base}/api/sessions/${DEFAULT_SESSION}`, {
            method: "POST",
            headers: buildHeaders({
                "Content-Type": "application/json",
            }),
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

        // 2) Pedir screenshot/QR de la sesión "default"
        const qrRes = await fetch(
            `${base}/api/screenshot?session=${encodeURIComponent(DEFAULT_SESSION)}`,
            {
                method: "GET",
                headers: buildHeaders(),
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
                session: DEFAULT_SESSION,
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

// Para poder probar con GET desde el navegador
export async function GET(req: NextRequest) {
    return POST(req)
}
