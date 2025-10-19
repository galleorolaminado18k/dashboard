"use client"
import { v4 as uuid } from "uuid"
import type { InventorySnapshot, Movement, Product, Warehouse, CostMethod } from "@/lib/inventory-types"

const KEY = "lux-inventory-v1"

const defaultWarehouses: Warehouse[] = [
  { id: "W1", name: "Principal" },
  { id: "W2", name: "Secundaria" },
]

const seed: InventorySnapshot = {
  warehouses: defaultWarehouses,
  costMethod: "avg",
  products: [
    {
      id: uuid(),
      name: "Cadena de Oro 18k",
      category: "Cadenas",
      brand: "GALLE",
      notes: "Best seller",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: [
        {
          id: uuid(),
          name: "45cm / Dorado",
          sku: "CAD-18K-45-DOR",
          barcode: "7701234560001",
          stockByWh: { W1: 22, W2: 8 },
          cost: 120000,
          price: 180000,
          reorderLevel: 10,
          enabled: true,
        },
      ],
    },
    {
      id: uuid(),
      name: "Aretes de Oro laminado",
      category: "Aretes",
      brand: "GALLE",
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: [
        {
          id: uuid(),
          name: "Única / Dorado",
          sku: "ARE-LAM-UNI-DOR",
          barcode: "7701234560002",
          stockByWh: { W1: 6, W2: 0 },
          cost: 65000,
          price: 98000,
          reorderLevel: 5,
          enabled: true,
        },
      ],
    },
  ],
  movements: [],
}

function load(): InventorySnapshot {
  if (typeof window === "undefined") return seed
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw)
}

function save(snapshot: InventorySnapshot) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(snapshot))
}

const api = {
  getSnapshot(): InventorySnapshot {
    return load()
  },
  setCostMethod(method: CostMethod) {
    const s = load()
    s.costMethod = method
    save(s)
  },
  listProducts(): Product[] {
    return load().products
  },
  listWarehouses(): Warehouse[] {
    return load().warehouses
  },
  listMovements(): Movement[] {
    return load().movements.sort((a, b) => a.date.localeCompare(b.date))
  },
  upsertProduct(p: Product) {
    const s = load()
    const idx = s.products.findIndex((x) => x.id === p.id)
    if (idx >= 0) s.products[idx] = p
    else s.products.unshift(p)
    p.updatedAt = new Date().toISOString()
    save(s)
  },
  deleteProduct(productId: string) {
    const s = load()
    s.products = s.products.filter((p) => p.id !== productId)
    s.movements = s.movements.filter((m) => m.productId !== productId)
    save(s)
  },
  registerMovement(m: Movement) {
    const s = load()
    const product = s.products.find((p) => p.id === m.productId)
    if (!product) throw new Error("Producto no existe")
    const variant = product.variants.find((v) => v.id === m.variantId)
    if (!variant) throw new Error("Variante no existe")

    const qtySigned = m.type === "out" ? -Math.abs(m.qty) : m.type === "transfer" ? Math.abs(m.qty) : Math.abs(m.qty)

    if (m.type === "in") {
      const totalUnits = Object.values(variant.stockByWh).reduce((a, b) => a + b, 0)
      if (s.costMethod === "avg") {
        const totalValor = totalUnits * variant.cost + (m.unitCost ?? variant.cost) * Math.abs(m.qty)
        const nuevaCant = totalUnits + Math.abs(m.qty)
        variant.cost = nuevaCant > 0 ? Math.round(totalValor / nuevaCant) : variant.cost
      }
      const wh = m.toWh || "W1"
      variant.stockByWh[wh] = (variant.stockByWh[wh] ?? 0) + Math.abs(m.qty)
    } else if (m.type === "out") {
      const wh = m.fromWh || "W1"
      variant.stockByWh[wh] = (variant.stockByWh[wh] ?? 0) + qtySigned
      if (s.costMethod === "fifo") {
        variant.cost = m.unitCost ?? variant.cost
      }
    } else if (m.type === "adjust") {
      const wh = m.toWh || m.fromWh || "W1"
      variant.stockByWh[wh] = (variant.stockByWh[wh] ?? 0) + qtySigned
      if (typeof m.unitCost === "number") variant.cost = m.unitCost
    } else if (m.type === "transfer") {
      const from = m.fromWh || "W1"
      const to = m.toWh || "W2"
      variant.stockByWh[from] = (variant.stockByWh[from] ?? 0) - Math.abs(m.qty)
      variant.stockByWh[to] = (variant.stockByWh[to] ?? 0) + Math.abs(m.qty)
    }

    m.id = uuid()
    s.movements.push(m)
    product.updatedAt = new Date().toISOString()
    save(s)
  },
  valuation() {
    const s = load()
    let unidades = 0,
      valor = 0,
      agotado = 0
    s.products.forEach((p) =>
      p.variants.forEach((v) => {
        const st = Object.values(v.stockByWh).reduce((a, b) => a + b, 0)
        unidades += st
        valor += st * v.cost
        if (v.enabled && st <= (v.reorderLevel ?? 0)) agotado++
      }),
    )
    const costoProm = unidades > 0 ? Math.round(valor / unidades) : 0
    return { unidades, valor, costoProm, agotado }
  },
}

export default api
