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
    <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
      <table className="w-full text-xs">
        <thead className="bg-neutral-50/50 border-b border-neutral-200">
          <tr>
            <th className="text-left px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Estado</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-left px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Campaña</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-left px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Entrega</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Presup.</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Gastado</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Conv.</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">$ / Conv.</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Ventas</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">Ingresos</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">ROAS</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
            <th className="text-right px-4 py-3">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-medium text-neutral-600">CVR</span>
                <Info className="w-3.5 h-3.5 text-neutral-400 cursor-help" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-neutral-50/50 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(r.id)}
                    onChange={() => onToggleSelection(r.id)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#D8BD80] focus:ring-[#D8BD80] focus:ring-offset-0"
                  />
                  <span
                    className={`inline-flex h-5 w-9 rounded-full ${r.status === "active" ? "bg-green-500" : "bg-neutral-300"}`}
                  />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-sm text-neutral-900 leading-tight">{r.name}</div>
                <div className="text-xs text-neutral-500 mt-1 leading-tight">
                  ID: {r.id}
                </div>
                <div className="text-xs text-neutral-400 leading-tight">
                  • Cuenta: {r.accountType}
                </div>
              </td>
              <td className="px-4 py-4">
                <Pill color={r.delivery === "Activa" ? "green" : "amber"}>{r.delivery}</Pill>
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{r.budget ? fmtMoney(r.budget) : "$0"}</td>
              <td className="px-4 py-4 text-right tabular-nums text-sm font-medium text-neutral-900">{fmtMoney(r.spend)}</td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{fmtNum(r.conv)}</td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{r.cpa ? fmtMoney(r.cpa) : "—"}</td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{fmtNum(r.sales)}</td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{fmtMoney(r.revenue)}</td>
              <td className={`px-4 py-4 text-right tabular-nums text-sm font-medium ${r.roas >= 1 ? "text-teal-600" : "text-rose-600"}`}>
                {r.roas.toFixed(2)}x
              </td>
              <td className="px-4 py-4 text-right tabular-nums text-sm text-neutral-900">{(r.cvr * 100).toFixed(2)}%</td>
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  )
}

