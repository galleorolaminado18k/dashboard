import { NextRequest, NextResponse } from "next/server"
import { getRealAds } from "@/lib/adv-server"

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
    // Obtener anuncios reales de la API de Meta
    const entityId = adsetId || campaignId
    if (!entityId) {
      console.log("[API ads] Error: entityId is null")
      return NextResponse.json(
        { error: "ID de campaña o adset no válido" },
        { status: 400 }
      )
    }

    console.log("[API ads] Fetching ads for entity:", entityId)
    const ads = await getRealAds(entityId)
    console.log("[API ads] Ads fetched successfully, count:", ads.length)
    console.log("[API ads] Raw ads data:", JSON.stringify(ads, null, 2))

    // Mapear los anuncios al formato esperado por la UI
    const rows = ads.map((ad: any) => {
      const row = {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        delivery: ad.status === "active" ? "Activo" : "Pausado",
        spend: Number(ad.spend || 0),
        impressions: Number(ad.impressions || 0),
        ctr: Number(ad.ctr || 0),
        clicks: Number(ad.clicks || 0),
      }
      console.log(`[API ads]   → ${row.name}: spend=$${row.spend}, impressions=${row.impressions}, clicks=${row.clicks}`)
      return row
    })

    console.log("[API ads] Returning", rows.length, "ads with total spend:", rows.reduce((sum, r) => sum + r.spend, 0))
    return NextResponse.json({ ads, rows })
  } catch (error: any) {
    console.error("[API ads] Error:", error.message, error.stack)
    return NextResponse.json(
      { error: error.message || "Error obteniendo anuncios", details: error.toString() },
      { status: 500 }
    )
  }
}



