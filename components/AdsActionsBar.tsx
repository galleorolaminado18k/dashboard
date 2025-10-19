"use client"
export default function AdsActionsBar({
  onOpenGraphs,
  onExport,
}: {
  onOpenGraphs: () => void
  onExport: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button className="rounded-full border px-4 py-2 hover:shadow-sm" onClick={onOpenGraphs}>
        Gráficos
      </button>
      <button className="rounded-full border px-4 py-2 hover:shadow-sm" onClick={onExport}>
        Exportar
      </button>
      <div className="ml-auto text-xs text-neutral-500">Actualización automática cada 5 min</div>
    </div>
  )
}
