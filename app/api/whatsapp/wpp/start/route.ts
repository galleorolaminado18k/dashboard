import { NextRequest, NextResponse } from "next/server"

const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL || "https://wpp.galle18k.com"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY || ""

async function waha(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {})
    headers.set("X-Api-Key", WAHA_API_KEY)
    if (init.method && init.method !== "GET" && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    return fetch(`${WAHA_BASE_URL}${path}`, {
        ...init,
        headers,
    })
}

async function handleStart(_req: NextRequest) {
    const sessionName = "default"

    try {
        // 1) Crear sesión (si ya existe, ignoramos 400/409)
        const createRes = await waha("/api/sessions", {
            method: "POST",
            body: JSON.stringify({ name: sessionName, config: {} }),
        })
        const createText = await createRes.text()
        if (!createRes.ok && createRes.status !== 400 && createRes.status !== 409) {
            console.error("❌ WAHA /api/sessions:", createRes.status, createText)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_CREATE_ERROR",
                    detail: `HTTP ${createRes.status}`,
                    raw: createText,
                },
                { status: 502 },
            )
        }

        // 2) Iniciar sesión
        const startRes = await waha(`/api/sessions/${sessionName}/start`, {
            method: "POST",
        })
        const startText = await startRes.text()
        if (!startRes.ok) {
            console.error(
                "❌ WAHA /api/sessions/default/start:",
                startRes.status,
                startText,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_ERROR",
                    detail: `HTTP ${startRes.status}`,
                    raw: startText,
                },
                { status: 502 },
            )
        }

        // 3) Pedir QR
        const qrRes = await waha(`/api/${sessionName}/auth/qr`)
        const qrText = await qrRes.text()

        if (!qrRes.ok) {
            console.error(
                "❌ WAHA /api/default/auth/qr:",
                qrRes.status,
                qrText,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_QR_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                    raw: qrText,
                },
                { status: 502 },
            )
        }

        // El backend puede devolver JSON o texto plano
        let qrJson: any = null
        let qrImage: string | null = null
        try {
            qrJson = JSON.parse(qrText)
            qrImage = qrJson.qrcode || qrJson.qr || null
        } catch {
            // Si no es JSON, asumimos que es directamente el data:image/...
            qrImage = qrText || null
        }

        if (!qrImage) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "QR_NOT_FOUND",
                    detail: "Gateway no devolvió imagen de QR",
                    raw: qrText,
                },
                { status: 502 },
            )
        }

        // ✅ Respuesta estándar para el front
        return NextResponse.json(
            {
                ok: true,
                hasQR: true,
                isConnected: false,
                qr: qrImage,
                qrcode: qrImage,
                session: sessionName,
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
