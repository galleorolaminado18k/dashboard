import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    process.env.WHATSAPP_GATEWAY_URL ||
    "http://localhost:3000"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY || ""

function buildHeaders() {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
    if (WAHA_API_KEY) headers["X-Api-Key"] = WAHA_API_KEY
    return headers
}

async function ensureSession(sessionName: string) {
    const headers = buildHeaders()

    // 1) Ver si ya existe
    const getRes = await fetch(
        `${WAHA_BASE_URL}/api/sessions/${encodeURIComponent(sessionName)}`,
        { headers },
    )

    if (getRes.ok) return

    if (getRes.status !== 404) {
        const raw = await getRes.text()
        throw new Error(`GET /sessions/${sessionName} -> ${getRes.status}: ${raw}`)
    }

    // 2) Crear sesión mínima válida (ejemplo oficial de la docs)
    const createRes = await fetch(`${WAHA_BASE_URL}/api/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            name: sessionName,
            config: {
                metadata: { "dashboard.owner": "Galle18K" },
                webhooks: [],
            },
        }),
    })

    if (!createRes.ok) {
        const raw = await createRes.text()
        throw new Error(`CREATE_SESSION ${createRes.status}: ${raw}`)
    }
}

async function startSession(sessionName: string) {
    const headers = buildHeaders()

    const res = await fetch(
        `${WAHA_BASE_URL}/api/sessions/${encodeURIComponent(sessionName)}/start`,
        { method: "POST", headers },
    )

    // 409 = ya estaba arrancada, lo aceptamos
    if (!res.ok && res.status !== 409) {
        const raw = await res.text()
        throw new Error(`START_SESSION ${res.status}: ${raw}`)
    }
}

async function fetchQr(sessionName: string) {
    const headers = buildHeaders()

    const res = await fetch(
        `${WAHA_BASE_URL}/api/${encodeURIComponent(sessionName)}/auth/qr`,
        { method: "POST", headers },
    )

    const raw = await res.text()
    if (!res.ok) {
        throw new Error(`GET_QR ${res.status}: ${raw}`)
    }

    let data: any = {}
    try {
        data = JSON.parse(raw)
    } catch {
        // si no es JSON, devolvemos el texto tal cual
        if (raw.startsWith("data:image")) return raw
        return null
    }

    const base64 =
        data?.base64 ||
        data?.qr ||
        data?.qrcode ||
        (data?.image && data.image.base64)

    if (!base64) return null

    // si ya viene como data:image la dejamos
    if (typeof base64 === "string" && base64.startsWith("data:image")) {
        return base64
    }

    return `data:image/png;base64,${base64}`
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}))
    const phone = (body?.phone as string | undefined)?.replace(/\D/g, "")
    const sessionName = phone ? `galle-${phone}` : "default"

    try {
        await ensureSession(sessionName)
        await startSession(sessionName)
        const qr = await fetchQr(sessionName)

        if (!qr) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "NO_QR",
                    detail: "WAHA no devolvió un QR válido",
                },
                { status: 502 },
            )
        }

        return NextResponse.json(
            {
                ok: true,
                hasQR: true,
                isConnected: false,
                qrcode: qr,
                session: sessionName,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ WAHA_START_ERROR:", err?.message || err)
        return NextResponse.json(
            {
                ok: false,
                error: "WAHA_START_ERROR",
                detail: err?.message || "Error desconocido al hablar con WAHA",
            },
            { status: 502 },
        )
    }
}

// opcional: bloquear GET para que nunca salga 405 feo
export async function GET(_req: NextRequest) {
    return NextResponse.json(
        {
            ok: false,
            error: "METHOD_NOT_ALLOWED",
            detail: "Usa POST en /api/whatsapp/wpp/start",
        },
        { status: 405 },
    )
}
