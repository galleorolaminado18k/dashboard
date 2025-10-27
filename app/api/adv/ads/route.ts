import { NextRequest, NextResponse } from "next/server"
import { getAdsWithCRMData } from "@/lib/adv-combined"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")
  const adsetId = searchParams.get("adsetId")

  console.log("[API ads] Request received, campaignId:", campaignId, "adsetId:", adsetId)

  if (!campaignId && !adsetId) {
    console.log("[API ads] Error: No campaignId or adsetId provided")
    return NextResponse.json(
      { error: "Se requiere campaignId o adsetId" },
      { status: 400 }
    )
  }

  try {
    // Obtener anuncios reales de la API de Meta + CRM + Ventas
    const entityId = adsetId || campaignId
    if (!entityId) {
      console.log("[API ads] Error: entityId is null")
      return NextResponse.json(
        { error: "ID de campaña o adset no válido" },
        { status: 400 }
      )
    }

    console.log("[API ads] Fetching ads with CRM data for entity:", entityId)
    const ads = await getAdsWithCRMData(entityId)
    console.log("[API ads] Ads fetched successfully, count:", ads.length)

    // Mapear los anuncios al formato esperado por la UI
    const rows = ads.map((ad: any) => {
      const row = {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        delivery: ad.status === "active" ? "Activo" : "Pausado",
        spend: Number(ad.spend || 0),
        conversions: Number(ad.conversions || 0),  // Del CRM
        cpa: Number(ad.cpa || 0),                  // Calculado
        sales: Number(ad.sales || 0),              // Del CRM (pedido-completo)
        revenue: Number(ad.revenue || 0),          // De tabla sales
        roas: Number(ad.roas || 0),                // Calculado
        cvr: Number(ad.cvr || 0),                  // Calculado
        impressions: Number(ad.impressions || 0),
        ctr: Number(ad.ctr || 0),
        clicks: Number(ad.clicks || 0),
      }
      console.log(`[API ads]   → ${row.name}: spend=$${row.spend}, conv=${row.conversions}, sales=${row.sales}, revenue=$${row.revenue}, roas=${row.roas.toFixed(2)}x`)
      return row
    })

    console.log("[API ads] Returning", rows.length, "ads with CRM data, total spend:", rows.reduce((sum, r) => sum + r.spend, 0))
    return NextResponse.json({ ads, rows })
  } catch (error: any) {
    console.error("[API ads] Error:", error.message, error.stack)
    return NextResponse.json(
      { error: error.message || "Error obteniendo anuncios", details: error.toString() },
      { status: 500 }
    )
  }
}



