import { NextResponse } from "next/server"
import { getTrackingByGuide } from "@/lib/mipaquete"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const guia = searchParams.get("guia") || ""
  if (!guia) {
    return NextResponse.json({ ok: false, error: "Falta parámetro 'guia'." }, { status: 400 })
  }

  try {
    const data = await getTrackingByGuide(guia)
    return NextResponse.json({
      ok: true,
      data,
      publicUrl: `https://mipaquete.com/seguimiento?codigo=${encodeURIComponent(guia)}`,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "No fue posible consultar el tracking.",
        detail: String(err?.message || err),
        publicUrl: `https://mipaquete.com/seguimiento?codigo=${encodeURIComponent(guia)}`,
      },
      { status: 404 },
    )
  }
}
