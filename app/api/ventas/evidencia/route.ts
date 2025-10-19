import { NextResponse } from "next/server"
import { replaceEvidence } from "@/lib/ventasStore"

export async function POST(req: Request) {
  const { ventaId, evidenciaUrl } = await req.json()
  if (!ventaId || !evidenciaUrl) {
    return NextResponse.json({ ok: false, error: "ventaId y evidenciaUrl son requeridos" }, { status: 400 })
  }
  const updated = replaceEvidence(ventaId, evidenciaUrl)
  return NextResponse.json({ ok: true, data: updated })
}
