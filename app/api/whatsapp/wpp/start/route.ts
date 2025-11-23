// app/api/whatsapp/wpp/start/route.ts

import { NextRequest, NextResponse } from "next/server"

// URL base del WAHA (usa tus vars de Vercel)
const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    "https://wpp.galle18k.com"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY

// Helper para llamar a WAHA con headers correctos
async function callWaha(path: string, init?: RequestInit) {
    const url = `${WAHA_BASE_URL.replace(/\/$/, "")}${path}`

    const res = await fetch(url, {
        cache: "no-store",
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(WAHA_API_KEY ? { "x-api-key": WAHA_API_KEY } : {}),
            ...(init?.headers || {}),
        },
    })

    const raw = await res.text()
    let json: any = null

    try {
        json = raw ? JSON.parse(raw) : null
    } catch {
        // dejamos json en null, pero guardamos raw para debug
    }

    return { res, json, raw }
}

// Sólo necesitamos POST desde el front
export async function POST(_req: NextRequest) {
    try {
        // ⚠️ WAHA FREE solo permite la sesión "default"
        const sessionName = "default"

        // 1. Arrancar (o asegurar) la sesión en WAHA
        const { res: startRes, json: startJson, raw: startRaw } =
            await callWaha("/api/sessions/start", {
                method: "POST",
                body: JSON.stringify({
                    name: sessionName,
                    // config sencillo para whatsapp-web
                    config: {
                        type: "whatsapp-web",
                    },
                }),
            })

        // 409 = ya está creada / iniciada → lo aceptamos
        if (!startRes.ok && startRes.status !== 409) {
            console.error(
                "❌ WAHA_START_ERROR:",
                startRes.status,
                startJson || startRaw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_ERROR",
                    detail: `HTTP ${startRes.status}`,
                    raw: startJson || startRaw,
                },
                { status: 502 },
            )
        }

        // 2. Pedir el QR correctamente
        //    ANTES tenías: /auth/qr?format=image  → 404
        const {
            res: qrRes,
            json: qrJson,
            raw: qrRaw,
        } = await callWaha(
            `/api/sessions/${encodeURIComponent(
                sessionName,
            )}/qr?format=image`,
            { method: "GET" },
        )

        if (!qrRes.ok) {
            console.error(
                "❌ WAHA_GET_QR_ERROR:",
                qrRes.status,
                qrJson || qrRaw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_GET_QR_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                    raw: qrJson || qrRaw,
                },
                { status: 502 },
            )
        }

        // WAHA suele devolver algo tipo { qr: "data:image/png;base64,..." }
        const qrImage: string | null =
            qrJson?.qr || qrJson?.image || qrJson?.qrcode || null

        if (!qrImage) {
            console.error("❌ WAHA sin campo de QR:", qrJson || qrRaw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_INVALID_QR_RESPONSE",
                    detail: "Respuesta sin código QR",
                    raw: qrJson || qrRaw,
                },
                { status: 502 },
            )
        }

        // 3. Respuesta al dashboard
        return NextResponse.json(
            {
                ok: true,
                qr: qrImage,
                session: sessionName,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("❌ Error en /api/whatsapp/wpp/start:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "WAHA_GATEWAY_PROXY_ERROR",
                detail: String(err?.message || err),
            },
            { status: 500 },
        )
    }
}
