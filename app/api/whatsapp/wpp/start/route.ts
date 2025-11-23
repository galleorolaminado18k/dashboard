"use server"

import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

export const runtime = "nodejs"

// Usa las vars que ya tienes en Vercel
const WAHA_BASE_URL =
    process.env.WAHA_BASE_URL ||
    process.env.WA_GATEWAY_URL ||
    "https://wpp.galle18k.com"

const WAHA_API_KEY =
    process.env.WAHA_API_KEY || process.env.WA_GATEWAY_API_KEY || ""

if (!WAHA_BASE_URL) {
    console.warn("⚠️ WAHA_BASE_URL / WA_GATEWAY_URL NO definido")
}
if (!WAHA_API_KEY) {
    console.warn("⚠️ WAHA_API_KEY / WA_GATEWAY_API_KEY NO definido")
}

async function wahaJson(path: string, init: RequestInit = {}) {
    const url = `${WAHA_BASE_URL.replace(/\/$/, "")}${path}`
    const headers: HeadersInit = {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_API_KEY,
        ...(init.headers || {}),
    }

    const res = await fetch(url, {
        ...init,
        headers,
    })

    const raw = await res.text()
    let json: any = null
    try {
        json = raw ? JSON.parse(raw) : null
    } catch {
        json = { raw }
    }

    return { res, json, raw }
}

async function handleStart(req: NextRequest) {
    try {
        // 1) Tomar teléfono y construir nombre de sesión
        let phone = ""
        if (req.method === "POST") {
            try {
                const body = await req.json()
                phone = (body?.phone || "").toString().trim()
            } catch {
                // ignorar si no hay body
            }
        }

        const sessionName = phone ? `galle-${phone}` : "default"
        console.log("➡️ Iniciando sesión WAHA:", sessionName)

        // 2) Verificar si la sesión existe
        const getSession = await wahaJson(
            `/api/sessions/${encodeURIComponent(sessionName)}`,
            { method: "GET" },
        )

        if (getSession.res.status !== 200 && getSession.res.status !== 404) {
            console.error("❌ Error GET session:", getSession.res.status, getSession.raw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_GET_SESSION_ERROR",
                    detail: `HTTP ${getSession.res.status}`,
                    raw: getSession.raw,
                },
                { status: 502 },
            )
        }

        // 3) Crear sesión si NO existe (404)
        if (getSession.res.status === 404) {
            console.log("➕ Creando sesión en WAHA:", sessionName)
            const createSession = await wahaJson("/api/sessions", {
                method: "POST",
                body: JSON.stringify({
                    name: sessionName,
                    config: {}, // config mínima
                }),
            })

            if (!createSession.res.ok) {
                console.error(
                    "❌ Error creando sesión:",
                    createSession.res.status,
                    createSession.raw,
                )
                return NextResponse.json(
                    {
                        ok: false,
                        error: "WAHA_CREATE_SESSION_ERROR",
                        detail: `HTTP ${createSession.res.status}`,
                        raw: createSession.raw,
                    },
                    { status: 502 },
                )
            }
        }

        // 4) Start de la sesión
        console.log("▶️ Start sesión en WAHA:", sessionName)
        const startSession = await wahaJson(
            `/api/sessions/${encodeURIComponent(sessionName)}/start`,
            { method: "POST" },
        )

        if (!startSession.res.ok) {
            console.error(
                "❌ Error al hacer start:",
                startSession.res.status,
                startSession.raw,
            )
            return NextResponse.json(
                {
                    ok: false,
                    error: "WAHA_START_ERROR",
                    detail: `HTTP ${startSession.res.status}`,
                    raw: startSession.raw,
                },
                { status: 502 },
            )
        }

        // 5) Pedir QR (binario) y convertirlo a base64
        const qrUrl = `${WAHA_BASE_URL.replace(
            /\/$/,
            "",
        )}/api/${encodeURIComponent(sessionName)}/auth/qr`

        console.log("📡 Pidiendo QR a:", qrUrl)

        const qrRes = await fetch(qrUrl, {
            method: "POST",
            headers: {
                accept: "image/png",
                "X-Api-Key": WAHA_API_KEY,
            },
        })

        if (!qrRes.ok) {
            const raw = await qrRes.text()
            console.error("❌ Error obteniendo QR:", qrRes.status, raw)
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

        const arrayBuf = await qrRes.arrayBuffer()
        const base64 = Buffer.from(arrayBuf).toString("base64")
        const dataUrl = `data:image/png;base64,${base64}`

        console.log("✅ QR obtenido correctamente")

        return NextResponse.json(
            {
                ok: true,
                session: sessionName,
                qrcode: dataUrl,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error("💥 Error en /api/whatsapp/wpp/start:", err)
        return NextResponse.json(
            {
                ok: false,
                error: "WAHA_PROXY_ERROR",
                detail: String(err?.message || err),
            },
            { status: 500 },
        )
    }
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}

// opcional, para debug si llamas con GET desde el navegador
export async function GET(req: NextRequest) {
    return handleStart(req)
}
