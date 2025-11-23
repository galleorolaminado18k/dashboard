import { NextRequest, NextResponse } from "next/server"

const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL || // fallback
    "https://wpp.galle18k.com"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY ||
    process.env.WA_GATEWAY_API_KEY || ""

async function callWaha(
    path: string,
    options: RequestInit = {},
): Promise<{ res: Response; raw: string }> {
    const url = `${WAHA_BASE_URL}${path}`

    const headers: HeadersInit = {
        "X-Api-Key": WAHA_API_KEY,
        ...(options.headers || {}),
    }

    const res = await fetch(url, {
        ...options,
        headers,
    })

    const raw = await res.text()
    return { res, raw }
}

async function handleStart(_req: NextRequest) {
    if (!WAHA_API_KEY || !WAHA_BASE_URL) {
        console.error("❌ WAHA_BASE_URL o WAHA_API_KEY no configurados")
        return NextResponse.json(
            {
                ok: false,
                error: "CONFIG_ERROR",
                detail: "Falta WAHA_BASE_URL o WAHA_API_KEY en Vercel",
            },
            { status: 500 },
        )
    }

    try {
        // 1) Crear sesión "default" (si ya existe, ignoramos el error)
        try {
            const { res, raw } = await callWaha("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "default", config: {} }),
            })

            if (!res.ok && res.status !== 409) {
                console.warn("⚠️ No se pudo crear sesión (posible ya exista):", res.status, raw)
            }
        } catch (e) {
            console.warn("⚠️ Error creando sesión (ignorable si ya existe):", e)
        }

        // 2) Iniciar sesión "default"
        const { res: startRes, raw: startRaw } = await callWaha(
            "/api/sessions/default/start",
            { method: "POST" },
        )

        if (!startRes.ok) {
            console.error("❌ Error al iniciar sesión:", startRes.status, startRaw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_ERROR",
                    detail: `HTTP ${startRes.status}`,
                    raw: startRaw,
                },
                { status: 502 },
            )
        }

        // 3) Pedir QR a Evolution: /api/default/auth/qr
        const { res: qrRes, raw: qrRaw } = await callWaha(
            "/api/default/auth/qr",
            { method: "GET" },
        )

        if (!qrRes.ok) {
            console.error("❌ Error al obtener QR:", qrRes.status, qrRaw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_QR_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                    raw: qrRaw,
                },
                { status: 502 },
            )
        }

        let qrJson: any
        try {
            qrJson = JSON.parse(qrRaw)
        } catch (e) {
            console.error("❌ JSON inválido en /auth/qr:", e, qrRaw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_QR_JSON",
                    detail: "Respuesta inválida del servidor WAHA",
                    raw: qrRaw,
                },
                { status: 502 },
            )
        }

        const qrcode: string | null =
            qrJson.qrcode || qrJson.qr || qrJson.qrCode || null

        if (!qrcode) {
            console.error("❌ Respuesta sin qrcode:", qrJson)
            return NextResponse.json(
                {
                    ok: false,
                    error: "QR_NOT_FOUND",
                    detail: "El servidor no devolvió la imagen del QR",
                    raw: qrJson,
                },
                { status: 502 },
            )
        }

        // ✅ Todo bien
        return NextResponse.json(
            {
                ok: true,
                hasQR: true,
                isConnected: !!qrJson.isConnected,
                qrcode,
                session: "default",
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ Error general en /api/whatsapp/wpp/start:", err)
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
