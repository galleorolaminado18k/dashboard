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

  // Estado para modal de factura
  const [facturaModal, setFacturaModal] = useState<{ numero: string; venta: Venta } | null>(null)

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
  const [showCodeDialog, setShowCodeDialog] = useState(false)
  const [securityCode, setSecurityCode] = useState("")

  function triggerUpload(v: Venta) {
    setVentaParaEvid(v)
    setShowCodeDialog(true)
  }

  function validateCodeAndUpload() {
    const { validateSecurityCode } = require("@/lib/security-codes")

    if (validateSecurityCode("replaceEvidence", securityCode)) {
      setShowCodeDialog(false)
      setSecurityCode("")
      fileRef.current?.click()
    } else {
      alert("❌ Código de seguridad incorrecto")
      setSecurityCode("")
    }
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
    setFacturaModal({ numero: v.factura, venta: v })
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

      <section className="px-6 lg:px-10 mt-6 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {[
          { label: "VENTA TOTAL", value: resumen.total },
          { label: "TRANSFERENCIA", value: resumen.tTransfer },
          { label: "EFECTIVO", value: resumen.tEfectivo },
          { label: "DEVOLUCIONES", value: resumen.devols },
          { label: "TICKET PROMEDIO", value: resumen.ticket },
          { label: "PAGADO MIPAQUETE", value: resumen.pagadoMipaquete },
          { label: "PENDIENTE MIPAQUETE", value: resumen.pendienteMipaquete },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,.06)] p-3"
            style={{
              backgroundImage: `linear-gradient(to bottom, #fff, ${GOLD}, #fff)`,
              backgroundSize: "100% 600%",
              backgroundPosition: "50% 100%",
            }}
          >
            <div className="text-[9px] text-neutral-500 font-medium uppercase tracking-wide">{k.label}</div>
            <div className="mt-1.5 flex items-baseline gap-0.5">
              <span className="text-xs font-semibold text-neutral-600">$</span>
              <span className="text-lg font-bold">{k.value.toLocaleString("es-CO")}</span>
            </div>
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
                <th className="text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wider">FECHA DE VENTA</th>
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
                  <td className="px-2 py-2 text-xs font-semibold whitespace-nowrap">
                    <span className="inline-flex items-baseline gap-0.5">
                      <span className="text-[10px] text-neutral-500">$</span>
                      <span className="tabular-nums">{v.total.toLocaleString("es-CO")}</span>
                    </span>
                  </td>
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

      {/* Modal de Código de Seguridad */}
      {showCodeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowCodeDialog(false)
            setSecurityCode("")
            setVentaParaEvid(null)
          }}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Código de Seguridad</h3>
              <button
                onClick={() => {
                  setShowCodeDialog(false)
                  setSecurityCode("")
                  setVentaParaEvid(null)
                }}
                className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              Para reemplazar evidencia, ingresa el código de seguridad configurado
            </p>
            <input
              type="password"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  validateCodeAndUpload()
                }
              }}
              className="w-full h-12 rounded-lg border border-neutral-200 px-4 outline-none focus:border-[rgba(216,189,128,.6)] focus:ring-1 focus:ring-[rgba(216,189,128,.3)]"
              placeholder="Código de seguridad"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCodeDialog(false)
                  setSecurityCode("")
                  setVentaParaEvid(null)
                }}
                className={`flex-1 rounded-full h-10 px-4 border ${goldBtn}`}
              >
                Cancelar
              </button>
              <button
                onClick={validateCodeAndUpload}
                className="flex-1 rounded-full h-10 px-4 bg-[rgba(216,189,128,.9)] hover:bg-[rgba(216,189,128,1)] text-white font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Factura */}
      {facturaModal && <FacturaModal facturaNumero={facturaModal.numero} venta={facturaModal.venta} onClose={() => setFacturaModal(null)} />}

      <input ref={fileRef} type="file" hidden onChange={onPickFile} />
    </div>
  )
}

// Componente para mostrar la factura en modal
function FacturaModal({ facturaNumero, venta, onClose }: { facturaNumero: string; venta: Venta; onClose: () => void }) {
  const { data } = useSWR<{ ok: boolean; facturas: any[] }>("/api/facturacion/list", fetcher)
  const fac = data?.facturas?.find((f) => f.numero === facturaNumero)

  if (!fac) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm">Cargando factura...</p>
        </div>
      </div>
    )
  }

  const GOLD = "rgba(216,189,128,.3)"
  const goldBtn = "border-[rgba(216,189,128,.6)] hover:bg-[rgba(216,189,128,.08)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Factura {facturaNumero}</h3>
            <p className="text-sm text-neutral-500">
              {venta.cliente} - {venta.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
            title="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido de la factura */}
        <div className="flex-1 overflow-y-auto p-8 bg-neutral-50">
          <div className="max-w-[600px] mx-auto bg-white rounded-xl shadow-lg p-8 text-sm">
            {/* Encabezado empresa */}
            <div className="text-center border-b-2 border-dashed border-neutral-300 pb-4 mb-4">
              <div className="text-2xl font-bold text-[rgba(216,189,128,1)]">GALLE</div>
              <div className="text-xs mt-1">COMERCIALIZADORA GALLE18K</div>
              <div className="text-xs">ORO LAMINADO Y ACCESORIOS SAS</div>
              <div className="text-xs mt-1">NIT: 900.123.456-7</div>
              <div className="text-xs">Tel: +57 300 123 4567</div>
            </div>

            {/* Información de la factura */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div>
                <div className="font-semibold">FACTURA:</div>
                <div>{fac.numero}</div>
              </div>
              <div>
                <div className="font-semibold">FECHA:</div>
                <div>{fac.emision}</div>
              </div>
              <div>
                <div className="font-semibold">MÉTODO:</div>
                <div>{fac.metodo}</div>
              </div>
              <div>
                <div className="font-semibold">ESTADO:</div>
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      fac.estado === "Pagado"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {fac.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 mb-4">
              <div className="font-semibold text-xs mb-2">DATOS DEL CLIENTE</div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-semibold">Nombre:</span> {fac.cliente.nombre}
                </div>
                {fac.cliente.nit && (
                  <div>
                    <span className="font-semibold">NIT:</span> {fac.cliente.nit}
                  </div>
                )}
                {fac.cliente.ciudad && (
                  <div>
                    <span className="font-semibold">Ciudad:</span> {fac.cliente.ciudad}
                  </div>
                )}
                {fac.cliente.telefono && (
                  <div>
                    <span className="font-semibold">Teléfono:</span> {fac.cliente.telefono}
                  </div>
                )}
                {fac.cliente.direccion && (
                  <div>
                    <span className="font-semibold">Dirección:</span> {fac.cliente.direccion}
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 mb-4">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="text-left py-1.5 text-[9px] font-semibold">SKU</th>
                    <th className="text-left py-1.5 text-[9px] font-semibold">DESCRIPCIÓN</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold">CANT</th>
                    <th className="text-center py-1.5 text-[9px] font-semibold">IVA</th>
                    <th className="text-right py-1.5 text-[9px] font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {fac.items.map((it: any, i: number) => (
                    <tr key={i} className="border-b border-neutral-200">
                      <td className="py-1.5 text-[10px] text-gray-600">{it.ref || '-'}</td>
                      <td className="py-1.5 text-[10px]">{it.descripcion}</td>
                      <td className="text-center py-1.5 text-[10px]">{it.und}</td>
                      <td className="text-center py-1.5 text-[10px]">{it.ivaPct}%</td>
                      <td className="text-right py-1.5 text-[10px] font-semibold">
                        $ {it.precioNeto.toLocaleString("es-CO")}
                      </td>
                    </tr>
                  ))}
                  {/* Fila de envío - SIEMPRE SE MUESTRA */}
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <td className="py-1.5 text-[10px]">-</td>
                    <td className="py-1.5 text-[10px] font-semibold">COSTO DE ENVÍO</td>
                    <td className="text-center py-1.5 text-[10px]">1</td>
                    <td className="text-center py-1.5 text-[10px]">0%</td>
                    <td className="text-right py-1.5 text-[10px] font-semibold">
                      $ {(fac.costo_envio || 0).toLocaleString("es-CO")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 space-y-2 text-xs">
              {(() => {
                // Calcular totales correctamente
                // Los productos ya incluyen IVA, entonces:
                const totalProductosConIVA = fac.items.reduce((sum: number, it: any) => sum + it.precioNeto, 0)
                const subtotalProductos = totalProductosConIVA / 1.19 // Subtotal sin IVA
                const ivaProductos = totalProductosConIVA - subtotalProductos // IVA de los productos
                const costoEnvio = fac.costo_envio || 0 // Envío sin IVA
                const subtotalFinal = subtotalProductos + costoEnvio // Subtotal + Envío (sin IVA)
                const totalFinal = totalProductosConIVA + costoEnvio // Total con IVA + Envío

                return (
                  <>
                    <div className="flex justify-between">
                      <span>SUBTOTAL PRODUCTOS (sin IVA):</span>
                      <span className="font-semibold">$ {Math.round(subtotalProductos).toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">$ {Math.round(ivaProductos).toLocaleString("es-CO")}</span>
                    </div>
                    {costoEnvio > 0 && (
                      <div className="flex justify-between">
                        <span>COSTO ENVÍO:</span>
                        <span className="font-semibold">$ {costoEnvio.toLocaleString("es-CO")}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-neutral-300 pt-2">
                      <span>SUBTOTAL FINAL:</span>
                      <span className="font-semibold">$ {Math.round(subtotalFinal).toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t-2 border-neutral-300 pt-2 mt-2">
                      <span>TOTAL A PAGAR:</span>
                      <span>$ {Math.round(totalFinal).toLocaleString("es-CO")}</span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Pie */}
            <div className="text-center mt-6 text-xs text-neutral-600 border-t-2 border-dashed border-neutral-300 pt-4">
              ¡Gracias por su compra!
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 shrink-0">
          <button
            onClick={() => window.open(`/facturacion/${facturaNumero}/pos`, "_blank")}
            className={`rounded-full h-9 px-4 border ${goldBtn}`}
          >
            Imprimir
          </button>
          <button onClick={onClose} className={`rounded-full h-9 px-4 border ${goldBtn}`}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

