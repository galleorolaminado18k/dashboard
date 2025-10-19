"use client"
import type React from "react"
import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Eye, Upload, FileText } from "lucide-react"

type MetodoPago = "Efectivo" | "Transferencia" | "Contraentrega"
type EstadoPago = "Pagado" | "Pendiente Pago"

type Venta = {
  id: string
  cliente: string
  fecha: string
  producto: string
  total: number
  estado: EstadoPago
  metodo: MetodoPago
  transportadora: string
  guia: string
  evidenciaUrl?: string
  vendedor: string
  factura?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const GOLD = "rgba(216,189,128,.3)" // Cambiado de 45% a 30% para gradiente más sutil
const goldBtn = "border-[rgba(216,189,128,.6)] hover:bg-[rgba(216,189,128,.08)]"

function BadgeEstado({ estado, metodo }: { estado: EstadoPago; metodo: MetodoPago }) {
  const map: Record<EstadoPago, string> = {
    Pagado: "bg-emerald-100 text-emerald-900",
    "Pendiente Pago": "bg-amber-100 text-amber-900",
  }
  const label = `${metodo} ${estado}`
  return <span className={`px-3 py-1 rounded-full text-xs ${map[estado]}`}>{label}</span>
}

export default function VentasPage() {
  const { data, mutate, isLoading } = useSWR<{ ok: boolean; data: Venta[] }>("/api/ventas/list", fetcher)
  const ventas = data?.data ?? []

  // KPIs
  const resumen = useMemo(() => {
    const total = ventas.reduce((s, v) => s + v.total, 0)
    const tTransfer = ventas.filter((v) => v.metodo === "Transferencia").reduce((s, v) => s + v.total, 0)
    const tEfectivo = ventas.filter((v) => v.metodo === "Efectivo").reduce((s, v) => s + v.total, 0)
    const devols = 0
    const ticket = ventas.length ? Math.round(total / ventas.length) : 0
    const pagadoMipaquete = 0
    const pendienteMipaquete = 0
    return { total, tTransfer, tEfectivo, devols, ticket, pagadoMipaquete, pendienteMipaquete }
  }, [ventas])

  // Reemplazar evidencia
  const fileRef = useRef<HTMLInputElement>(null)
  const [ventaParaEvid, setVentaParaEvid] = useState<Venta | null>(null)
  function triggerUpload(v: Venta) {
    setVentaParaEvid(v)
    fileRef.current?.click()
  }
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ventaParaEvid) return
    // Solo simulación: usamos un ObjectURL como "evidencia"
    const url = URL.createObjectURL(file)
    await fetch("/api/ventas/evidencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ventaId: ventaParaEvid.id, evidenciaUrl: url }),
    })
    await mutate()
    setVentaParaEvid(null)
  }

  // Ver evidencia (abre en nueva pestaña)
  function verEvidencia(v: Venta) {
    if (v.evidenciaUrl) window.open(v.evidenciaUrl, "_blank")
    else alert("Sin evidencia cargada aún.")
  }

  // Ver factura (enlaza a /facturacion/[factura])
  function verFactura(v: Venta) {
    if (!v.factura) return alert("Sin factura.")
    window.open(`/facturacion/${v.factura}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C]">
      {/* Header */}
      <section className="px-6 lg:px-10 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[40px] font-semibold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111] via-[#111] to-[rgba(216,189,128,0.9)]">
                Ventas
              </span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">Gestiona y visualiza todas las ventas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => mutate()} className={`rounded-full h-9 px-4 border ${goldBtn}`}>
              Actualizar
            </button>
            <button className={`rounded-full h-9 px-4 border ${goldBtn}`}>Exportar CSV</button>
            <button className={`rounded-full h-9 px-4 border ${goldBtn}`}>Exportar Excel</button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="px-6 lg:px-10 mt-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
        {[
          { label: "VENTA TOTAL", value: `$ ${resumen.total.toLocaleString("es-CO")}` },
          { label: "TRANSFERENCIA", value: `$ ${resumen.tTransfer.toLocaleString("es-CO")}` },
          { label: "EFECTIVO", value: `$ ${resumen.tEfectivo.toLocaleString("es-CO")}` },
          { label: "DEVOLUCIONES", value: `$ ${resumen.devols.toLocaleString("es-CO")}` },
          { label: "TICKET PROMEDIO", value: `$ ${resumen.ticket.toLocaleString("es-CO")}` },
          { label: "PAGADO MIPAQUETE", value: `$ ${resumen.pagadoMipaquete.toLocaleString("es-CO")}` },
          { label: "PENDIENTE MIPAQUETE", value: `$ ${resumen.pendienteMipaquete.toLocaleString("es-CO")}` },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,.06)] p-4"
            style={{
              backgroundImage: `linear-gradient(to bottom, #fff, ${GOLD}, #fff)`,
              backgroundSize: "100% 600%",
              backgroundPosition: "50% 100%",
            }}
          >
            <div className="text-xs text-neutral-500">{k.label}</div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filtros */}
      <section className="px-6 lg:px-10 mt-6">
        <div className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,.05)] p-3 flex items-center gap-3">
          <div className="flex-1">
            <input
              className="w-full h-10 rounded-full px-4 border border-neutral-200 outline-none"
              placeholder="Buscar por nombre, factura o fecha (ej: octubre, oct, 15/oct)…"
            />
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className="px-6 lg:px-10 mt-4 pb-14">
        <div className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,.05)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">CLIENTE</th>
                <th className="text-left px-4 py-3">FECHA</th>
                <th className="text-left px-4 py-3">PRODUCTOS</th>
                <th className="text-left px-4 py-3">TOTAL</th>
                <th className="text-left px-4 py-3">ESTADO</th>
                <th className="text-left px-4 py-3">MÉTODO PAGO</th>
                <th className="text-left px-4 py-3">TRANSPORTADORA</th>
                <th className="text-left px-4 py-3">GUÍA</th>
                <th className="text-left px-4 py-3">EVIDENCIA</th>
                <th className="text-left px-4 py-3">VENDEDOR</th>
                <th className="text-left px-4 py-3">FACTURA</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : ventas).map((v, idx) => (
                <tr key={v.id} className={idx % 2 ? "bg-neutral-50/60" : "bg-white"}>
                  <td className="px-4 py-3 font-medium">{v.id}</td>
                  <td className="px-4 py-3">{v.cliente}</td>
                  <td className="px-4 py-3">
                    {new Date(v.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">{v.producto}</td>
                  <td className="px-4 py-3 tabular-nums">$ {v.total.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-3">
                    <BadgeEstado estado={v.estado} metodo={v.metodo} />
                  </td>
                  <td className="px-4 py-3">{v.metodo}</td>
                  <td className="px-4 py-3">{v.transportadora}</td>
                  <td className="px-4 py-3">{v.guia}</td>

                  {/* EVIDENCIA: Ver / Reemplazar */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => verEvidencia(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-8 px-3 border ${goldBtn}`}
                        title="Ver evidencia"
                      >
                        <Eye className="w-4 h-4" /> Ver
                      </button>
                      <button
                        onClick={() => triggerUpload(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-8 px-3 border ${goldBtn}`}
                        title="Reemplazar evidencia"
                      >
                        <Upload className="w-4 h-4" /> Reemplazar
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3">{v.vendedor}</td>

                  {/* FACTURA: Ver */}
                  <td className="px-4 py-3">
                    {v.factura ? (
                      <button
                        onClick={() => verFactura(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-8 px-3 border ${goldBtn}`}
                        title="Ver factura"
                      >
                        <FileText className="w-4 h-4" /> Ver {v.factura}
                      </button>
                    ) : (
                      <span className="text-neutral-400">Sin factura</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100 text-sm text-neutral-500">
            <span>Mostrando {ventas.length} ventas</span>
            <div className="inline-flex gap-2">
              <button className={`rounded-full h-8 px-3 border ${goldBtn}`}>Anterior</button>
              <button className={`rounded-full h-8 px-3 border ${goldBtn}`}>Siguiente</button>
            </div>
          </div>
        </div>
      </section>

      {/* input oculto para reemplazar evidencia */}
      <input ref={fileRef} type="file" hidden onChange={onPickFile} />
    </div>
  )
}
