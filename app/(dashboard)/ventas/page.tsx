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

const GOLD = "rgba(216,189,128,.3)"
const goldBtn = "border-[rgba(216,189,128,.6)] hover:bg-[rgba(216,189,128,.08)]"

function BadgeEstado({ estado, metodo }: { estado: EstadoPago; metodo: MetodoPago }) {
  const map: Record<EstadoPago, string> = {
    Pagado: "bg-emerald-100 text-emerald-900",
    "Pendiente Pago": "bg-amber-100 text-amber-900",
  }
  const label = estado === "Pagado" ? "Pagado" : "Pendiente"
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${map[estado]}`}>{label}</span>
}

export default function VentasPage() {
  const { data, mutate, isLoading } = useSWR<{ ok: boolean; data: Venta[] }>("/api/ventas/list", fetcher)
  const ventas = data?.data ?? []

  // Estado para modal de evidencia
  const [evidenciaModal, setEvidenciaModal] = useState<{ url: string; venta: Venta } | null>(null)

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
    const url = URL.createObjectURL(file)
    await fetch("/api/ventas/evidencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ventaId: ventaParaEvid.id, evidenciaUrl: url }),
    })
    await mutate()
    setVentaParaEvid(null)
  }

  function verEvidencia(v: Venta) {
    if (v.evidenciaUrl) {
      setEvidenciaModal({ url: v.evidenciaUrl, venta: v })
    } else {
      alert("Sin evidencia cargada aún.")
    }
  }

  function verFactura(v: Venta) {
    if (!v.factura) return alert("Sin factura.")
    window.open(`/facturacion/${v.factura}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C]">
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

      <section className="px-6 lg:px-10 mt-4 pb-14">
        <div className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,.05)] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50">
              <tr>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">ID</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">CLIENTE</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">FECHA</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">PRODUCTOS</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">TOTAL</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">ESTADO</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">MÉTODO</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">TRANSP.</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">GUÍA</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">EVIDENCIA</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">VENDEDOR</th>
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">FACTURA</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : ventas).map((v, idx) => (
                <tr key={v.id} className={idx % 2 ? "bg-neutral-50/60" : "bg-white"}>
                  <td className="px-2 py-2 font-medium text-xs">{v.id}</td>
                  <td className="px-2 py-2 text-xs">{v.cliente}</td>
                  <td className="px-2 py-2 text-xs whitespace-nowrap">
                    {new Date(v.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-2 py-2 text-xs max-w-[150px] truncate">{v.producto}</td>
                  <td className="px-2 py-2 tabular-nums text-xs font-semibold">$ {v.total.toLocaleString("es-CO")}</td>
                  <td className="px-2 py-2">
                    <BadgeEstado estado={v.estado} metodo={v.metodo} />
                  </td>
                  <td className="px-2 py-2 text-xs">{v.metodo}</td>
                  <td className="px-2 py-2 text-xs">{v.transportadora}</td>
                  <td className="px-2 py-2 text-xs">{v.guia}</td>

                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => verEvidencia(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-6 px-2 border text-[10px] ${goldBtn}`}
                        title="Ver evidencia"
                      >
                        <Eye className="w-3 h-3" /> Ver
                      </button>
                      <button
                        onClick={() => triggerUpload(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-6 px-2 border text-[10px] ${goldBtn}`}
                        title="Reemplazar evidencia"
                      >
                        <Upload className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="px-2 py-2 text-xs">{v.vendedor}</td>

                  <td className="px-2 py-2">
                    {v.factura ? (
                      <button
                        onClick={() => verFactura(v)}
                        className={`inline-flex items-center gap-1 rounded-full h-6 px-2 border text-[10px] ${goldBtn}`}
                        title="Ver factura"
                      >
                        <FileText className="w-3 h-3" /> Ver
                      </button>
                    ) : (
                      <span className="text-neutral-400 text-[10px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 text-xs text-neutral-500">
            <span>Mostrando {ventas.length} ventas</span>
            <div className="inline-flex gap-2">
              <button className={`rounded-full h-7 px-3 text-xs border ${goldBtn}`}>Anterior</button>
              <button className={`rounded-full h-7 px-3 text-xs border ${goldBtn}`}>Siguiente</button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Evidencia */}
      {evidenciaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setEvidenciaModal(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h3 className="text-lg font-semibold">Evidencia Fotográfica</h3>
                <p className="text-sm text-neutral-500">
                  {evidenciaModal.venta.cliente} - {evidenciaModal.venta.id}
                </p>
              </div>
              <button
                onClick={() => setEvidenciaModal(null)}
                className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
                title="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img
                src={evidenciaModal.url}
                alt="Evidencia"
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
              <button
                onClick={() => window.open(evidenciaModal.url, "_blank")}
                className={`rounded-full h-9 px-4 border ${goldBtn}`}
              >
                Abrir en nueva pestaña
              </button>
              <button
                onClick={() => setEvidenciaModal(null)}
                className={`rounded-full h-9 px-4 border ${goldBtn}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" hidden onChange={onPickFile} />
    </div>
  )
}

