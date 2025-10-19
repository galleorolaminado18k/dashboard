"use client"
import type { Product } from "@/lib/inventory-types"

export default function ReorderAside({ products }: { products: Product[] }) {
  const alerts = products
    .flatMap((p) =>
      p.variants
        .filter((v) => v.enabled)
        .map((v) => {
          const stock = Object.values(v.stockByWh).reduce((a, b) => a + b, 0)
          const low = stock <= (v.reorderLevel ?? 0)
          return { p, v, stock, low }
        }),
    )
    .filter((x) => x.low)

  if (alerts.length === 0) return null

  return (
    <div className="rounded-2xl border bg-amber-50/40 p-4">
      <div className="mb-2 text-sm font-semibold">Alertas de reposición</div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {alerts.map(({ p, v, stock }) => (
          <div key={v.id} className="rounded-xl border bg-white p-3">
            <div className="text-sm font-medium">{p.name}</div>
            <div className="text-xs text-neutral-500">
              {v.name} — {v.sku}
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>
                Stock: <b>{stock}</b>
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] text-amber-800">
                Reordenar ≥ {v.reorderLevel ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
