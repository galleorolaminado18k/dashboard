// app/api/whatsapp/wpp/start/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
    try {
        const baseUrl = process.env.WHATSAPP_GATEWAY_URL

        if (!baseUrl) {
            console.error('[WPP_START] WHATSAPP_GATEWAY_URL no está seteada')
            return NextResponse.json(
                {
                    ok: false,
                    error: 'WHATSAPP_GATEWAY_URL_NOT_SET',
                    hasQR: false,
                    isConnected: false,
                    qr: null,
                },
                { status: 500 },
            )
        }

        const url = `${baseUrl.replace(/\/+$/, '')}/qr`
        console.log('[WPP_START] Llamando al gateway:', url)

        const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.error(
                '[WPP_START] Gateway respondió != 200',
                res.status,
                text,
            )

            return NextResponse.json(
                {
                    ok: false,
                    error: 'GATEWAY_HTTP_ERROR',
                    hasQR: false,
                    isConnected: false,
                    qr: null,
                    detail: `Status ${res.status}`,
                },
                { status: 500 },
            )
        }

        const qrJson = await res.json().catch((err) => {
            console.error('[WPP_START] Error parseando JSON del gateway', err)
            throw new Error('INVALID_JSON_FROM_GATEWAY')
        })

        const hasQR = !!qrJson?.qr
        const isConnected = !!qrJson?.isConnected

        console.log('[WPP_START] Respuesta gateway:', { hasQR, isConnected })

        return NextResponse.json(
            {
                ok: hasQR,          // true solo si hay QR
                error: null,
                hasQR,
                isConnected,
                qr: hasQR ? String(qrJson.qr) : null,
                raw: qrJson,        // por si necesitamos depurar en consola
            },
            { status: 200 },
        )
    } catch (err: any) {
        console.error('[WPP_START] Error inesperado:', err)

        return NextResponse.json(
            {
                ok: false,
                error: 'GATEWAY_PROXY_ERROR',
                hasQR: false,
                isConnected: false,
                qr: null,
                detail: String(err?.message ?? err),
            },
            { status: 500 },
        )
    }
}
