"use client"

import { Info } from 'lucide-react'
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
    Campaña: "Nombre de la campaña publicitaria",
    Entrega: "Estado de entrega de la campaña",
    "Presup.": "Presupuesto asignado a la campaña",
    Gastado: "Monto total gastado en la campaña hasta el momento",
    "Conv.": "Número de conversiones obtenidas",
    "$ / Conv.": "Costo por conversión (CPA - Cost Per Acquisition)",
    Ventas: "Número total de ventas atribuidas a esta campaña",
    Ingresos: "Ingresos totales generados (sin incluir costo de envío)",
    ROAS: "Return on Ad Spend - Retorno de inversión publicitaria (Ingresos/Gastado)",
    CVR: "Conversion Rate - Tasa de conversión (Ventas/Conversaciones)",
  }

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,.04)]">
      <table className="w-full text-[10px]">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="text-left px-1.5 py-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Estado</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-5 hidden group-hover:block z-50 w-48 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Estado}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-left px-1.5 py-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Campaña</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-5 hidden group-hover:block z-50 w-48 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Campaña}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-left px-1.5 py-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Entrega</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute left-0 top-5 hidden group-hover:block z-50 w-48 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Entrega}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Presup.</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips["Presup."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Gastado</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Gastado}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Conv.</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips["Conv."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">$/Conv.</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips["$ / Conv."]}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Ventas</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Ventas}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">Ingresos</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.Ingresos}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">ROAS</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.ROAS}
                  </div>
                </div>
              </div>
            </th>
            <th className="text-right px-1.5 py-1.5">
              <div className="flex items-center justify-end gap-0.5">
                <span className="text-[9px] font-semibold uppercase">CVR</span>
                <div className="group relative">
                  <Info className="w-2.5 h-2.5 text-neutral-400 cursor-help" />
                  <div className="absolute right-0 top-5 hidden group-hover:block z-50 w-40 p-1.5 bg-neutral-900 text-white text-[10px] rounded-md shadow-lg">
                    {columnTooltips.CVR}
                  </div>
                </div>
              </div>
            </th>
            <th className="px-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-neutral-50">
              <td className="px-1.5 py-1.5">
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(r.id)}
                    onChange={() => onToggleSelection(r.id)}
                    className="w-3 h-3 rounded border-neutral-300 text-[#D8BD80] focus:ring-[#D8BD80]"
                  />
                  <span
                    className={`inline-flex h-3 w-6 rounded-full border ${r.status === "active" ? "bg-green-500/90 border-green-500" : "bg-neutral-200 border-neutral-300"}`}
                  />
                </div>
              </td>
              <td className="px-1.5 py-1.5">
                <div className="font-medium text-[10px] leading-tight">{r.name}</div>
                <div className="text-[9px] text-neutral-500 leading-tight">
                  ID: {r.id} · {r.accountType}
                </div>
              </td>
              <td className="px-1.5 py-1.5">
                <Pill color={r.delivery === "Activa" ? "green" : "amber"}>{r.delivery}</Pill>
              </td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{r.budget ? fmtMoney(r.budget) : "$0"}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px] font-medium">{fmtMoney(r.spend)}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{fmtNum(r.conv)}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{r.cpa ? fmtMoney(r.cpa) : "—"}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{fmtNum(r.sales)}</td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{fmtMoney(r.revenue)}</td>
              <td className={`px-1.5 py-1.5 text-right tabular-nums text-[10px] ${r.roas >= 1 ? "text-emerald-600" : "text-rose-600"}`}>
                {r.roas.toFixed(2)}x
              </td>
              <td className="px-1.5 py-1.5 text-right tabular-nums text-[10px]">{(r.cvr * 100).toFixed(2)}%</td>
              <td className="px-1" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: "green" | "amber" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${colors[color]}`}>
      {children}
    </span>
  )
}

