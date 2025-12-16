import { NextRequest, NextResponse } from "next/server"

const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handleStart(req: NextRequest) {
    try {
        // Verificar si se pide forzar nuevo QR
        const url = new URL(req.url)
        const forceNew = url.searchParams.get("forceNew") === "true"

        console.log(`🚀 WhatsApp Start - forceNew: ${forceNew}, Gateway: ${GATEWAY_URL}`)

        // Si se pide forzar nuevo QR, hacer logout + restart
        if (forceNew) {
            console.log(`🔄 Forzando nuevo QR...`)

            // Logout primero
            try {
                await fetch(`${GATEWAY_URL}/logout`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(10000),
                })
                console.log(`🧹 Logout ejecutado`)
            } catch (e) {
                console.log(`⚠️ Logout falló (puede ser normal):`, e)
            }

            // Esperar un poco
            await new Promise(r => setTimeout(r, 2000))

            // Restart para generar nuevo QR
            try {
                await fetch(`${GATEWAY_URL}/restart`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(30000),
                })
                console.log(`🔄 Restart ejecutado`)
            } catch (e) {
                console.log(`⚠️ Restart timeout (puede ser normal)`)
            }

            // Esperar a que se genere el QR
            await new Promise(r => setTimeout(r, 8000))
        }

        // Verificar el estado actual
        const statusRes = await fetch(`${GATEWAY_URL}/status`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const status = await statusRes.json()
        console.log(`📊 Estado:`, JSON.stringify(status))

        // Si ya está conectado, retornar éxito
        if (status.isConnected) {
            return NextResponse.json({
                ok: true,
                isConnected: true,
                hasQR: false,
                qr: null,
                qrcode: null,
                message: "WhatsApp conectado",
            }, { status: 200 })
        }

        // Obtener QR
        const qrRes = await fetch(`${GATEWAY_URL}/qr`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const qrData = await qrRes.json()

        if (qrData.hasQR && qrData.qr) {
            return NextResponse.json({
                ok: true,
                isConnected: false,
                hasQR: true,
                qr: qrData.qr,
                qrcode: qrData.qr,
                message: "Escanea el código QR",
            }, { status: 200 })
        }

        // Si no hay QR, intentar restart
        if (!forceNew) {
            console.log(`🔄 No hay QR, haciendo restart...`)

            try {
                await fetch(`${GATEWAY_URL}/restart`, {
                    method: "POST",
                    cache: "no-store",
                    signal: AbortSignal.timeout(30000),
                })
            } catch (e) {
                console.log(`⚠️ Restart timeout`)
            }

            await new Promise(r => setTimeout(r, 8000))

            const newQrRes = await fetch(`${GATEWAY_URL}/qr`, {
                cache: "no-store",
                signal: AbortSignal.timeout(10000),
            })

            const newQrData = await newQrRes.json()

            return NextResponse.json({
                ok: newQrData.hasQR || newQrData.isConnected,
                isConnected: newQrData.isConnected ?? false,
                hasQR: newQrData.hasQR ?? false,
                qr: newQrData.qr || null,
                qrcode: newQrData.qr || null,
                message: newQrData.message || "Esperando QR...",
            }, { status: 200 })
        }

        return NextResponse.json({
            ok: false,
            isConnected: false,
            hasQR: false,
            message: "No se pudo generar QR. Intenta de nuevo.",
        }, { status: 200 })

    } catch (err: any) {
        console.error("❌ Error:", err)

        return NextResponse.json({
            ok: false,
            error: "GATEWAY_ERROR",
            detail: String(err?.message || err),
            isConnected: false,
            hasQR: false,
        }, { status: 502 })
    }
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}

export async function GET(req: NextRequest) {
    return handleStart(req)
}
