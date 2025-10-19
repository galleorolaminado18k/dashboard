import { NextResponse } from "next/server"
import { applyFacturaUpdate } from "@/lib/ventasStore"

export async function POST(req: Request) {
  const body = await req.json()
  const { factura, estadoPago, metodo, evidenciaUrl } = body || {}
  if (!factura || !estadoPago) {
    return NextResponse.json({ ok: false, error: "factura y estadoPago son requeridos" }, { status: 400 })
  }
  const data = applyFacturaUpdate({ factura, estadoPago, metodo, evidenciaUrl })
  return NextResponse.json({ ok: true, data })
}
