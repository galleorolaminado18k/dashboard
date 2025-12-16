// API para obtener estado de conexión de WhatsApp desde el VPS Gateway
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// URL del Gateway en el VPS
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || process.env.WAHA_BASE_URL || ""

/**
 * GET /api/whatsapp/connection-state
 * Obtener el estado de conexión directamente del Gateway en el VPS
 */
export async function GET() {
  try {
    if (!GATEWAY_URL) {
      console.error("[WA-STATE] BAILEYS_GATEWAY_URL no configurada")
      return NextResponse.json({
        ok: false,
        connected: false,
        error: "Gateway URL no configurada",
      })
    }

    console.log("[WA-STATE] Consultando Gateway en:", GATEWAY_URL)

    // Consultar el estado directamente del Gateway en el VPS
    const response = await fetch(`${GATEWAY_URL}/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000), // 10 segundos timeout
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[WA-STATE] Error del Gateway:", response.status)
      return NextResponse.json({
        ok: false,
        connected: false,
        error: `Gateway respondió con error ${response.status}`,
      })
    }

    const data = await response.json()
    console.log("[WA-STATE] Respuesta del Gateway:", data)

    // El Gateway mantiene el estado real de la conexión
    const connected = data?.isConnected ?? false
    const hasQR = data?.hasQR ?? false
    const lastUpdate = data?.lastUpdate ?? null

    return NextResponse.json({
      ok: true,
      connected,
      hasQR,
      lastUpdate,
      gatewayAvailable: true,
    })
  } catch (error: any) {
    console.error("[WA-STATE] Error conectando al Gateway:", error.message)
    return NextResponse.json({
      ok: false,
      connected: false,
      error: error.message,
      gatewayAvailable: false,
    })
  }
}
