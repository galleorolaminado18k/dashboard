// VERSIÓN FORZADA: 2025-11-04 23:00 - COLUMNA ACCIONES LÍNEA 411
"use client"
import type React from "react"
import { useMemo, useState } from "react"
import axios from "axios"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, CheckCircle2, Clock3, AlertTriangle, PackageSearch, MapPin, RotateCcw, Route } from "lucide-react"
import TrackingDialog from "./components/TrackingDialog"
import NovedadModal from "./components/NovedadModal"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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
  mipaqueteStatus?: string // Estado real de MiPaquete
  total?: number // Total de la factura
}

function EstadoBadge({ estado, mipaqueteStatus }: { estado: Estado; mipaqueteStatus?: string }) {
  const map: Record<Estado, string> = {
    "En tránsito": "bg-blue-100 text-blue-900 border border-blue-300",
    Despachado: "bg-neutral-100 text-neutral-900 border border-neutral-300",
    Entregado: "bg-emerald-100 text-emerald-900 border border-emerald-300",
    Retrasado: "bg-red-100 text-red-900 border border-red-300",
    Devolución: "bg-rose-100 text-rose-900 border border-rose-300",
  }

  // Detectar novedad en el estado de MiPaquete
  const hasNovedad = mipaqueteStatus?.toLowerCase().includes('novedad') ||
                     mipaqueteStatus?.toLowerCase().includes('usuario cancela') ||
                     mipaqueteStatus?.toLowerCase().includes('rechazado')

  return (
    <div className="flex flex-col gap-1 items-center">
      <Badge className={`rounded-full ${map[estado]}`}>
        {estado}
      </Badge>
      {hasNovedad && mipaqueteStatus && (
        <div className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          NOVEDAD
        </div>
      )}
      {mipaqueteStatus && !hasNovedad && (
        <div className="text-[9px] text-neutral-500 max-w-[150px] text-center truncate" title={mipaqueteStatus}>
          {mipaqueteStatus}
        </div>
      )}
      {mipaqueteStatus && hasNovedad && (
        <div className="text-[9px] text-red-600 max-w-[150px] text-center truncate font-medium" title={mipaqueteStatus}>
          {mipaqueteStatus}
        </div>
      )}
    </div>
  )
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
   PAGE
   ========================================================= */
export default function EntregasPage() {
  const [busqueda, setBusqueda] = useState("")
  const [estadoSel, setEstadoSel] = useState<string>("TODOS")
  const [transSel, setTransSel] = useState<string>("TODAS")
  const [trace, setTrace] = useState({ open: false, guia: "" })
  const [novedadModal, setNovedadModal] = useState<{ open: boolean; envio: any | null }>({
    open: false,
    envio: null
  })

  // Obtener datos reales del API
  const { data, error, isLoading, mutate } = useSWR('/api/shipments', fetcher, {
    refreshInterval: 30000, // Actualizar cada 30 segundos
  })

  const shipments = data?.shipments || []
  const resumen = data?.resumen || {
    enCurso: 0,
    entregados: 0,
    retrasos: 0,
    promDias: 0,
    aTiempoPct: 0,
    devoluciones: 0,
  }

  const enviosFiltrados = useMemo(() => {
    return shipments.filter((e: Shipment) => {
      const q = e.envioId + e.pedidoId + (e.factura ?? "") + e.cliente + e.ciudad + e.transportadora + e.guia
      const okSearch = q.toLowerCase().includes(busqueda.toLowerCase())
      const okEstado = estadoSel === "TODOS" ? true : e.estado.toLowerCase().includes(estadoSel.toLowerCase())
      const okTrans = transSel === "TODAS" ? true : e.transportadora.toLowerCase().includes(transSel.toLowerCase())
      return okSearch && okEstado && okTrans
    })
  }, [shipments, busqueda, estadoSel, transSel])

  console.log('🔥🔥🔥 ENTREGAS PAGE v3.0-FIXED CARGADO - COLUMNA ACCIONES INCLUIDA 🔥🔥🔥')
  console.log('📊 Número de envíos filtrados:', enviosFiltrados.length)

  return (
    <div className="min-h-screen bg-gradient-radial from-[#0B0B0C] via-[#0F0F10] to-[#111214] text-[#F7F7F8]">
      {/* Header - Luxury Dark */}
      <section className="px-6 lg:px-10 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-serif tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5E6B3] to-[#D4AF37]">
                ENTREGAS
              </span>
              <sup className="text-xs text-[#12B886] ml-2 font-sans">v3.0-FIXED</sup>
            </h1>
            <p className="text-sm text-[#B8BDC7] mt-1 font-medium">SEGUIMIENTO DE ENVIOS • Build 2025-11-04 15:25</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                try {
                  await mutate()
                  const res = await fetch('/api/shipments/force-update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tracking_number: '58048080554' })
                  })
                  const data = await res.json()
                  if (data.ok) {
                    alert('✅ Actualización de envíos exitosa!')
                    await mutate()
                  } else {
                    alert('❌ Error: ' + data.error)
                  }
                } catch (err) {
                  alert('❌ Error al actualizar')
                }
              }}
              disabled={isLoading}
              className="group relative px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5E6B3] hover:from-[#F5E6B3] hover:to-[#D4AF37] text-[#0B0B0C] font-semibold text-sm shadow-xl hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualización de envíos
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white/6 backdrop-blur-md border border-[#2A2B2E] text-[#F7F7F8] font-semibold text-sm hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all duration-300 min-h-[44px] shadow-lg">
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      {/* KPIs - Luxury Glassmorphism */}
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
          <div key={i} className="group relative">
            <div className="absolute -inset-px bg-gradient-to-b from-[#D4AF37]/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/6 backdrop-blur-md border border-[#2A2B2E] rounded-2xl p-6 hover:bg-white/8 hover:translate-y-[-2px] hover:shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all duration-300">
              <div className="text-xs text-[#B8BDC7] font-medium flex items-center gap-2 mb-3">
                <div className="text-[#D4AF37]">{k.icon}</div>
                {k.label}
              </div>
              <div className="text-4xl font-bold text-[#F7F7F8] mb-2">{k.value}</div>
              <p className="text-[10px] text-[#B8BDC7] leading-relaxed">{k.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Filtros - Luxury Glassmorphism */}
      <section className="px-6 lg:px-10 mt-8">
        <div className="bg-white/6 backdrop-blur-md border border-[#2A2B2E] rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex items-center gap-3 md:col-span-2 bg-white/4 rounded-full px-4 py-2.5 border border-[#2A2B2E] hover:border-[#D4AF37]/30 transition-all duration-300">
              <PackageSearch className="w-4 h-4 text-[#D4AF37]" />
              <Input
                placeholder="Buscar por cliente, ciudad, guía o pedido…"
                className="bg-transparent border-0 text-[#F7F7F8] placeholder:text-[#B8BDC7] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select onValueChange={setEstadoSel}>
              <SelectTrigger className="rounded-full bg-white/4 border-[#2A2B2E] hover:border-[#D4AF37]/30 text-[#F7F7F8] transition-all duration-300 min-h-[44px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0B0C] border-[#2A2B2E] text-[#F7F7F8]">
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="DESPACHADO">Despachado</SelectItem>
                <SelectItem value="TRÁNSITO">En tránsito</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="RETRASADO">Retrasado</SelectItem>
                <SelectItem value="DEVOLUCIÓN">Devolución</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setTransSel}>
              <SelectTrigger className="rounded-full bg-white/4 border-[#2A2B2E] hover:border-[#D4AF37]/30 text-[#F7F7F8] transition-all duration-300 min-h-[44px]">
                <SelectValue placeholder="Transportadora" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0B0C] border-[#2A2B2E] text-[#F7F7F8]">
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="SERVIENTREGA">SERVIENTREGA</SelectItem>
                <SelectItem value="INTERRAPIDISIMO">INTERRAPIDISIMO</SelectItem>
                <SelectItem value="ENVIA">ENVIA</SelectItem>
                <SelectItem value="COORDINADORA">COORDINADORA</SelectItem>
                <SelectItem value="TCC">TCC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Tabla — FIJA */}
      <section className="px-6 lg:px-10 mt-6 pb-14">
        <FixedCard>
          <div className="p-0 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RotateCcw className="w-8 h-8 animate-spin text-[#D8BD80] mx-auto mb-4" />
                  <p className="text-neutral-600">Cargando envíos...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-2">Error al cargar envíos</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate()}
                    className="rounded-full"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : enviosFiltrados.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <PackageSearch className="w-8 h-8 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No hay envíos que mostrar</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Los envíos aparecerán automáticamente cuando se creen facturas con contraentrega
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-center px-2 py-2 text-xs">Pedido</th>
                    <th className="text-center px-2 py-2 text-xs">Valor Total</th>
                    <th className="text-center px-2 py-2 text-xs">Cliente</th>
                    <th className="text-center px-2 py-2 text-xs">Ciudad</th>
                    <th className="text-center px-2 py-2 text-xs">Transp.</th>
                    <th className="text-center px-2 py-2 text-xs">Guía</th>
                    <th className="text-center px-2 py-2 text-xs">Estado</th>
                    <th className="text-center px-2 py-2 text-xs w-[100px]">Progreso</th>
                    <th className="text-center px-2 py-2 text-xs">Despacho</th>
                    <th className="text-center px-2 py-2 text-xs">F. Entrega</th>
                    <th className="text-center px-2 py-2 text-xs">Últ. Act.</th>
                    <th className="text-center px-2 py-2 text-xs">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {enviosFiltrados.map((e: Shipment, idx: number) => (
                  <tr key={e.envioId} className={idx % 2 ? "bg-neutral-50/50" : "bg-white"}>
                    <td className="px-2 py-2 font-medium text-center text-xs">
                      {e.factura || e.pedidoId}
                    </td>
                    <td className="px-2 py-2 text-neutral-600 text-center text-xs font-semibold">
                      {e.total ? `$ ${e.total.toLocaleString('es-CO')}` : 'N/A'}
                    </td>
                    <td className="px-2 py-2 text-center text-xs">{e.cliente}</td>
                    <td className="px-2 py-2 text-center text-xs">
                      <div className="flex items-center gap-1 justify-center">
                        <MapPin className="w-3 h-3" /> {e.ciudad}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-xs">{e.transportadora}</td>
                    <td className="px-2 py-2 tabular-nums text-center text-xs">{e.guia}</td>
                    <td className="px-2 py-2 text-center text-xs">
                      <div className="flex justify-center">
                        <EstadoBadge estado={e.estado} mipaqueteStatus={e.mipaqueteStatus} />
                      </div>
                    </td>
                    <td className="px-2 py-2 w-[100px]">
                      <ProgressBar value={e.progreso} />
                    </td>
                    <td className="px-2 py-2 text-center text-xs">{e.despacho}</td>
                    <td className="px-2 py-2 text-center text-xs">{e.eta}</td>
                    <td className="px-2 py-2 text-neutral-500 text-center text-xs">{e.lastUpdate}</td>
                    <td className="px-2 py-2 text-center text-xs">
                      <div className="flex justify-center gap-2">
                        {/* Si hay novedad, mostrar botón rojo prioritario */}
                        {(() => {
                          const hasNovedad = e.mipaqueteStatus && (
                            e.mipaqueteStatus.toLowerCase().includes('novedad') ||
                            e.mipaqueteStatus.toLowerCase().includes('cancela') ||
                            e.mipaqueteStatus.toLowerCase().includes('rechaza') ||
                            e.mipaqueteStatus.toLowerCase().includes('usuario') ||
                            e.estado === 'Retrasado'
                          )

                          // Debug: mostrar en console
                          if (e.guia === '58048080554') {
                            console.log('DEBUG Envío 58048080554:', {
                              mipaqueteStatus: e.mipaqueteStatus,
                              estado: e.estado,
                              hasNovedad
                            })
                          }

                          return hasNovedad ? (
                            <button
                              onClick={() => {
                                console.log('Abriendo modal para:', e)
                                setNovedadModal({ open: true, envio: e })
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-1
                              border border-red-600 text-white bg-red-600 hover:bg-red-700
                              transition-all text-xs whitespace-nowrap"
                              title="¡URGENTE! Click para solucionar novedad"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Novedad
                            </button>
                          ) : (
                            <button
                              onClick={() => setTrace({ open: true, guia: e.guia })}
                              className="inline-flex items-center gap-1 rounded px-2 py-1
                              border border-neutral-300 text-neutral-700
                              bg-white hover:bg-neutral-50 transition text-xs whitespace-nowrap"
                              title="Ver tracking"
                            >
                              <Route className="w-3 h-3" />
                              Track
                            </button>
                          )
                        })()}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Footer paginación (demo) */}
            {!isLoading && !error && enviosFiltrados.length > 0 && (
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
            )}
          </div>
        </FixedCard>
      </section>

      {/* Modal de Tracking — muestra timeline si la API trae eventos; si no, JSON */}
      {trace.open && (
        <TrackingDialog guia={trace.guia} open={trace.open} onClose={() => setTrace({ open: false, guia: "" })} />
      )}

      {/* Modal de Novedad — muestra datos del cliente y pedido para contactar */}
      {/* Version: 2025-11-04-v3 - FINAL FIX - Build timestamp for cache busting */}
      {novedadModal.open && novedadModal.envio && (
        <NovedadModal
          open={novedadModal.open}
          onClose={() => setNovedadModal({ open: false, envio: null })}
          envio={novedadModal.envio}
        />
      )}

      {/* Build version indicator - Remove after confirming deploy works */}
      <div className="fixed bottom-2 right-2 text-xs text-neutral-400 bg-white/80 px-2 py-1 rounded">
        Build: 2025-11-04 15:25 v3
      </div>
    </div>
  )
}
