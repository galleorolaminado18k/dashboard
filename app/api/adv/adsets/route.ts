import { NextRequest, NextResponse } from "next/server"
import { getRealAdsets } from "@/lib/adv-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")

  console.log("[API adsets] Request received, campaignId:", campaignId)

  if (!campaignId) {
    console.log("[API adsets] Error: No campaignId provided")
    return NextResponse.json(
      { error: "Se requiere campaignId" },
      { status: 400 }
    )
  }

  try {
    console.log("[API adsets] Fetching adsets for campaign:", campaignId)
    const adsets = await getRealAdsets(campaignId)
    console.log("[API adsets] Adsets fetched successfully, count:", adsets.length)

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

    console.log("[API adsets] Returning", rows.length, "adsets")
    return NextResponse.json({ adsets, rows })
  } catch (error: any) {
    console.error("[API adsets] Error:", error.message, error.stack)
    return NextResponse.json(
      { error: error.message || "Error obteniendo adsets", details: error.toString() },
      { status: 500 }
    )
  }
}

