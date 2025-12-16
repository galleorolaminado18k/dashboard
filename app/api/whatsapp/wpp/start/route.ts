import { NextRequest, NextResponse } from "next/server"

const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function handleStart(_req: NextRequest) {
    try {
        console.log(`🚀 Verificando estado de WhatsApp en: ${GATEWAY_URL}`)

        // Primero verificar el estado actual
        const statusRes = await fetch(`${GATEWAY_URL}/status`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const status = await statusRes.json()
        console.log(`📊 Estado actual:`, JSON.stringify(status))

        // Si ya está conectado, retornar éxito sin hacer nada más
        if (status.isConnected) {
            console.log(`✅ WhatsApp ya está conectado`)
            return NextResponse.json({
                ok: true,
                isConnected: true,
                hasQR: false,
                qr: null,
                qrcode: null,
                message: "WhatsApp ya está conectado",
            }, { status: 200 })
        }

        // Si hay QR disponible, retornarlo
        const qrRes = await fetch(`${GATEWAY_URL}/qr`, {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
        })

        const qrData = await qrRes.json()
        console.log(`📊 QR data:`, JSON.stringify({ hasQR: qrData.hasQR, isConnected: qrData.isConnected }))

        if (qrData.isConnected) {
            return NextResponse.json({
                ok: true,
                isConnected: true,
                hasQR: false,
                qr: null,
                qrcode: null,
                message: "WhatsApp conectado",
            }, { status: 200 })
        }

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

        // Si no hay QR y no está conectado, hacer restart para generar uno nuevo
        console.log(`🔄 No hay QR ni conexión, reiniciando gateway...`)

        const restartRes = await fetch(`${GATEWAY_URL}/restart`, {
            method: "POST",
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
        })

        const restartData = await restartRes.json()
        console.log(`🔄 Restart resultado:`, JSON.stringify(restartData))

        // Esperar y obtener el QR
        await new Promise(r => setTimeout(r, 5000))

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
            message: newQrData.message || null,
            error: newQrData.error || null,
        }, { status: 200 })

    } catch (err: any) {
        console.error("❌ Error en /api/whatsapp/wpp/start:", err)

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
