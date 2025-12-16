// API Route para desconectar sesión de WhatsApp (Baileys Gateway)
import { NextRequest, NextResponse } from "next/server"

const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || "http://localhost:3010"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        console.log(`🔌 WhatsApp Logout - Gateway: ${GATEWAY_URL}`)

        // Llamar al logout del gateway
        const logoutRes = await fetch(`${GATEWAY_URL}/logout`, {
            method: "POST",
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
        })

        if (!logoutRes.ok) {
            const errorText = await logoutRes.text().catch(() => "Error desconocido")
            console.error(`❌ Error en logout:`, errorText)
            throw new Error(`Error al desconectar: ${logoutRes.status}`)
        }

        const data = await logoutRes.json().catch(() => ({ ok: true }))
        console.log(`✅ Logout exitoso:`, data)

        return NextResponse.json({
            ok: true,
            message: "WhatsApp desconectado correctamente",
        }, { status: 200 })

    } catch (error: any) {
        console.error("❌ Error en logout:", error)
        return NextResponse.json({
            ok: false,
            error: "LOGOUT_ERROR",
            detail: error.message || "Error al desconectar WhatsApp",
        }, { status: 500 })
    }
}

