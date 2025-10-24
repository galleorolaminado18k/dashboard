"use client"

import * as React from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/adv-fetch"
import { GoldRing, Kpi, LiveBadge } from "@/components/adv/ui"
import { fmtMoney, fmtNum } from '@/lib/format'
import { Toolbar } from "@/components/adv/Toolbar"
import { AdsTable } from "@/components/adv/Table"

type Campaign = {
  id: string
  name: string
  status: "active" | "paused"
}

export default function Advertising({ initialKpis, initialCampRes, initialMonthly, hideHeaderKPIs, forcedSpend }: { initialKpis?: any; initialCampRes?: any; initialMonthly?: any; hideHeaderKPIs?: boolean; forcedSpend?: number }) {
  const [range, setRange] = React.useState("Últimos 30 días")
  const [tab, setTab] = React.useState<"camps" | "sets" | "ads">("camps")
  const [q, setQ] = React.useState("")
  const [selectedFilter, setSelectedFilter] = React.useState("Todas")
  const [selectedCampaigns, setSelectedCampaigns] = React.useState<string[]>([])

  const { data: kpiRes } = useSWR(`/api/adv/summary?range=${encodeURIComponent(range)}`, fetcher, {
    refreshInterval: 5000,
    fallbackData: initialKpis ? { data: initialKpis } : undefined,
  })
  const kpis = kpiRes?.data || initialKpis || {
    spend: 0,
    conv: 0,
    sales: 0,
    roas: 0,
    ctr: 0,
    deltaSpend: "+0%",
  }

  // Use the server-provided monthly spend as the single source of truth.
  // If the server passed a forced numeric spend, prefer it (avoids client overwrite).
  // Do not re-fetch on the client to avoid flicker; the Server Component already fetched the value.
  const monthly = typeof forcedSpend === 'number' && Number.isFinite(forcedSpend)
    ? { thisMonth: forcedSpend, lastMonth: initialMonthly?.lastMonth ?? 0 }
    : (initialMonthly ?? { thisMonth: 0, lastMonth: 0 })

  const campQuery = `/api/adv/campaigns?q=${encodeURIComponent(q)}&range=${encodeURIComponent(range)}&state=${encodeURIComponent(selectedFilter)}`
  const { data: campRes } = useSWR(campQuery, fetcher, {
    refreshInterval: 5000,
    fallbackData: initialCampRes ? initialCampRes : undefined,
  })
  const campaigns: Campaign[] = campRes?.campaigns || (initialCampRes?.campaigns ?? [])

  const rows = (campRes?.rows || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    status: r.status as "active" | "paused",
    delivery: r.delivery as "Activa" | "Pausada",
    receive: r.receive ?? "",
    budget: r.budget ?? 0,
    spend: r.spend ?? 0,
    conv: r.conversions ?? 0,
    cpa: r.cpa ?? null,
    sales: r.sales ?? 0,
    revenue: r.revenue ?? 0,
    roas: r.roas ?? 0,
    ctr: r.ctr ?? 0,
    cvr: (r.conversions ?? 0) > 0 ? (r.sales ?? 0) / (r.conversions ?? 0) : 0,
    accountType: "Meta Ads",
  }))

  const handleToggleSelection = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId) ? prev.filter((id) => id !== campaignId) : [...prev, campaignId],
    )
  }

  // Obtener la primera campaña seleccionada para mostrar sus adsets/ads
  const selectedCampaignId = selectedCampaigns.length > 0 ? selectedCampaigns[0] : null

  // Fetch adsets cuando hay una campaña seleccionada y el tab es "sets"
  const shouldFetchAdsets = tab === "sets" && selectedCampaignId
  const adsetsQuery = shouldFetchAdsets ? `/api/adv/adsets?campaignId=${selectedCampaignId}` : null
  const { data: adsetsRes } = useSWR(adsetsQuery, fetcher, {
    refreshInterval: 5000,
  })

  const adsets = adsetsRes?.rows || []

  // Fetch ads cuando hay una campaña seleccionada y el tab es "ads"
  const shouldFetchAds = tab === "ads" && selectedCampaignId
  const adsQuery = shouldFetchAds ? `/api/adv/ads?campaignId=${selectedCampaignId}` : null
  const { data: adsRes } = useSWR(adsQuery, fetcher, {
    refreshInterval: 5000,
  })

  const ads = adsRes?.rows || []

  return (
    <div className="galle-ads min-h-screen bg-white">
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
                  ["ID", "Campaña", "Estado", "Gastado", "Conv", "Ventas", "Ingresos", "ROAS", "CTR"].join(","),
                  ...rows.map((r: any) =>
                    [
                      r.id,
                      `"${r.name.replace(/"/g, '""')}"`,
                      r.status,
                      r.spend,
                      r.conv,
                      r.sales,
                      r.revenue,
                      r.roas?.toFixed?.(2) ?? 0,
                      ((r.ctr ?? 0) * 100).toFixed(2),
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

      {!hideHeaderKPIs && (
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi
              title="GASTO TOTAL"
              value={fmtMoney(monthly.thisMonth)}
              sub={<span className="text-emerald-600">{monthly.lastMonth ? `${fmtMoney(monthly.lastMonth)} mes anterior` : 'vs anterior'}</span>}
              tone="blue"
            />
            <Kpi
              title="CONVERSIONES"
              value={fmtNum(kpis.conv)}
              sub={`${fmtMoney(kpis.cpa)} por conv.`}
              tone="violet"
            />
            <Kpi
              title="VENTAS"
              value={fmtNum(kpis.sales)}
              sub={<span className="text-emerald-600">{((kpis.convRate ?? 0) * 100).toFixed(2)}% tasa conversión</span>}
              tone="gold"
            />
            <Kpi
              title="ROAS"
              value={`${(kpis.roas ?? 0).toFixed(2)}x`}
              sub={`${fmtMoney(kpis.revenue)} ingresos`}
              tone="amber"
            />
            <Kpi
              title="CTR PROMEDIO"
              value={`${((kpis.ctr ?? 0) * 100).toFixed(2)}%`}
              sub={`${fmtNum(kpis.impr)} impresiones`}
              tone="gold"
            />
          </div>
        </div>
      )}

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
          <>
            {!selectedCampaignId ? (
              <div className="rounded-2xl border border-neutral-200 p-8 bg-white text-center">
                <p className="text-neutral-500 mb-2">Selecciona una campaña para ver sus conjuntos de anuncios</p>
                <p className="text-sm text-neutral-400">Haz clic en el checkbox de una campaña en la pestaña "Campañas"</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                  <h3 className="font-semibold text-sm">
                    Conjuntos de anuncios de: {rows.find(r => r.id === selectedCampaignId)?.name || selectedCampaignId}
                  </h3>
                </div>
                {adsets.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    No hay conjuntos de anuncios disponibles para esta campaña
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Presupuesto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Gastado</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Impresiones</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">CTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {adsets.map((adset: any) => (
                          <tr key={adset.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm">{adset.name}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                adset.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {adset.delivery || (adset.status === 'active' ? 'Activa' : 'Pausada')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">{fmtMoney(adset.budget)}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium">{fmtMoney(adset.spend)}</td>
                            <td className="px-4 py-3 text-right text-sm">{fmtNum(adset.impressions)}</td>
                            <td className="px-4 py-3 text-right text-sm">{((adset.ctr || 0) * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {tab === "ads" && (
          <>
            {!selectedCampaignId ? (
              <div className="rounded-2xl border border-neutral-200 p-8 bg-white text-center">
                <p className="text-neutral-500 mb-2">Selecciona una campaña para ver sus anuncios</p>
                <p className="text-sm text-neutral-400">Haz clic en el checkbox de una campaña en la pestaña "Campañas"</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                  <h3 className="font-semibold text-sm">
                    Anuncios de: {rows.find(r => r.id === selectedCampaignId)?.name || selectedCampaignId}
                  </h3>
                </div>
                {ads.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    No hay anuncios disponibles para esta campaña
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Gastado</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Impresiones</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">CTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {ads.map((ad: any) => (
                          <tr key={ad.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm">{ad.name}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                ad.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {ad.delivery || (ad.status === 'active' ? 'Activo' : 'Pausado')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">{fmtMoney(ad.spend)}</td>
                            <td className="px-4 py-3 text-right text-sm">{fmtNum(ad.impressions)}</td>
                            <td className="px-4 py-3 text-right text-sm">{((ad.ctr || 0) * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
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

