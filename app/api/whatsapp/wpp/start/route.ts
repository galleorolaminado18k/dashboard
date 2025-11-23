import { NextRequest, NextResponse } from "next/server"

const WA_GATEWAY_URL =
    process.env.WA_GATEWAY_URL || "https://wpp.galle18k.com"

// Usa env si la tienes, si no, tu API key actual como respaldo
const WA_GATEWAY_API_KEY =
    process.env.WA_GATEWAY_API_KEY || "bb841979e8b66e6a0f563235b5df3d9a"

const SESSION_NAME = "default"

// Función común para GET y POST
async function handleStart(_req: NextRequest) {
    try {
        // 1️⃣ Asegurar que exista la sesión
        try {
            await fetch(`${WA_GATEWAY_URL}/api/sessions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": WA_GATEWAY_API_KEY,
                },
                body: JSON.stringify({
                    name: SESSION_NAME,
                    config: {},
                }),
            })
        } catch (e) {
            console.warn("⚠️ No se pudo crear sesión (puede que ya exista):", e)
        }

        // 2️⃣ Iniciar la sesión
        try {
            await fetch(`${WA_GATEWAY_URL}/api/sessions/${SESSION_NAME}/start`, {
                method: "POST",
                headers: {
                    "X-Api-Key": WA_GATEWAY_API_KEY,
                },
            })
        } catch (e) {
            console.warn("⚠️ No se pudo iniciar sesión (puede que ya esté iniciada):", e)
        }

        // 3️⃣ Pedir el QR exactamente igual que en tu script:
        // curl -s -H "X-Api-Key: $API_KEY" "$BASE_URL/api/default/auth/qr"
        const qrRes = await fetch(
            `${WA_GATEWAY_URL}/api/${SESSION_NAME}/auth/qr`,
            {
                headers: {
                    "X-Api-Key": WA_GATEWAY_API_KEY,
                },
            },
        )

        const raw = await qrRes.text()

        if (!qrRes.ok) {
            console.error("❌ Error WA_GATEWAY /auth/qr:", qrRes.status, raw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "WA_GATEWAY_ERROR",
                    detail: `HTTP ${qrRes.status}`,
                },
                { status: 502 },
            )
        }

        let qrJson: any
        try {
            qrJson = JSON.parse(raw)
        } catch (e) {
            console.error("❌ JSON inválido desde WA_GATEWAY:", e, raw)
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_GATEWAY_JSON",
                    detail: "Respuesta inválida del gateway",
                },
                { status: 502 },
            )
        }

        const qrcode: string | null = qrJson.qr || qrJson.qrcode || null

        if (!qrcode) {
            console.error("❌ Gateway no devolvió campo qr/qrcode:", qrJson)
            return NextResponse.json(
                {
                    ok: false,
                    error: "MISSING_QR",
                    detail: "Gateway respondió sin QR",
                },
                { status: 502 },
            )
        }

        // 4️⃣ Respuesta estándar para el frontend
        return NextResponse.json(
            {
                ok: true,
                hasQR: qrJson.hasQR ?? true,
                isConnected: qrJson.isConnected ?? false,
                qrcode,
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

// Aceptamos GET y POST para evitar 405
export async function GET(req: NextRequest) {
    return handleStart(req)
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}
