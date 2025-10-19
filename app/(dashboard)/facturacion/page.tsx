"use client"
import useSWR from "swr"
import { useState } from "react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())
const GOLD = "rgba(216,189,128,.3)"

export default function FacturacionPage() {
  const { data, mutate } = useSWR<{
    ok: boolean
    facturas: any[]
    devoluciones: any[]
  }>("/api/facturacion/list", fetcher)
  const facturas = data?.facturas ?? []
  const [sending, setSending] = useState(false)

  async function crearDemo() {
    setSending(true)
    await fetch("/api/facturacion/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numero: `FAC-2025-${String(facturas.length + 1).padStart(4, "0")}`,
        cliente: {
          nombre: "Patricia Silva",
          ciudad: "Cali",
          telefono: "3001234567",
          email: "patricia@demo.com",
        },
        guia: "1715000",
        transportadora: "Servientrega",
        emision: new Date().toISOString().slice(0, 10),
        vencimiento: new Date().toISOString().slice(0, 10),
        subtotal: 320000,
        iva: 60800,
        total: 380800,
        estado: "Pendiente Pago",
        metodo: "Contraentrega",
        items: [
          {
            ref: "1",
            descripcion: "Vestido Midi Floral",
            und: 1,
            ivaPct: 19,
            precioBase: 320000,
            precioNeto: 380800,
          },
        ],
      }),
    })
    await mutate()
    setSending(false)
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">
          <span className="bg-gradient-to-r from-[#111] via-[#111] to-[rgba(216,189,128,0.9)] bg-clip-text text-transparent">
            Facturación
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => mutate()}
            className="rounded-full h-9 px-4 border border-[#D8BD80]/30 hover:border-[#D8BD80]/60 transition-colors"
          >
            Actualizar
          </button>
          <button
            onClick={crearDemo}
            disabled={sending}
            className="rounded-full h-9 px-4 border border-[#D8BD80]/30 hover:border-[#D8BD80]/60 transition-colors disabled:opacity-50"
          >
            Nueva Factura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {["TOTAL FACTURAS", "AGOSTO 2025", "SEPTIEMBRE 2025", "OCTUBRE 2025"].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,.06)] p-4 border-l-4 border-l-[#D8BD80]"
            style={{
              backgroundImage: `linear-gradient(to bottom,#fff,${GOLD},#fff)`,
            }}
          >
            <div className="text-xs text-neutral-500">{k}</div>
            <div className="text-2xl font-semibold">$0</div>
            <div className="text-xs text-neutral-400">Facturas generadas</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_10px_28px_rgba(0,0,0,.05)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left">NÚMERO</th>
              <th className="px-4 py-3 text-left">CLIENTE</th>
              <th className="px-4 py-3 text-left">TELÉFONO</th>
              <th className="px-4 py-3 text-left">GUÍA</th>
              <th className="px-4 py-3 text-left">TRANSP.</th>
              <th className="px-4 py-3 text-left">EMISIÓN</th>
              <th className="px-4 py-3 text-left">TOTAL</th>
              <th className="px-4 py-3 text-left">ESTADO</th>
              <th className="px-4 py-3 text-left">MÉTODO</th>
              <th className="px-4 py-3 text-left">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.numero} className="odd:bg-white even:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <a className="underline" href={`/facturacion/${f.numero}/pos`} target="_blank" rel="noreferrer">
                    {f.numero}
                  </a>
                </td>
                <td className="px-4 py-3">{f.cliente?.nombre}</td>
                <td className="px-4 py-3">{f.cliente?.telefono ?? "—"}</td>
                <td className="px-4 py-3">{f.guia}</td>
                <td className="px-4 py-3">{f.transportadora}</td>
                <td className="px-4 py-3">{f.emision}</td>
                <td className="px-4 py-3">$ {f.total.toLocaleString("es-CO")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      f.estado === "Pagado"
                        ? "bg-emerald-100 text-emerald-900"
                        : f.estado === "Devuelto"
                          ? "bg-rose-100 text-rose-900"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {f.estado}
                  </span>
                </td>
                <td className="px-4 py-3">{f.metodo}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await fetch("/api/facturacion/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            factura: f.numero,
                            estado: "Pagado",
                            metodo: f.metodo,
                          }),
                        })
                        mutate()
                      }}
                      className="h-8 px-3 rounded-full border border-[#D8BD80]/30 hover:border-[#D8BD80]/60 transition-colors text-xs"
                    >
                      Marcar pagado
                    </button>

                    <button
                      onClick={async () => {
                        await fetch("/api/facturacion/sync", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            factura: f.numero,
                            estado: "Devuelto",
                            motivo: "Cliente rechazó",
                          }),
                        })
                        mutate()
                      }}
                      className="h-8 px-3 rounded-full border border-[#D8BD80]/30 hover:border-[#D8BD80]/60 transition-colors text-xs"
                    >
                      Devolver
                    </button>

                    <a
                      href={`/facturacion/${f.numero}/pos`}
                      target="_blank"
                      className="h-8 px-3 rounded-full border border-[#D8BD80]/30 hover:border-[#D8BD80]/60 transition-colors grid place-items-center text-xs"
                      rel="noreferrer"
                    >
                      Imprimir POS
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 text-sm text-neutral-500 border-t">Mostrando {facturas.length} facturas</div>
      </div>
    </div>
  )
}
