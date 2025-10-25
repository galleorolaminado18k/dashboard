import { NextResponse } from "next/server"
import advServer from "@/lib/adv-server"

// Mock de adsets por campaña (fallback)
const adsetsByCampaign: Record<string, any[]> = {
  camp_1: [
    { id: "as_1", name: "Anillos 18k", impressions: 45000, spend: 850000, conversions: 23 },
    { id: "as_2", name: "Collares Premium", impressions: 38000, spend: 720000, conversions: 19 },
    { id: "as_3", name: "Aretes Diamante", impressions: 52000, spend: 980000, conversions: 28 },
  ],
  camp_2: [
    { id: "as_4", name: "Balines Oro 14k", impressions: 62000, spend: 1200000, conversions: 35 },
    { id: "as_5", name: "Balines Plata", impressions: 48000, spend: 890000, conversions: 27 },
  ],
  camp_3: [{ id: "as_6", name: "Ofertas BF", impressions: 120000, spend: 2500000, conversions: 68 }],
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Forzar uso de datos reales en pesos colombianos
  try {
    const adsets = await advServer.getRealAdsets(params.id)
    return NextResponse.json({ adsets })
  } catch (err: any) {
    console.error("adv adsets error:", err)
    return NextResponse.json({ error: err.message, adsets: [] }, { status: 500 })
  }
}
