import { NextRequest, NextResponse } from "next/server"
import { getAdsetsWithCRMData } from "@/lib/adv-combined"

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
    console.log("[API adsets] Fetching adsets with CRM data for campaign:", campaignId)
    const adsets = await getAdsetsWithCRMData(campaignId)
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
        conversions: Number(adset.conversions || 0),  // Del CRM
        cpa: Number(adset.cpa || 0),                  // Calculado
        sales: Number(adset.sales || 0),              // Del CRM (pedido-completo)
        revenue: Number(adset.revenue || 0),          // De tabla sales
        roas: Number(adset.roas || 0),                // Calculado
        cvr: Number(adset.cvr || 0),                  // Calculado
        impressions: Number(adset.impressions || 0),
        clicks: Number(adset.clicks || 0),
        ctr: Number(adset.ctr || 0),
      }
      console.log(`[API adsets]   → ${row.name}: budget=$${row.budget}, spend=$${row.spend}, conv=${row.conversions}, sales=${row.sales}, revenue=$${row.revenue}, roas=${row.roas.toFixed(2)}x`)
      return row
    })

    console.log("[API adsets] Returning", rows.length, "adsets with CRM data")
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

