import { NextRequest, NextResponse } from "next/server"

// Por ahora retornamos datos de ejemplo, pero puedes conectarlo a la API de Meta
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
    // Aquí conectarías con la API de Meta para obtener anuncios
    // Por ahora retornamos estructura de ejemplo
    const ads = []
    const rows = []

    return NextResponse.json({ ads, rows })
  } catch (error: any) {
    console.error("[API ads] Error:", error)
    return NextResponse.json(
      { error: error.message || "Error obteniendo anuncios" },
      { status: 500 }
    )
  }
}

