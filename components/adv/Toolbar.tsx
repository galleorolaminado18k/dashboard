"use client"
import { IconBtn } from "./ui"

export function Toolbar({
  range,
  setRange,
  onExport,
  onCharts,
}: {
  range: string
  setRange: (v: string) => void
  onExport?: () => void
  onCharts?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={range}
        onChange={(e) => setRange(e.target.value)}
        className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
      >
        <option>Últimos 30 días</option>
        <option>Últimos 14 días</option>
        <option>Últimos 7 días</option>
        <option>Hoy</option>
      </select>

      <div className="ml-auto flex items-center gap-2">
        <IconBtn title="Gráficos" onClick={onCharts}>
          Gráficos
        </IconBtn>
        <IconBtn title="Exportar" onClick={onExport}>
          Exportar
        </IconBtn>
      </div>
    </div>
  )
}

