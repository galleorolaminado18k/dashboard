import { NextRequest, NextResponse } from "next/server"
import { getRealAdsets } from "@/lib/adv-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")

  if (!campaignId) {
    return NextResponse.json(
      { error: "Se requiere campaignId" },
      { status: 400 }
    )
  }

  try {
    const adsets = await getRealAdsets(campaignId)

    // Mapear los adsets al formato esperado por la UI
    const rows = adsets.map((adset: any) => ({
      id: adset.id,
      name: adset.name,
      status: adset.status,
      delivery: adset.status === "active" ? "Activa" : "Pausada",
      budget: adset.daily_budget || adset.lifetime_budget || 0,
      spend: adset.spend || 0,
      impressions: adset.impressions || 0,
      ctr: adset.ctr || 0,
    }))

    return NextResponse.json({ adsets, rows })
  } catch (error: any) {
    console.error("[API adsets] Error:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo adsets" },
      { status: 500 }
    )
  }
}

