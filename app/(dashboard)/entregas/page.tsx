"use client"
import type React from "react"
import { useMemo, useState } from "react"
import axios from "axios"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, CheckCircle2, Clock3, AlertTriangle, PackageSearch, MapPin, RotateCcw, Route } from "lucide-react"
import TrackingDialog from "./components/TrackingDialog"

/* =========================================================
   MiPaquete — Tracking (mueve estos secretos a backend si puedes)
   ========================================================= */
const MIPAQUETE_TRACKING_URL = "https://api.mipaquete.com/v2/tracking"
const SESSION_TRACKER = "a0c96ea6-b22d-4fb7-a278-850678d5429c"
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzExOWRjNDMzNjk2M2YzMzBlYjFjZTYiLCJuYW1lIjoiQ29tZXJjaWFsaXphZG9yYSIsInN1cm5hbWUiOiJnYWxlMThrIiwiZW1haWwiOiJnYWxsZW9yb2xhbWluYWRvMThrQGdtYWlsLmNvbSIsImNlbGxQaG9uZSI6IjMwMTY4NDUwMjYiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTE3VDIzOjI5OjA4LjAxNFoiLCJkYXRlIjoiMjAyNS0wOC0xOSAxMDoyMDoyNCIsImlhdCI6MTc1NTYxNjgyNH0.LHBLIsBCQlNM6WlnB514dN00dR7LcPjIQcYt1B62hEA"

const mipaquete = axios.create({
  baseURL: MIPAQUETE_TRACKING_URL,
  headers: {
    "Content-Type": "application/json",
    "session-tracker": SESSION_TRACKER,
    apikey: API_KEY,
  },
})

async function getTracking(code: string) {
  try {
    const r = await mipaquete.get(`/${encodeURIComponent(code)}`)
    return r.data
  } catch {
    const r = await mipaquete.get("", { params: { code } })
    return r.data
  }
}

/* =========================================================
   UI — Luxury Clean con 30% de dorado
   ========================================================= */
const GOLD = "#D8BD80" // champagne
const GLASS = "bg-white/95 backdrop-blur-md"

/** KPIs con elevación suave y dorado al 45% + relleno luxury */
function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="group rounded-[24px] p-[1px] bg-gradient-to-b from-white via-[#D8BD80]/45 to-white">
      <div
        className={`rounded-[23px] ${GLASS} border border-white/70
        border-l-4 border-l-[#D8BD80]
        shadow-[0_12px_36px_rgba(0,0,0,.06)]
        transition-all duration-300 ease-out
        group-hover:-translate-y-[2px] group-hover:shadow-[0_18px_48px_rgba(0,0,0,.10)]`}
      >
        {children}
      </div>
    </div>
  )
}

/** Filtros y tabla: FIJOS (sin elevación) */
function FixedCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] p-[1px] bg-gradient-to-b from-white via-[#D8BD80]/45 to-white">
      <div className={`rounded-[23px] ${GLASS} border border-white/70 shadow-[0_10px_28px_rgba(0,0,0,.05)]`}>
        {children}
      </div>
    </div>
  )
}

type Estado = "En tránsito" | "Despachado" | "Entregado" | "Retrasado" | "Devolución"

type Shipment = {
  envioId: string
  pedidoId: string
  factura?: string
  cliente: string
  ciudad: string
  transportadora: string
  guia: string
  estado: Estado
  progreso: number
  despacho: string
  eta: string // fecha aprox. de entrega
  lastUpdate: string
}

function EstadoBadge({ estado }: { estado: Estado }) {
  const map: Record<Estado, string> = {
    "En tránsito": "bg-blue-100 text-blue-900",
    Despachado: "bg-neutral-100 text-neutral-900",
    Entregado: "bg-emerald-100 text-emerald-900",
    Retrasado: "bg-amber-100 text-amber-900",
    Devolución: "bg-rose-100 text-rose-900",
  }
  return <Badge className={`rounded-full border-0 ${map[estado]}`}>{estado}</Badge>
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-neutral-200/80 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${GOLD}, rgba(184,167,116,.8))`,
        }}
      />
    </div>
  )
}

/* =========================================================
   MOCK DATA
   ========================================================= */
const MOCK_SHIPMENTS: Shipment[] = [
  {
    envioId: "ENV-2025-021",
    pedidoId: "ORD-2025-10-001",
    factura: "FAC-2025-0002",
    cliente: "Carlos Rodríguez",
    ciudad: "Bogotá",
    transportadora: "COORDINADORA",
    guia: "58048077984",
    estado: "En tránsito",
    progreso: 70,
    despacho: "2025-10-07",
    eta: "2025-10-09",
    lastUpdate: "hace 2 h",
  },
  {
    envioId: "ENV-2025-022",
    pedidoId: "ORD-2025-10-002",
    factura: "FAC-2025-0001",
    cliente: "María González",
    ciudad: "Medellín",
    transportadora: "SERVIENTREGA",
    guia: "1714815",
    estado: "Despachado",
    progreso: 35,
    despacho: "2025-10-07",
    eta: "2025-10-10",
    lastUpdate: "hace 4 h",
  },
  {
    envioId: "ENV-2025-023",
    pedidoId: "ORD-2025-10-003",
    cliente: "Ana Martínez",
    ciudad: "Cali",
    transportadora: "ENVIA",
    guia: "1714829",
    estado: "Retrasado",
    progreso: 55,
    despacho: "2025-10-05",
    eta: "2025-10-08",
    lastUpdate: "hace 1 h",
  },
  {
    envioId: "ENV-2025-024",
    pedidoId: "ORD-2025-10-004",
    cliente: "Luis Hernández",
    ciudad: "Barranquilla",
    transportadora: "SERVIENTREGA",
    guia: "1714821",
    estado: "Entregado",
    progreso: 100,
    despacho: "2025-10-04",
    eta: "2025-10-06",
    lastUpdate: "hace 1 d",
  },
]

/* =========================================================
   PAGE
   ========================================================= */
export default function EntregasPage() {
  const [busqueda, setBusqueda] = useState("")
  const [estadoSel, setEstadoSel] = useState<string>("TODOS")
  const [transSel, setTransSel] = useState<string>("TODAS")
  const [trace, setTrace] = useState({ open: false, guia: "" })

  const resumen = useMemo(
    () => ({
      enCurso: 18,
      entregados: 126,
      retrasos: 3,
      promDias: 2.8,
      aTiempoPct: 92,
      devoluciones: 1,
    }),
    [],
  )

  const enviosFiltrados = useMemo(() => {
    return MOCK_SHIPMENTS.filter((e) => {
      const q = e.envioId + e.pedidoId + (e.factura ?? "") + e.cliente + e.ciudad + e.transportadora + e.guia
      const okSearch = q.toLowerCase().includes(busqueda.toLowerCase())
      const okEstado = estadoSel === "TODOS" ? true : e.estado.toLowerCase().includes(estadoSel.toLowerCase())
      const okTrans = transSel === "TODAS" ? true : e.transportadora.toLowerCase().includes(transSel.toLowerCase())
      return okSearch && okEstado && okTrans
    })
  }, [busqueda, estadoSel, transSel])

  return (
    <div className="min-h-screen bg-white text-[#0B0B0C]">
      {/* Header */}
      <section className="px-6 lg:px-10 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111] via-[#111] to-[rgba(216,189,128,0.8)]">
                ENTREGAS
              </span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">SEGUIMIENTO DE ENVIOS</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-neutral-200 bg-transparent">
              Exportar CSV
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="px-6 lg:px-10 mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6">
        {[
          {
            icon: <Truck className="w-4 h-4" />,
            label: "En curso",
            value: resumen.enCurso,
            sub: "En tránsito / despachados",
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: "Entregados",
            value: resumen.entregados,
            sub: "Acumulado del mes",
          },
          {
            icon: <AlertTriangle className="w-4 h-4" />,
            label: "Retrasos",
            value: resumen.retrasos,
            sub: "Atención inmediata",
          },
          {
            icon: <Clock3 className="w-4 h-4" />,
            label: "Promedio de entrega",
            value: `${resumen.promDias} d`,
            sub: "De despacho a entrega",
          },
          {
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: "A tiempo",
            value: `${resumen.aTiempoPct}%`,
            sub: "Entregas dentro del ETA",
          },
          {
            icon: <RotateCcw className="w-4 h-4" />,
            label: "Devoluciones",
            value: resumen.devoluciones,
            sub: "Este mes",
          },
        ].map((k, i) => (
          <GradientCard key={i}>
            <div className="p-6">
              <div className="text-sm text-neutral-500 flex items-center gap-2">
                {k.icon} {k.label}
              </div>
              <div className="mt-2 text-4xl font-semibold">{k.value}</div>
              <p className="text-xs text-neutral-500 mt-1">{k.sub}</p>
            </div>
          </GradientCard>
        ))}
      </section>

      {/* Filtros — FIJO */}
      <section className="px-6 lg:px-10 mt-8">
        <FixedCard>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-2 md:col-span-2">
              <PackageSearch className="w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por cliente, ciudad, guía o pedido…"
                className="rounded-full"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select onValueChange={setEstadoSel}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="DESPACHADO">Despachado</SelectItem>
                <SelectItem value="TRÁNSITO">En tránsito</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="RETRASADO">Retrasado</SelectItem>
                <SelectItem value="DEVOLUCIÓN">Devolución</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setTransSel}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Transportadora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="SERVIENTREGA">SERVIENTREGA</SelectItem>
                <SelectItem value="INTERRAPIDISIMO">INTERRAPIDISIMO</SelectItem>
                <SelectItem value="ENVIA">ENVIA</SelectItem>
                <SelectItem value="COORDINADORA">COORDINADORA</SelectItem>
                <SelectItem value="TCC">TCC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FixedCard>
      </section>

      {/* Tabla — FIJA */}
      <section className="px-6 lg:px-10 mt-6 pb-14">
        <FixedCard>
          <div className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-center px-4 py-3">Envío</th>
                  <th className="text-center px-4 py-3">Pedido / Factura</th>
                  <th className="text-center px-4 py-3">Cliente</th>
                  <th className="text-center px-4 py-3">Ciudad</th>
                  <th className="text-center px-4 py-3">Transportadora</th>
                  <th className="text-center px-4 py-3">Guía</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Progreso</th>
                  <th className="text-center px-4 py-3">Despacho</th>
                  <th className="text-center px-4 py-3">Fecha aproximada de entrega</th>
                  <th className="text-center px-4 py-3">Última actualización</th>
                  <th className="text-center px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {enviosFiltrados.map((e, idx) => (
                  <tr key={e.envioId} className={idx % 2 ? "bg-neutral-50/50" : "bg-white"}>
                    <td className="px-4 py-3 font-medium text-center">{e.envioId}</td>
                    <td className="px-4 py-3 text-neutral-600 text-center">
                      {e.pedidoId}
                      {e.factura ? ` • ${e.factura}` : ""}
                    </td>
                    <td className="px-4 py-3 text-center">{e.cliente}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <MapPin className="w-3 h-3" /> {e.ciudad}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{e.transportadora}</td>
                    <td className="px-4 py-3 tabular-nums text-center">{e.guia}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <EstadoBadge estado={e.estado} />
                      </div>
                    </td>
                    <td className="px-4 py-3 w-[160px]">
                      <ProgressBar value={e.progreso} />
                    </td>
                    <td className="px-4 py-3 text-center">{e.despacho}</td>
                    <td className="px-4 py-3 text-center">{e.eta}</td>
                    <td className="px-4 py-3 text-neutral-500 text-center">{e.lastUpdate}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => setTrace({ open: true, guia: e.guia })}
                          className="inline-flex items-center gap-2 rounded-full px-4 h-9
                          border border-[rgba(216,189,128,.6)] text-[#0B0B0C]
                          bg-white hover:bg-[rgba(216,189,128,.08)]
                          shadow-[0_2px_10px_rgba(0,0,0,.04)] transition"
                          title="Ver tracking"
                        >
                          <Route className="w-4 h-4" />
                          Ver tracking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer paginación (demo) */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100 text-sm text-neutral-500">
              <span>Mostrando {enviosFiltrados.length} envíos</span>
              <div className="inline-flex items-center gap-2">
                <Button variant="outline" className="rounded-full h-8 px-3 bg-transparent">
                  Anterior
                </Button>
                <Button variant="outline" className="rounded-full h-8 px-3 bg-transparent">
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </FixedCard>
      </section>

      {/* Modal de Tracking — muestra timeline si la API trae eventos; si no, JSON */}
      {trace.open && (
        <TrackingDialog guia={trace.guia} open={trace.open} onClose={() => setTrace({ open: false, guia: "" })} />
      )}
    </div>
  )
}
