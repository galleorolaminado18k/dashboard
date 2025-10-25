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

    if (adsets.length === 0) {
      console.log("[API adsets] No adsets found for campaign:", campaignId)
      console.log("[API adsets] Note: This campaign might have ads directly without adsets")
    }

    // Mapear los adsets al formato esperado por la UI
    const rows = adsets.map((adset: any) => {
      const row = {
        id: adset.id,
        name: adset.name,
        status: adset.status,
        delivery: adset.delivery || (adset.status === "active" ? "Activa" : "Pausada"),
        budget: Number(adset.budget || 0),
        spend: Number(adset.spend || 0),
        impressions: Number(adset.impressions || 0),
        clicks: Number(adset.clicks || 0),
        ctr: Number(adset.ctr || 0),
      }
      console.log(`[API adsets]   → ${row.name}: budget=$${row.budget}, spend=$${row.spend}, impressions=${row.impressions}`)
      return row
    })

    console.log("[API adsets] Returning", rows.length, "adsets")
    // Siempre retornar éxito, incluso si no hay adsets
    return NextResponse.json({
      adsets,
      rows,
      message: adsets.length === 0 ? "Esta campaña no tiene conjuntos de anuncios configurados. Los anuncios pueden estar directamente en la campaña." : undefined
    })
  } catch (error: any) {
    console.error("[API adsets] Error:", error.message, error.stack)
    return NextResponse.json(
      { error: error.message || "Error obteniendo adsets", details: error.toString() },
      { status: 500 }
    )
  }
}

