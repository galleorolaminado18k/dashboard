import { NextRequest, NextResponse } from "next/server"

// Usa el gateway BuilderBot
// BAILEYS_GATEWAY_URL=http://localhost:3010 (local)
// BAILEYS_GATEWAY_URL=http://IP_VPS:3010 (producción)
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

// Forzar runtime Node y sin caché
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Función para hacer polling hasta obtener el QR
async function pollForQR(maxAttempts = 10, delayMs = 2000): Promise<any> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`📡 Intento ${attempt}/${maxAttempts} - Obteniendo QR de ${GATEWAY_URL}/qr`)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        try {
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
                console.log(`⚠️ Intento ${attempt}: Respuesta no es JSON válido`)
                continue
            }

            // Si ya está conectado, retornar éxito
            if (json.isConnected) {
                console.log(`✅ WhatsApp ya está conectado`)
                return { ...json, ok: true }
            }

            // Si hay QR, retornarlo
            if (json.hasQR && json.qr) {
                console.log(`✅ QR obtenido en intento ${attempt}`)
                return { ...json, ok: true }
            }

            // Si hay error, reportarlo
            if (json.error) {
                console.log(`❌ Error del gateway: ${json.error}`)
                return { ...json, ok: false }
            }

            // Si no hay QR aún, esperar y reintentar
            console.log(`⏳ Intento ${attempt}: QR no disponible aún, esperando ${delayMs}ms...`)
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        } catch (err: any) {
            clearTimeout(timeout)
            console.log(`⚠️ Intento ${attempt} falló: ${err.message}`)
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs))
            }
        }
    }

    return {
        ok: false,
        error: "QR_TIMEOUT",
        detail: `No se pudo obtener el QR después de ${maxAttempts} intentos. El gateway puede estar iniciándose.`,
    }
}

async function handleStart(_req: NextRequest) {
    try {
        console.log(`🚀 Iniciando conexión WhatsApp via BuilderBot Gateway: ${GATEWAY_URL}`)

        // Primero intentamos reiniciar el bot para forzar nuevo QR
        try {
            const restartRes = await fetch(`${GATEWAY_URL}/restart`, {
                method: "POST",
                cache: "no-store",
            })
            console.log(`🔄 Restart del gateway: ${restartRes.status}`)
            // Esperar un poco después del restart
            await new Promise(resolve => setTimeout(resolve, 3000))
        } catch (e) {
            console.log(`⚠️ No se pudo reiniciar el gateway (puede estar bien): ${e}`)
        }

        // Hacer polling para obtener el QR
        const result = await pollForQR(10, 2000)

        // Mapear respuesta al formato esperado por el frontend
        return NextResponse.json(
            {
                ok: result.ok ?? false,
                isConnected: result.isConnected ?? false,
                hasQR: result.hasQR ?? false,
                qr: result.qr || null,
                qrcode: result.qr || null, // alias para compatibilidad
                message: result.message || null,
                error: result.error || null,
                detail: result.detail || null,
                lastUpdate: result.lastUpdate || null,
            },
            {
                status: result.ok ? 200 : 502,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                }
            },
        )
    } catch (err: any) {
        console.error("❌ Error en /api/whatsapp/wpp/start:", err)

        let errorCode = "GATEWAY_UNREACHABLE"
        let detail = String(err?.message || err)

        if (err?.name === "AbortError") {
            errorCode = "GATEWAY_TIMEOUT"
            detail = "El gateway no respondió en tiempo"
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
