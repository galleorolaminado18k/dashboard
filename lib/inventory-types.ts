export type WarehouseId = string
export type CostMethod = "avg" | "fifo"

export type Variant = {
  id: string
  name: string
  sku: string
  barcode?: string
  stockByWh: Record<WarehouseId, number>
  cantidadPrincipal?: number
  cantidadGarantias?: number
  precioMayor?: number
  cost: number
  price: number
  reorderLevel?: number
  enabled: boolean
}

export type Product = {
  id: string
  name: string
  category?: string
  brand?: string
  notes?: string
  medidas?: string
  variants: Variant[]
  createdAt: string
  updatedAt: string
}

export type Warehouse = {
  id: WarehouseId
  name: string
}

export type MoveType = "in" | "out" | "adjust" | "transfer" | "warranty"

export type Movement = {
  id: string
  date: string
  sku: string
  variantId: string
  productId: string
  type: MoveType
  qty: number
  fromWh?: WarehouseId
  toWh?: WarehouseId
  unitCost?: number
  note?: string
}

export type InventorySnapshot = {
  products: Product[]
  warehouses: Warehouse[]
  movements: Movement[]
  costMethod: CostMethod
}
