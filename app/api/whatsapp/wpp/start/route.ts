import { NextRequest, NextResponse } from "next/server"

const BASE_URL =
    (process.env.WA_GATEWAY_URL ||
        process.env.WAHA_BASE_URL ||
        process.env.WHATSAPP_GATEWAY_URL ||
        "").replace(/\/+$/, "")

const API_KEY =
    process.env.WA_GATEWAY_API_KEY || process.env.WAHA_API_KEY || ""

function buildSessionName(phone?: string) {
    const clean = (phone || "").replace(/\D/g, "")
    return clean ? `galle-${clean}` : "default"
}

async function ensureSession(session: string) {
    if (!BASE_URL) {
        throw new Error("WAHA_BASE_URL / WA_GATEWAY_URL no está configurada")
    }

    const res = await fetch(`${BASE_URL}/api/sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(API_KEY ? { "X-Api-Key": API_KEY } : {}),
        },
        body: JSON.stringify({ name: session }),
    })

    const raw = await res.text()
    let json: any = null
    try {
        json = raw ? JSON.parse(raw) : null
    } catch {
        // ignoramos, solo para logging
    }

    // 201/200 OK  |  409 = ya existe -> lo tratamos como OK
    if (!res.ok && res.status !== 409) {
        console.error("❌ WAHA create session error:", res.status, raw)
        throw new Error(`WAHA_CREATE_SESSION_ERROR HTTP ${res.status}`)
    }

    return { status: res.status, data: json }
}

async function getQr(session: string) {
    const res = await fetch(
        `${BASE_URL}/api/${encodeURIComponent(session)}/auth/qr`,
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(API_KEY ? { "X-Api-Key": API_KEY } : {}),
            },
        },
    )

    const raw = await res.text()
    let json: any = null
    try {
        json = raw ? JSON.parse(raw) : null
    } catch {
        json = { raw }
    }

    if (!res.ok) {
        console.error("❌ WAHA QR error:", res.status, raw)
        const msg =
            json?.message ||
            json?.error ||
            `WAHA_QR_ERROR HTTP ${res.status}`
        throw new Error(msg)
    }

    const qr: string | undefined =
        json?.qr || json?.qrcode || json?.dataUrl || json?.dataURL

    if (!qr) {
        console.error("❌ WAHA QR sin campo qr/qrcode/dataUrl:", json)
        throw new Error("WAHA_QR_SIN_DATO")
    }

    return { qr, raw: json }
}

async function handleStart(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => ({}))) as {
            phone?: string
        }

        const phone = body?.phone || ""
        const session = buildSessionName(phone)

        console.log("▶️ Iniciando sesión WAHA", { BASE_URL, session })

        if (!BASE_URL) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "CONFIG_ERROR",
                    detail:
                        "Falta WA_GATEWAY_URL o WAHA_BASE_URL en Vercel",
                },
                { status: 500 },
            )
        }

        await ensureSession(session)
        const { qr, raw } = await getQr(session)

        return NextResponse.json(
            {
                ok: true,
                session,
                qr,
                raw,
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

export async function POST(req: NextRequest) {
    return handleStart(req)
}

// Opcional: permitir GET (por si el navegador hace prefetch)
export async function GET(req: NextRequest) {
    return handleStart(req)
}
