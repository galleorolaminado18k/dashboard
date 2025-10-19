import { NextResponse } from "next/server"
import { marcarVentaDevueltaPorFactura, updateEnvioPorGuia, updateFacturaEstado } from "@/lib/store"

export async function POST(req: Request) {
  const body = await req.json()
  const type = String(body?.type ?? "").toLowerCase()
  const guia = String(body?.guide ?? "")
  const invoice = String(body?.invoice ?? "")

  switch (type) {
    case "payment_confirmed":
      updateFacturaEstado(invoice, "Pagado", body?.method ?? "Contraentrega")
      break
    case "return_completed":
      marcarVentaDevueltaPorFactura(invoice, body?.reason)
      break
    case "in_transit":
      updateEnvioPorGuia(guia, "En tránsito")
      break
    case "delivered":
      updateEnvioPorGuia(guia, "Entregado")
      break
    case "returned":
      updateEnvioPorGuia(guia, "Devuelto")
      break
    case "delayed":
      updateEnvioPorGuia(guia, "Retrasado")
      break
    default:
      break
  }
  return NextResponse.json({ ok: true })
}
