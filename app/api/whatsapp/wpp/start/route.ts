import { NextRequest, NextResponse } from "next/server"

// Usa el gateway BuilderBot
// BAILEYS_GATEWAY_URL=http://localhost:3010 (local)
// BAILEYS_GATEWAY_URL=http://IP_VPS:3010 (producción)
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

// Forzar runtime Node y sin caché
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handleStart(_req: NextRequest) {
    try {
        console.log(`📡 Conectando a gateway: ${GATEWAY_URL}/qr`)

        // Llamada al gateway BuilderBot -> /qr
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const gwRes = await fetch(`${GATEWAY_URL}/qr`, {
            cache: "no-store",
            signal: controller.signal,
        })

        clearTimeout(timeout)

        const raw = await gwRes.text()
        let json: any

        try {
            json = JSON.parse(raw)
        } catch {
            return NextResponse.json(
                {
                    ok: false,
                    error: "INVALID_GATEWAY_JSON",
                    detail: "Respuesta inválida del gateway BuilderBot",
                    raw: raw.slice(0, 300),
                },
                { status: 200 },
            )
        }

        // Mapear respuesta del gateway al formato esperado por el frontend
        return NextResponse.json(
            {
                ok: json.ok ?? true,
                isConnected: json.isConnected ?? false,
                hasQR: json.hasQR ?? false,
                qr: json.qr || null, // data:image/png;base64,...
                qrcode: json.qr || null, // alias para compatibilidad
                message: json.message || null,
                error: json.error || null,
                lastUpdate: json.lastUpdate || null,
                gatewayStatus: gwRes.status,
            },
            {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                }
            },
        )
    } catch (err: any) {
        console.error("❌ Error en proxy /api/whatsapp/wpp/start:", err)

        // Diferenciar errores
        let errorCode = "GATEWAY_UNREACHABLE"
        let detail = String(err?.message || err)

        if (err?.name === "AbortError") {
            errorCode = "GATEWAY_TIMEOUT"
            detail = "El gateway no respondió en 15 segundos"
        } else if (err?.cause?.code === "ECONNREFUSED") {
            errorCode = "GATEWAY_NOT_RUNNING"
            detail = `No se puede conectar a ${GATEWAY_URL}. ¿Está el gateway ejecutándose?`
        }

        return NextResponse.json(
            {
                ok: false,
                error: errorCode,
                detail,
                gatewayUrl: GATEWAY_URL,
            },
            { status: 502 },
        )
    }
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
