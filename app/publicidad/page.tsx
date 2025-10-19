"use client"

// Copia segura de la página de Publicidad para evitar excepciones en cliente.
// No reemplaza ni borra la versión dentro de (dashboard); coexisten.
// Por configuración, las páginas fuera de grupos tienen prioridad.

import * as React from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/ads-fetch"
import { GoldRing, Kpi, LiveBadge } from "@/components/ads/ui"
import { Toolbar } from "@/components/ads/Toolbar"
import { AdsTable } from "@/components/ads/Table"

type Campaign = {
  id: string
  name: string
  status: "active" | "paused"
}

export const dynamic = "force-dynamic"

export default function Advertising() {
  const [range, setRange] = React.useState("Ultimos 30 dias")
  const [tab, setTab] = React.useState<"camps" | "sets" | "ads">("camps")
  const [q, setQ] = React.useState("")
  const [selectedFilter, setSelectedFilter] = React.useState("Todas")
  const [selectedCampaigns, setSelectedCampaigns] = React.useState<string[]>([])

  const { data: kpiRes } = useSWR(`/api/ads/summary?range=${encodeURIComponent(range)}`, fetcher, {
    refreshInterval: 5000,
  })
  const kpis = kpiRes?.data || {
    spend: 0,
    conv: 0,
    sales: 0,
    roas: 0,
    ctr: 0,
    deltaSpend: "+0%",
    cpa: 0,
    revenue: 0,
    convRate: 0,
    impr: 0,
  }

  const { data: campRes } = useSWR(
    `/api/ads/campaigns?q=${encodeURIComponent(q)}&range=${encodeURIComponent(range)}&state=${encodeURIComponent(selectedFilter)}`,
    fetcher,
    { refreshInterval: 5000 },
  )
  const campaigns: Campaign[] = campRes?.campaigns || []

  // Mapeo robusto para la tabla: asegura tipos numéricos y propiedades esperadas
  const rows = (campRes?.rows || []).map((r: any) => {
    const spend = Number(r.spend ?? 0) || 0
    const conv = Number(r.conversions ?? r.conv ?? 0) || 0
    const sales = Number(r.sales ?? 0) || 0
    const revenue = Number(r.revenue ?? 0) || 0
    const roas = Number(r.roas ?? 0) || 0
    const cpa = r.cpa != null ? Number(r.cpa) : undefined
    const ctr = Number(r.ctr ?? 0) || 0
    const cvr = conv > 0 ? sales / conv : 0
    return {
      id: String(r.id ?? "") as string,
      name: String(r.name ?? "") as string,
      status: (r.status as "active" | "paused") ?? "paused",
      delivery: ((r.status === "active") ? "Activa" : "Pausada") as "Activa" | "Pausada",
      accountType: String(r.accountType ?? "Meta Ads"),
      receive: String(r.receive ?? ""),
      budget: r.budget != null ? Number(r.budget) : undefined,
      spend,
      conv,
      cpa,
      sales,
      revenue,
      roas,
      cvr,
    }
  })

  const handleToggleSelection = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId) ? prev.filter((id) => id !== campaignId) : [...prev, campaignId],
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/85 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Administrador de anuncios</h1>
            <LiveBadge />
          </div>
          <p className="text-sm text-neutral-500">Gestiona tus campañas publicitarias</p>

          <div className="mt-4">
            <Toolbar
              range={range}
              setRange={setRange}
              onExport={() => {
                const csv = [
                  [
                    "ID",
                    "Campaña",
                    "Estado",
                    "Gastado",
                    "Conv",
                    "$ / Conv.",
                    "Ventas",
                    "Ingresos",
                    "ROAS",
                    "CTR",
                  ].join(","),
                  ...rows.map((r: any) =>
                    [
                      r.id,
                      `"${String(r.name).replace(/"/g, '""')}"`,
                      r.status,
                      r.spend,
                      r.conv,
                      r.cpa ?? "",
                      r.sales,
                      r.revenue,
                      Number(r.roas ?? 0).toFixed(2),
                      Number(r.cvr ?? 0 * 100).toFixed(2),
                    ].join(","),
                  ),
                ].join("\n")

                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `publicidad_${new Date().toISOString().slice(0, 10)}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }}
              onCharts={() => {
                alert("Función de gráficos - implementar según necesites")
              }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi
            title="GASTO TOTAL"
            value={`$${Number(kpis.spend ?? 0).toLocaleString()}`}
            sub={<span className="text-emerald-600">{kpis.deltaSpend} vs anterior</span>}
            tone="blue"
          />
          <Kpi
            title="CONVERSIONES"
            value={Number(kpis.conv ?? 0).toLocaleString()}
            sub={`$${Number(kpis.cpa ?? 0).toLocaleString()} por conv.`}
            tone="violet"
          />
          <Kpi
            title="VENTAS"
            value={Number(kpis.sales ?? 0).toLocaleString()}
            sub={<span className="text-emerald-600">{((Number(kpis.convRate ?? 0)) * 100).toFixed(2)}% tasa conversión</span>}
            tone="gold"
          />
          <Kpi
            title="ROAS"
            value={`${Number(kpis.roas ?? 0).toFixed(2)}x`}
            sub={`$${Number(kpis.revenue ?? 0).toLocaleString()} ingresos`}
            tone="amber"
          />
          <Kpi
            title="CTR PROMEDIO"
            value={`${(Number(kpis.ctr ?? 0) * 100).toFixed(2)}%`}
            sub={`${Number(kpis.impr ?? 0).toLocaleString()} impresiones`}
            tone="gold"
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-neutral-200 overflow-hidden">
            <TabButton label="Campañas" active={tab === "camps"} onClick={() => setTab("camps")} />
            <TabButton label="Conjuntos de anuncios" active={tab === "sets"} onClick={() => setTab("sets")} />
            <TabButton label="Anuncios" active={tab === "ads"} onClick={() => setTab("ads")} />
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, identificador o métricas"
                className="h-10 w-[380px] rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none"
              />
              <GoldRing className="rounded-xl" />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
            >
              <option>Todas</option>
              <option>Activas</option>
              <option>Pausadas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {tab === "camps" && (
          <AdsTable rows={rows} selectedCampaigns={selectedCampaigns} onToggleSelection={handleToggleSelection} />
        )}
        {tab === "sets" && (
          <div className="rounded-2xl border border-neutral-200 p-8 bg-white text-neutral-500">
            Vista "Conjuntos de anuncios" (conéctala a /api/ads/adsets …)
          </div>
        )}
        {tab === "ads" && (
          <div className="rounded-2xl border border-neutral-200 p-8 bg-white text-neutral-500">
            Vista "Anuncios" (conéctala a /api/ads/ads …)
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 h-10 text-sm ${active ? "bg-black text-white" : "bg-white text-black hover:bg-neutral-50"} border-r border-neutral-200 first:rounded-l-xl last:rounded-r-xl last:border-r-0`}
    >
      {label}
    </button>
  )
}

