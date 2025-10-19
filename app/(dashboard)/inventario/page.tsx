"use client"
import { useEffect, useMemo, useState } from "react"
import inv from "@/adapters/inventory"
import type { Product, Variant } from "@/lib/inventory-types"
import { v4 as uuid } from "uuid"
import InventoryModals from "@/components/inventory/modals"
import MovementsDrawer from "@/components/inventory/movements-drawer"
import ReorderAside from "@/components/inventory/reorder-aside"

function k(num: number) {
  return num.toLocaleString()
}

export default function InventoryPage() {
  const [snapshot, setSnapshot] = useState(inv.getSnapshot())
  const [query, setQuery] = useState("")
  const [stockFilter, setStockFilter] = useState<"all" | "cantidad" | "garantias">("all")
  const [category, setCategory] = useState<string>("all")
  const [openModals, setOpenModals] = useState<{ product?: Product | null; movement?: Variant | null }>({})
  const [showMov, setShowMov] = useState(false)
  const [pollAt, setPollAt] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setSnapshot(inv.getSnapshot())
      setPollAt(Date.now())
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const warehouses = useMemo(() => inv.listWarehouses(), [])
  const products = useMemo(() => inv.listProducts(), [pollAt])

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Sin categoría"))
    return ["all", ...Array.from(set)]
  }, [products])

  const kpis = useMemo(() => inv.valuation(), [pollAt])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q))
      const matchC = category === "all" || (p.category || "Sin categoría") === category
      return matchQ && matchC
    })
  }, [products, query, category])

  const totalRows = useMemo(() => {
    const rows = filtered.flatMap((p) => p.variants.map((v) => ({ p, v })))

    if (stockFilter === "all") return rows

    return rows.filter(({ v }) => {
      if (stockFilter === "cantidad") {
        return (v.cantidadPrincipal ?? 0) > 0
      } else if (stockFilter === "garantias") {
        return (v.cantidadGarantias ?? 0) > 0
      }
      return true
    })
  }, [filtered, stockFilter])

  const openNewProduct = () => {
    setOpenModals({
      product: {
        id: uuid(),
        name: "",
        category: "Sin categoría",
        brand: "GALLE",
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        medidas: "",
        variants: [
          {
            id: uuid(),
            name: "Única",
            sku: "",
            barcode: "",
            stockByWh: Object.fromEntries(warehouses.map((w) => [w.id, 0])),
            cost: 0,
            price: 0,
            precioMayor: 0,
            reorderLevel: 0,
            enabled: true,
            cantidadPrincipal: 0,
            cantidadGarantias: 0,
          },
        ],
      } as Product,
    })
  }

  const onSaveProduct = (p: Product) => {
    inv.upsertProduct(p)
    setSnapshot(inv.getSnapshot())
    setOpenModals({})
  }

  const onDeleteProduct = (id: string) => {
    inv.deleteProduct(id)
    setSnapshot(inv.getSnapshot())
    setOpenModals({})
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-neutral-500">Control de existencias, valoración y movimientos (AVG/FIFO).</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm hover:shadow" onClick={openNewProduct}>
            Nuevo producto
          </button>
          <button className="rounded-xl border px-3 py-2 text-sm hover:shadow" onClick={() => setShowMov(true)}>
            Kardex
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardKPI title="Valor en bodega" value={`$${k(kpis.valor)}`} />
        <CardKPI title="Unidades" value={k(kpis.unidades)} />
        <CardKPI title="% agotado/umbral" value={`${kpis.agotado}`} sub="variantes en alerta" />
        <CardKPI title="Costo promedio" value={`$${k(kpis.costoProm)}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <input
            placeholder="Buscar por nombre o SKU…"
            className="w-[280px] rounded-2xl border px-4 py-2 text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-2xl border px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border px-3 py-2 text-sm"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as "all" | "cantidad" | "garantias")}
        >
          <option value="all">Todas las bodegas</option>
          <option value="cantidad">Cantidad</option>
          <option value="garantias">Garantías</option>
        </select>
        <div className="ml-auto text-xs text-neutral-400">Actualización automática cada 60s</div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 text-center">Referencia</th>
              <th className="px-4 py-3 text-center">Nombre</th>
              <th className="px-4 py-3 text-center">Categoría</th>
              <th className="px-4 py-3 text-center">Medidas</th>
              <th className="px-4 py-3 text-center">Cantidad</th>
              <th className="px-4 py-3 text-center">Garantías</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-4 py-3 text-center">Costo</th>
              <th className="px-4 py-3 text-center">Precio Detal</th>
              <th className="px-4 py-3 text-center">Precio Mayor</th>
              <th className="px-4 py-3 text-center">Utilidad Detal</th>
              <th className="px-4 py-3 text-center">Utilidad Mayor</th>
              <th className="px-4 py-3 text-center">Margen Detal</th>
              <th className="px-4 py-3 text-center">Margen Mayor</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {totalRows.map(({ p, v }) => {
              const cantidadPrincipal = v.cantidadPrincipal ?? 0
              const cantidadGarantias = v.cantidadGarantias ?? 0
              const totalStock = cantidadPrincipal + cantidadGarantias

              const utilDetal = v.price - v.cost
              const margenDetal = v.price > 0 ? utilDetal / v.price : 0

              const precioMayor = v.precioMayor ?? 0
              const utilMayor = precioMayor - v.cost
              const margenMayor = precioMayor > 0 ? utilMayor / precioMayor : 0

              const low = totalStock <= (v.reorderLevel ?? 0)
              return (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-3 text-center">
                    <div className="font-medium">{v.sku || "—"}</div>
                    <div className="text-xs text-neutral-500">{v.name}</div>
                  </td>
                  <td className="px-4 py-3 text-center">{p.name}</td>
                  <td className="px-4 py-3 text-center">{p.category || "Sin categoría"}</td>
                  <td className="px-4 py-3 text-center text-neutral-600">{p.medidas || "—"}</td>
                  <td className="px-4 py-3 text-center">{k(cantidadPrincipal)}</td>
                  <td className="px-4 py-3 text-center">{k(cantidadGarantias)}</td>
                  <td className="px-4 py-3 text-center">{k(totalStock)}</td>
                  <td className="px-4 py-3 text-center">${k(v.cost)}</td>
                  <td className="px-4 py-3 text-center">${k(v.price)}</td>
                  <td className="px-4 py-3 text-center">${k(precioMayor)}</td>
                  <td className="px-4 py-3 text-center">${k(utilDetal)}</td>
                  <td className="px-4 py-3 text-center">${k(utilMayor)}</td>
                  <td className="px-4 py-3 text-center">{(margenDetal * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-center">{(margenMayor * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        className="rounded-full border px-3 py-1 text-xs hover:shadow-sm"
                        onClick={() => setOpenModals({ product: p })}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-full border px-3 py-1 text-xs hover:shadow-sm"
                        onClick={() => setOpenModals({ movement: v })}
                      >
                        Mov.
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {totalRows.length === 0 && (
              <tr>
                <td colSpan={15} className="px-6 py-12 text-center text-neutral-400">
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <ReorderAside products={products} />
      </div>

      <InventoryModals
        openProduct={!!openModals.product}
        product={openModals.product || null}
        warehouses={warehouses}
        onClose={() => setOpenModals({})}
        onSave={onSaveProduct}
        onDelete={onDeleteProduct}
        openMovement={!!openModals.movement}
        variant={openModals.movement || null}
        onRegister={(m) => {
          console.log("[v0] Registrando movimiento:", m)
          if (m.type === "warranty") {
            const variant = products.flatMap((p) => p.variants).find((v) => v.id === m.variantId)

            if (variant) {
              variant.cantidadPrincipal = (variant.cantidadPrincipal ?? 0) - m.qty
              variant.cantidadGarantias = (variant.cantidadGarantias ?? 0) + m.qty
              console.log(
                "[v0] Movimiento de garantía procesado. Nueva cantidad:",
                variant.cantidadPrincipal,
                "Nuevas garantías:",
                variant.cantidadGarantias,
              )
            }
          }

          inv.registerMovement(m)
          setSnapshot(inv.getSnapshot())
          setOpenModals({})
        }}
      />

      <MovementsDrawer open={showMov} onClose={() => setShowMov(false)} />
    </div>
  )
}

function CardKPI({ title, value, sub }: { title: string; value: string; sub?: string }) {
  const colors = [
    { bg: "bg-blue-50", border: "border-l-4 border-l-blue-400" },
    { bg: "bg-purple-50", border: "border-l-4 border-l-purple-400" },
    { bg: "bg-amber-50", border: "border-l-4 border-l-amber-400" },
    { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-400" },
  ]

  const colorIndex = title.charCodeAt(0) % colors.length
  const { bg, border } = colors[colorIndex]

  return (
    <div className={`rounded-2xl border ${bg} ${border} p-4 shadow-sm backdrop-blur`}>
      <div className="text-xs text-neutral-600 font-medium">{title}</div>
      <div className="mt-2 text-2xl font-bold text-neutral-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  )
}
