import { NextResponse } from "next/server"

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL

export async function POST() {
    try {
        if (!GATEWAY_URL) {
            return NextResponse.json(
                { ok: false, error: "WHATSAPP_GATEWAY_URL not set" },
                { status: 500 }
            )
        }

        const baseUrl = GATEWAY_URL.replace(/\/$/, "")

        const qrRes = await fetch(`${baseUrl}/qr`, {
            method: "GET",
            cache: "no-store",
        })

        if (!qrRes.ok) {
            const text = await qrRes.text().catch(() => "")
            console.error("Gateway /qr error", qrRes.status, text)

            return NextResponse.json(
                { ok: false, error: "No se pudo obtener QR del gateway" },
                { status: 502 }
            )
        }

        const qrJson: any = await qrRes.json().catch((err) => {
            console.error("Error parseando JSON del gateway", err)
            return null
        })

        if (!qrJson || typeof qrJson.qr !== "string" || !qrJson.qr.length) {
            console.error("Payload inválido de /qr", qrJson)

            return NextResponse.json(
                { ok: false, error: "No se pudo obtener QR" },
                { status: 500 }
            )
        }

        // Objeto base con el QR
        const inner = {
            hasQR: qrJson.hasQR ?? true,
            isConnected: !!qrJson.isConnected,
            qr: qrJson.qr,
        }

        // Respuesta hiper-compatible para el frontend
        return NextResponse.json({
            ok: true,
            error: null,
            ...inner,
            data: {
                ok: true,
                error: null,
                ...inner,
                // por si en algún lado miran data.data.qr
                data: inner,
            },
        })
    } catch (err: any) {
        console.error("Error en /api/whatsapp/wpp/start", err)

        return NextResponse.json(
            {
                ok: false,
                error: "GATEWAY_PROXY_ERROR",
                detail: String(err?.message || err),
            },
            { status: 500 }
        )
    }
}
