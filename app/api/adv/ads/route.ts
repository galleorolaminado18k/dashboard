import { NextRequest, NextResponse } from "next/server"
import { getRealAds } from "@/lib/adv-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get("campaignId")
  const adsetId = searchParams.get("adsetId")

  if (!campaignId && !adsetId) {
    return NextResponse.json(
      { error: "Se requiere campaignId o adsetId" },
      { status: 400 }
    )
  }

  try {
    // Obtener anuncios reales de la API de Meta
    const entityId = adsetId || campaignId
    if (!entityId) {
      return NextResponse.json(
        { error: "ID de campaña o adset no válido" },
        { status: 400 }
      )
    }

    const ads = await getRealAds(entityId)

    // Mapear los anuncios al formato esperado por la UI
    const rows = ads.map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      status: ad.status,
      delivery: ad.status === "active" ? "Activo" : "Pausado",
      spend: ad.spend || 0,
      impressions: ad.impressions || 0,
      ctr: ad.ctr || 0,
      clicks: ad.clicks || 0,
    }))

    return NextResponse.json({ ads, rows })
  } catch (error: any) {
    console.error("[API ads] Error:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo anuncios" },
      { status: 500 }
    )
  }
}



