"use client"
import { Pill } from "./ui"
import { Info } from "lucide-react"
import { fmtMoney, fmtNum } from '@/lib/format'

export function AdsTable({
  rows,
  selectedCampaigns,
  onToggleSelection,
}: {
  rows: Array<{
    id: string
    name: string
    accountType: string
    status: "active" | "paused"
    delivery: "Activa" | "Pausada"
    budget?: number
    spend: number
    conv: number
    cpa?: number
    sales: number
    revenue: number
    roas: number
    cvr: number
  }>
  selectedCampaigns: string[]
  onToggleSelection: (id: string) => void
}) {
  const columnTooltips: Record<string, string> = {
    Estado: "Indica si la campaña está activa (verde) o pausada (gris)",
    Campaña: "Nombre de la campaña publicitaria y su ID único",
    Entrega: "Estado actual de entrega de la campaña en Meta Ads",
    "Presup.": "Presupuesto total asignado a la campaña",
    Gastado: "Monto total gastado en la campaña hasta el momento",
    "Conv.": "Número total de conversaciones iniciadas desde la campaña",
    "$ / Conv.": "Costo promedio por cada conversación generada (CPA)",
    Ventas: "Número total de ventas atribuidas a esta campaña",
    Ingresos: "Ingresos totales generados (sin incluir costo de envío)",
    ROAS: "Return on Ad Spend - Retorno de inversión publicitaria (Ingresos/Gastado)",
    CVR: "Conversion Rate - Tasa de conversión (Ventas/Conversaciones)",
  }

  return (
    <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-[0_14px_40px_rgba(0,0,0,.05)]">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="text-left px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span>Estado</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Estado}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-left px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span>Campaña</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Campaña}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-left px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span>Entrega</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Entrega}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>Presup.</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips["Presup."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>Gastado</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Gastado}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>Conv.</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips["Conv."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>$ / Conv.</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips["$ / Conv."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>Ventas</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Ventas}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>Ingresos</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.Ingresos}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>ROAS</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.ROAS}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-5 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span>CVR</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-6 hidden group-hover:block z-50 w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg">
                    {columnTooltips.CVR}
                  </div>
                </div>
              </div>
            </th>
            <th className="px-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(r.id)}
                    onChange={() => onToggleSelection(r.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#D8BD80] focus:ring-[#D8BD80]"
                  />
                  <span
                    className={`inline-flex h-5 w-9 rounded-full border ${r.status === "active" ? "bg-green-500/90 border-green-500" : "bg-neutral-200 border-neutral-300"}`}
                  />
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="font-medium">{r.name}</div>
                <div className="text-[11px] text-neutral-500">
                  ID: {r.id} · Cuenta: {r.accountType}
                </div>
              </td>
              <td className="px-5 py-3">
                <Pill color={r.delivery === "Activa" ? "green" : "amber"}>{r.delivery}</Pill>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">{r.budget ? fmtMoney(r.budget) : "$0"}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmtMoney(r.spend)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmtNum(r.conv)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{r.cpa ? fmtMoney(r.cpa) : "—"}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmtNum(r.sales)}</td>
              <td className="px-5 py-3 text-right tabular-nums">{fmtMoney(r.revenue)}</td>
              <td className={`px-5 py-3 text-right tabular-nums ${r.roas >= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                {r.roas.toFixed(2)}x
              </td>
              <td className="px-5 py-3 text-right tabular-nums">{(r.cvr * 100).toFixed(2)}%</td>
              <td className="px-3" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

