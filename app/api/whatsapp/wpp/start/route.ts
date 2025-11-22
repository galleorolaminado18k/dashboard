import { NextResponse } from 'next/server'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL

export async function POST () {
    try {
        if (!GATEWAY_URL) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'WHATSAPP_GATEWAY_URL not set',
                },
                { status: 500 },
            )
        }

        const res = await fetch(`${GATEWAY_URL}/qr`, { cache: 'no-store' })

        if (!res.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'GATEWAY_PROXY_ERROR',
                    detail: `HTTP ${res.status}`,
                },
                { status: 500 },
            )
        }

        const qrJson = (await res.json()) as {
            hasQR: boolean
            isConnected: boolean
            qr?: string | null
        }

        // Éxito real: tenemos QR
        if (qrJson.qr) {
            return NextResponse.json(
                {
                    ok: true,
                    error: null,
                    hasQR: true,
                    isConnected: !!qrJson.isConnected,
                    qr: qrJson.qr,
                },
                { status: 200 },
            )
        }

        // Gateway respondió pero todavía no hay QR
        return NextResponse.json(
            {
                ok: false,
                error: 'NO_QR_AVAILABLE',
                data: qrJson,
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error('Error en /api/whatsapp/wpp/start...', err)
        return NextResponse.json(
            {
                ok: false,
                error: 'GATEWAY_PROXY_ERROR',
                detail: String(err?.message ?? err),
            },
            { status: 500 },
        )
    }
}
