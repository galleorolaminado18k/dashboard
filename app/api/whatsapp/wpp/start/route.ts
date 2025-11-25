import { NextRequest, NextResponse } from "next/server"

const BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    process.env.WHATSAPP_GATEWAY_URL

const API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY

const SESSION_ID = "default" // versión FREE de WAHA solo permite "default"

async function handleStart(_req: NextRequest) {
    if (!BASE_URL) {
        console.error("❌ No está configurada WAHA_BASE_URL / WA_GATEWAY_URL")
        return NextResponse.json(
            {
                ok: false,
                error: "MISSING_GATEWAY_URL",
                detail: "Configura WAHA_BASE_URL o WA_GATEWAY_URL en Vercel",
            },
            { status: 500 },
        )
    }

    const cleanBase = BASE_URL.replace(/\/+$/, "")

    try {
        // 1) Asegurar que la sesión default está creada / arrancada
        const startRes = await fetch(`${cleanBase}/api/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(API_KEY ? { "x-api-key": API_KEY } : {}),
            },
            body: JSON.stringify({ session: SESSION_ID }),
        }).catch((e) => {
            console.error("❌ Error de red al crear sesión WAHA:", e)
            throw new Error("No se pudo contactar el gateway WAHA")
        })

        const startRaw = await startRes.text()
        if (!startRes.ok && startRes.status !== 409) {
            // 409 = “ya existe”
            console.error(
                "❌ WAHA_START_ERROR:",
                startRes.status,
                startRaw,
            )
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

        // 2) Pedir el QR en base64 (NO imagen directa)
        const qrRes = await fetch(
            `${cleanBase}/api/sessions/${encodeURIComponent(
                SESSION_ID,
            )}/qr?format=base64`,
            {
                headers: {
                    Accept: "application/json",
                    ...(API_KEY ? { "x-api-key": API_KEY } : {}),
                },
            },
        ).catch((e) => {
            console.error("❌ Error de red al pedir QR WAHA:", e)
            throw new Error("No se pudo contactar el gateway WAHA (QR)")
        })

        const qrRaw = await qrRes.text()

        if (!qrRes.ok) {
            console.error(
                "❌ WA_QR_ERROR:",
                qrRes.status,
                qrRaw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WA_QR_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                    raw: qrRaw,
                },
                { status: 502 },
            )
        }

        let payload: any
        try {
            payload = JSON.parse(qrRaw)
        } catch (e) {
            console.error("❌ QR no es JSON válido:", e, qrRaw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_QR_JSON",
                    detail: "Respuesta inválida del gateway WAHA",
                },
                { status: 502 },
            )
        }

        const base64 = payload.qr || payload.qrcode || payload.image
        if (!base64) {
            console.error("❌ WAHA no devolvió campo qr / qrcode / image", payload)
            return NextResponse.json(
                {
                    ok: false,
                    error: "MISSING_QR",
                    detail: "El gateway no devolvió el código QR",
                },
                { status: 502 },
            )
        }

        const dataUrl = base64.startsWith("data:")
            ? base64
            : `data:image/png;base64,${base64}`

        return NextResponse.json(
            {
                ok: true,
                qrcode: dataUrl,
                session: SESSION_ID,
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

export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
