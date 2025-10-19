import { NextResponse } from "next/server"
import { createFactura, type Factura } from "@/lib/store"

export async function POST(req: Request) {
  const payload = (await req.json()) as Omit<Factura, "createdAt">
  if (!payload?.numero || !payload?.cliente?.nombre || !payload?.guia || !payload?.transportadora) {
    return NextResponse.json({ ok: false, error: "Campos obligatorios faltantes" }, { status: 400 })
  }
  const data = createFactura(payload)
  return NextResponse.json({ ok: true, data })
}
