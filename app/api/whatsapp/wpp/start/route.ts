import { NextRequest, NextResponse } from "next/server"

const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    process.env.WHATSAPP_GATEWAY_URL

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY

const SESSION_NAME = "default"

async function wahaFetch(
    path: string,
    init: RequestInit = {},
): Promise<Response> {
    if (!WAHA_BASE_URL) {
        throw new Error("WAHA_BASE_URL / WA_GATEWAY_URL no está configurada")
    }

    const headers = new Headers(init.headers || {})
    headers.set("accept", "application/json")

    if (WAHA_API_KEY) {
        headers.set("x-api-key", WAHA_API_KEY)
    }

    return fetch(`${WAHA_BASE_URL}${path}`, {
        ...init,
        headers,
    })
}

async function handleStart(_req: NextRequest) {
    try {
        // 1) Intentar iniciar la sesión
        const startRes = await wahaFetch(
            `/api/sessions/${SESSION_NAME}/start`,
            { method: "POST" },
        )

        const startText = await startRes.text()
        let startJson: any = null
        try {
            startJson = JSON.parse(startText)
        } catch {
            // puede no ser JSON en algunos errores
        }

        // Si NO es ok y NO es el 422 de "ya está iniciada", devolvemos error
        if (!startRes.ok && startRes.status !== 422) {
            console.error("❌ WAHA_START_ERROR:", startRes.status, startText)
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

        // 422 pero por "Session 'default' is already started" → lo tratamos como OK
        if (
            startRes.status === 422 &&
            !(startJson?.message || "").includes("already started")
        ) {
            console.error("❌ WAHA_START_422_NO_EXPECTED:", startText)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_422",
                    detail: "422 inesperado al iniciar sesión",
                    raw: startText,
                },
                { status: 502 },
            )
        }

        // 2) Pedir el QR correcto: /api/{session}/auth/qr  (SIN "sessions")
        const qrRes = await wahaFetch(`/${SESSION_NAME}/auth/qr`)
        const qrText = await qrRes.text()

        if (!qrRes.ok) {
            console.error("❌ WAHA_QR_ERROR:", qrRes.status, qrText)
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

        let qrJson: any = null
        try {
            qrJson = JSON.parse(qrText)
        } catch {
            // si no es JSON, igual lo dejamos registrado
        }

        // Intentar encontrar el campo donde venga el QR
        let qrImage: string | null = null
        if (typeof qrJson === "string") {
            qrImage = qrJson
        } else if (qrJson) {
            qrImage =
                qrJson.qr ||
                qrJson.qrcode ||
                qrJson.image ||
                qrJson.base64 ||
                null
        }

        if (!qrImage) {
            console.error("❌ WAHA_QR_PARSE_ERROR. Body:", qrText)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_QR_PARSE_ERROR",
                    detail: "No se encontró el QR en la respuesta del gateway",
                    raw: qrText,
                },
                { status: 502 },
            )
        }

        // Aseguramos que sea data URL
        if (!qrImage.startsWith("data:")) {
            qrImage = `data:image/png;base64,${qrImage}`
        }

        // ✅ Respuesta estándar que espera tu frontend
        return NextResponse.json(
            {
                ok: true,
                qr: qrImage,
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

// Aceptamos GET y POST para que nunca dé 405
export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
