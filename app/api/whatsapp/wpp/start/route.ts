import { NextRequest, NextResponse } from "next/server"

const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WHATSAPP_GATEWAY_URL ||
    process.env.WA_GATEWAY_URL ||
    "http://localhost:3001"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY

function buildHeaders(extra: Record<string, string> = {}) {
    const headers: Record<string, string> = {
        ...extra,
    }
    if (WAHA_API_KEY) {
        headers["x-api-key"] = WAHA_API_KEY
    }
    return headers
}

// Siempre usaremos la sesión "default" (WAHA Core SOLO permite esa)
const DEFAULT_SESSION = "default"

async function ensureDefaultSession() {
    // 1) Ver si la sesión default existe
    const sessionUrl = `${WAHA_BASE_URL}/api/sessions/${encodeURIComponent(
        DEFAULT_SESSION,
    )}`

    const res = await fetch(sessionUrl, {
        method: "GET",
        headers: buildHeaders(),
    })

    // 200 → existe, seguimos
    if (res.ok) return

    // 404 → la creamos
    if (res.status === 404) {
        const createRes = await fetch(`${WAHA_BASE_URL}/api/sessions`, {
            method: "POST",
            headers: buildHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ name: DEFAULT_SESSION }),
        })

        if (!createRes.ok) {
            const raw = await createRes.text()
            throw new Error(
                `WAHA_CREATE_SESSION_ERROR HTTP ${createRes.status}: ${raw}`,
            )
        }

        return
    }

    // Otro código → error
    const raw = await res.text()
    throw new Error(`WAHA_GET_SESSION_ERROR HTTP ${res.status}: ${raw}`)
}

async function getDefaultQr() {
    // 2) Pedimos el QR de la sesión default
    const qrUrl = `${WAHA_BASE_URL}/api/sessions/${encodeURIComponent(
        DEFAULT_SESSION,
    )}/auth/qr?format=image`

    const res = await fetch(qrUrl, {
        method: "GET",
        headers: buildHeaders(),
    })

    const raw = await res.text()

    if (!res.ok) {
        throw new Error(`WAHA_GET_QR_ERROR HTTP ${res.status}: ${raw}`)
    }

    // Intentamos parsear JSON, si viene en JSON
    try {
        const json = JSON.parse(raw)
        const qrcode: string =
            json.qr || json.qrcode || json.image || json.data || ""
        if (!qrcode) throw new Error("Respuesta sin campo de QR")
        return qrcode
    } catch {
        // Si no es JSON, asumimos que ya es base64 o data:image
        if (raw.startsWith("data:")) return raw
        return `data:image/png;base64,${raw}`
    }
}

async function handler(_req: NextRequest) {
    try {
        if (!WAHA_BASE_URL) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "MISSING_WAHA_BASE_URL",
                    detail:
                        "No se encontró WAHA_BASE_URL / WHATSAPP_GATEWAY_URL en variables de entorno.",
                },
                { status: 500 },
            )
        }

        // Paso 1: asegurar sesión "default"
        await ensureDefaultSession()

        // Paso 2: obtener QR
        const qr = await getDefaultQr()

        return NextResponse.json(
            {
                ok: true,
                hasQR: true,
                isConnected: false,
                qrcode: qr,
                session: DEFAULT_SESSION,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ Error en /api/whatsapp/wpp/start:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "WAHA_START_ERROR",
                detail: String(err?.message || err),
            },
            { status: 502 },
        )
    }
}

// Aceptamos GET y POST desde el frontend
export async function POST(req: NextRequest) {
    return handler(req)
}

export async function GET(req: NextRequest) {
    return handler(req)
}
