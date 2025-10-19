"use client"
import { useMemo } from "react"
import type { CampaignRow } from "@/lib/types"

export default function AdsTable({
  data,
  onToggleAdsets,
  selectedCampaigns = [],
  onToggleSelection,
}: {
  data: CampaignRow[]
  onToggleAdsets: (campaignId: string) => void
  selectedCampaigns?: string[]
  onToggleSelection?: (campaignId: string) => void
}) {
  const computed = useMemo(() => {
    return data.map((c) => {
      const presupuesto = c.meta.dailyBudget
      const gastado = c.meta.spendTotal
      const conv = c.crm.conversations
      const ventas = c.crm.completedOrders
      const ingresos = c.sales.revenue
      const costoPorConv = conv > 0 ? gastado / conv : 0
      const roas = gastado > 0 ? ingresos / gastado : 0
      const cvr = conv > 0 ? ventas / conv : 0

      return { c, presupuesto, gastado, conv, ventas, ingresos, costoPorConv, roas, cvr }
    })
  }, [data])

  const allSelected = data.length > 0 && selectedCampaigns.length === data.length
  const someSelected = selectedCampaigns.length > 0 && selectedCampaigns.length < data.length

  const handleSelectAll = () => {
    if (!onToggleSelection) return
    if (allSelected) {
      // Deseleccionar todas
      data.forEach((row) => onToggleSelection(row.id))
    } else {
      // Seleccionar todas las que no están seleccionadas
      data.forEach((row) => {
        if (!selectedCampaigns.includes(row.id)) {
          onToggleSelection(row.id)
        }
      })
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="w-full whitespace-nowrap text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 text-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected
                }}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-neutral-300 text-[#D8BD80] focus:ring-[#D8BD80]"
              />
            </th>
            <th className="px-4 py-3 text-center">Estado</th>
            <th className="px-4 py-3 text-center">Campaña</th>
            <th className="px-4 py-3 text-center">Entrega</th>
            <th className="px-4 py-3 text-center">Presup.</th>
            <th className="px-4 py-3 text-center">Gastado</th>
            <th className="px-4 py-3 text-center">Conv.</th>
            <th className="px-4 py-3 text-center">$/Conv.</th>
            <th className="px-4 py-3 text-center">Ventas</th>
            <th className="px-4 py-3 text-center">Ingresos</th>
            <th className="px-4 py-3 text-center">ROAS</th>
            <th className="px-4 py-3 text-center">CVR</th>
            <th className="px-4 py-3 text-center"></th>
          </tr>
        </thead>
        <tbody>
          {computed.map((row) => (
            <tr key={row.c.id} className="border-t">
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.includes(row.c.id)}
                  onChange={() => onToggleSelection?.(row.c.id)}
                  className="h-4 w-4 rounded border-neutral-300 text-[#D8BD80] focus:ring-[#D8BD80]"
                />
              </td>

              <td className="px-4 py-3 text-center">
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] ${
                    row.c.status === "Activa" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {row.c.status}
                </span>
              </td>

              <td className="px-4 py-3 text-center">
                <div className="font-medium text-neutral-900">{row.c.name}</div>
                <div className="text-xs text-neutral-500">
                  ID: {row.c.id} • Cuenta: {row.c.accountType}
                </div>
              </td>

              <td className="px-4 py-3 text-center">{row.c.deliveryLabel}</td>
              <td className="px-4 py-3 text-center">${row.presupuesto.toLocaleString()}</td>
              <td className="px-4 py-3 text-center">${row.gastado.toLocaleString()}</td>
              <td className="px-4 py-3 text-center">{row.conv}</td>
              <td className="px-4 py-3 text-center">${row.costoPorConv.toFixed(2)}</td>
              <td className="px-4 py-3 text-center">{row.ventas}</td>
              <td className="px-4 py-3 text-center">${row.ingresos.toLocaleString()}</td>
              <td className="px-4 py-3 text-center">{row.roas.toFixed(2)}x</td>
              <td className="px-4 py-3 text-center">{(row.cvr * 100).toFixed(2)}%</td>

              <td className="px-4 py-3 text-center">
                <button
                  className="rounded-full border px-3 py-1 text-xs hover:shadow-sm"
                  onClick={() => onToggleAdsets(row.c.id)}
                >
                  Ver conjuntos
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
