"use client"
import inv from "@/adapters/inventory"

export default function MovementsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const movs = inv.listMovements()

  if (!open) return null
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-auto border-l bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">Kardex</div>
        <button className="text-xs text-neutral-500" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">SKU</th>
            <th className="px-3 py-2 text-left">Tipo</th>
            <th className="px-3 py-2 text-right">Cant.</th>
            <th className="px-3 py-2 text-right">Costo</th>
            <th className="px-3 py-2 text-left">Bodega</th>
            <th className="px-3 py-2 text-left">Nota</th>
          </tr>
        </thead>
        <tbody>
          {movs.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="px-3 py-2">{new Date(m.date).toLocaleString()}</td>
              <td className="px-3 py-2">{m.sku}</td>
              <td className="px-3 py-2">{m.type}</td>
              <td className="px-3 py-2 text-right">{m.qty}</td>
              <td className="px-3 py-2 text-right">
                {typeof m.unitCost === "number" ? `$${m.unitCost.toLocaleString()}` : "—"}
              </td>
              <td className="px-3 py-2">
                {m.type === "in" && m.toWh}
                {m.type === "out" && m.fromWh}
                {m.type === "adjust" && (m.toWh || m.fromWh)}
                {m.type === "transfer" && `${m.fromWh} → ${m.toWh}`}
              </td>
              <td className="px-3 py-2">{m.note || "—"}</td>
            </tr>
          ))}
          {movs.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                Sin movimientos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
