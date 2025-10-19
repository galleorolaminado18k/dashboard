import { NextResponse } from "next/server"
import { DB } from "@/lib/store"

export async function GET() {
  const ventas = DB.getVentas()
  const pagos = DB.getPagos()
  const devols = DB.getDevols()
  const clientes = DB.getClientes()

  const ventasMes = ventas.reduce((s, v) => s + v.total, 0)
  const ticketProm = ventas.length ? Math.round(ventasMes / ventas.length) : 0
  const pendientesCE = pagos
    .filter((p) => p.metodo === "Contraentrega" && p.estado === "Pendiente")
    .reduce((s, p) => s + p.monto, 0)
  const distMetodo = pagos.reduce<Record<string, number>>((a, p) => {
    a[p.metodo] = (a[p.metodo] ?? 0) + p.monto
    return a
  }, {})
  const recurrentes = clientes.filter((c) => c.frecuencia >= 2).length

  return NextResponse.json({
    ok: true,
    data: {
      ventasMes,
      ticketPromedio: ticketProm,
      devoluciones: devols.length,
      pendienteMiPaquete: pendientesCE,
      pagosPorMetodo: distMetodo,
      clientesRecurrentes: recurrentes,
    },
  })
}
