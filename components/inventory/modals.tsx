"use client"
import { useState } from "react"
import type { Movement, MoveType, Product, Variant, Warehouse } from "@/lib/inventory-types"

const CATEGORIAS = [
  "CADENAS",
  "ARETES",
  "DIJES",
  "PULSERAS",
  "TOBILLERAS",
  "MANILLAS",
  "BALINES",
  "ANILLOS",
  "CANDONGAS",
  "HERRAJES",
]

export default function InventoryModals(props: {
  openProduct: boolean
  product: Product | null
  warehouses: Warehouse[]
  onClose: () => void
  onSave: (p: Product) => void
  onDelete: (id: string) => void
  openMovement: boolean
  variant: Variant | null
  onRegister: (m: Movement) => void
}) {
  return (
    <>
      {props.openProduct && props.product && <ProductModal {...props} />}
      {props.openMovement && props.variant && <MovementModal {...props} />}
    </>
  )
}

function ProductModal({
  product,
  warehouses,
  onClose,
  onSave,
  onDelete,
}: {
  product: Product
  warehouses: Warehouse[]
  onClose: () => void
  onSave: (p: Product) => void
  onDelete: (id: string) => void
}) {
  const [p, setP] = useState<Product>(product)
  const [hasWarranty, setHasWarranty] = useState<boolean>(false)
  const [warrantyImage, setWarrantyImage] = useState<File | null>(null)
  const [costo, setCosto] = useState<number>(0)
  const [precioVentaDetal, setPrecioVentaDetal] = useState<number>(0)
  const [precioVentaMayor, setPrecioVentaMayor] = useState<number>(0)
  const [showAdditionalMedida, setShowAdditionalMedida] = useState<boolean>(false)

  const updateVariant = (id: string, patch: Partial<Variant>) => {
    setP((prev) => ({ ...prev, variants: prev.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) }))
  }

  const variant = p.variants[0]

  const requiresMedida =
    p.category === "ARETES" ||
    p.category === "CANDONGAS" ||
    p.category === "BALINES" ||
    p.category === "ANILLOS" ||
    p.category === "HERRAJES" ||
    p.category === "DIJES"
  const requiresTamanoGrosor = p.category === "CADENAS" || p.category === "PULSERAS" || p.category === "TOBILLERAS"
  const isManillas = p.category === "MANILLAS"

  const gananciaDetal = precioVentaDetal - costo
  const gananciaMayor = precioVentaMayor - costo

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Producto</div>
          <button className="text-xs text-neutral-500" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Nombre *"
            required
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
          />
          <select
            className="rounded-xl border px-3 py-2"
            value={p.category || ""}
            onChange={(e) => setP({ ...p, category: e.target.value })}
            required
          >
            <option value="">Seleccionar categoría *</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Marca *"
            required
            value={p.brand || ""}
            onChange={(e) => setP({ ...p, brand: e.target.value })}
          />
          <input
            className="col-span-2 rounded-xl border px-3 py-2"
            placeholder="Referencia (SKU) *"
            required
            value={variant.sku}
            onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
          />

          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hasWarranty} onChange={(e) => setHasWarranty(e.target.checked)} />
              <span className="text-sm font-medium">GARANTIA</span>
            </label>
          </div>

          {hasWarranty && (
            <>
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Cantidad *"
                type="number"
                required
                value={(variant as any).warrantyQuantity || ""}
                onChange={(e) =>
                  updateVariant(variant.id, { warrantyQuantity: e.target.value ? +e.target.value : undefined } as any)
                }
              />
              <input
                className="col-span-2 rounded-xl border px-3 py-2"
                placeholder="Motivo de garantía *"
                required
                value={(variant as any).warrantyReason || ""}
                onChange={(e) => updateVariant(variant.id, { warrantyReason: e.target.value } as any)}
              />
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Evidencia (fotografía) *</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  className="w-full rounded-xl border px-3 py-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setWarrantyImage(file)
                      updateVariant(variant.id, { warrantyImage: file.name } as any)
                    }
                  }}
                />
                {warrantyImage && (
                  <p className="mt-1 text-xs text-neutral-600">Archivo seleccionado: {warrantyImage.name}</p>
                )}
              </div>
            </>
          )}

          {!hasWarranty && (
            <>
              <input
                className="col-span-2 rounded-xl border px-3 py-2"
                placeholder="Cantidad a agregar *"
                type="number"
                required
                value={(variant as any).initialQuantity || ""}
                onChange={(e) =>
                  updateVariant(variant.id, { initialQuantity: e.target.value ? +e.target.value : undefined } as any)
                }
              />
              <input
                className="col-span-2 rounded-xl border px-3 py-2"
                placeholder="COSTO *"
                type="number"
                required
                value={costo || ""}
                onChange={(e) => setCosto(e.target.value ? +e.target.value : 0)}
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="PRECIO DE VENTA DETAL *"
                type="number"
                required
                value={precioVentaDetal || ""}
                onChange={(e) => setPrecioVentaDetal(e.target.value ? +e.target.value : 0)}
              />
              <div className="rounded-xl border px-3 py-2 bg-neutral-50 flex items-center text-neutral-600">
                <span className="text-sm">Ganancia Detal: ${gananciaDetal.toFixed(2)}</span>
              </div>
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="PRECIO DE VENTA MAYOR *"
                type="number"
                required
                value={precioVentaMayor || ""}
                onChange={(e) => setPrecioVentaMayor(e.target.value ? +e.target.value : 0)}
              />
              <div className="rounded-xl border px-3 py-2 bg-neutral-50 flex items-center text-neutral-600">
                <span className="text-sm">Ganancia Mayor: ${gananciaMayor.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {!hasWarranty && requiresMedida && (
          <div className="mt-3">
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Medida (mm) *"
              type="number"
              required
              value={(variant as any).medidaMm || ""}
              onChange={(e) => updateVariant(variant.id, { medidaMm: e.target.value } as any)}
            />
          </div>
        )}

        {!hasWarranty && isManillas && (
          <div className="mt-3 space-y-3">
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Medida del balín (mm) *"
              type="number"
              required
              value={(variant as any).medidaBalinMm || ""}
              onChange={(e) => updateVariant(variant.id, { medidaBalinMm: e.target.value } as any)}
            />
            {showAdditionalMedida && (
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Medida adicional (mm)"
                type="number"
                value={(variant as any).medidaAdicionalMm || ""}
                onChange={(e) => updateVariant(variant.id, { medidaAdicionalMm: e.target.value } as any)}
              />
            )}
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setShowAdditionalMedida(!showAdditionalMedida)}
            >
              {showAdditionalMedida ? "- Quitar medida adicional" : "+ Agregar otra medida (mm)"}
            </button>
          </div>
        )}

        {!hasWarranty && requiresTamanoGrosor && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Tamaño *"
              required
              value={(variant as any).tamano || ""}
              onChange={(e) => updateVariant(variant.id, { tamano: e.target.value } as any)}
            />
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="Grosor *"
              required
              value={(variant as any).grosor || ""}
              onChange={(e) => updateVariant(variant.id, { grosor: e.target.value } as any)}
            />
          </div>
        )}

        {!hasWarranty && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                variant.active ? "bg-green-600 text-white" : "bg-white border border-neutral-300 text-neutral-600"
              }`}
              onClick={() => updateVariant(variant.id, { active: true })}
            >
              Activo
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                !variant.active ? "bg-red-600 text-white" : "bg-white border border-neutral-300 text-neutral-600"
              }`}
              onClick={() => updateVariant(variant.id, { active: false })}
            >
              Desactivado
            </button>
          </div>
        )}

        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => onDelete(p.id)}>
            Eliminar producto
          </button>
          <button className="rounded-xl bg-black px-3 py-2 text-sm text-white" onClick={() => onSave(p)}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function MovementModal({
  variant,
  warehouses,
  onClose,
  onRegister,
}: {
  variant: Variant
  warehouses: Warehouse[]
  onClose: () => void
  onRegister: (m: Movement) => void
}) {
  const [type, setType] = useState<MoveType>("in")
  const [qty, setQty] = useState<number>(1)
  const [fromWh, setFromWh] = useState<string>(warehouses[0].id)
  const [toWh, setToWh] = useState<string>(warehouses[0].id)
  const [unitCost, setUnitCost] = useState<number>(variant.cost)
  const [note, setNote] = useState("")

  const submit = () => {
    const m: Movement = {
      id: "",
      date: new Date().toISOString(),
      sku: variant.sku,
      productId: "NA",
      variantId: variant.id,
      type,
      qty,
      fromWh: type === "out" || type === "transfer" ? fromWh : undefined,
      toWh: type === "in" || type === "adjust" || type === "transfer" ? toWh : undefined,
      unitCost: type === "in" || type === "adjust" ? unitCost : undefined,
      note,
    }
    onRegister(m)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Movimiento — {variant.sku}</div>
          <button className="text-xs text-neutral-500" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded-xl border px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as MoveType)}
          >
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
            <option value="adjust">Ajuste</option>
            <option value="transfer">Transferencia</option>
            <option value="warranty">Garantía</option>
          </select>
          <input
            type="number"
            min={1}
            className="rounded-xl border px-3 py-2"
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
          />
          {(type === "out" || type === "transfer") && (
            <select className="rounded-xl border px-3 py-2" value={fromWh} onChange={(e) => setFromWh(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          {(type === "in" || type === "adjust" || type === "transfer") && (
            <select className="rounded-xl border px-3 py-2" value={toWh} onChange={(e) => setToWh(e.target.value)}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
          {(type === "in" || type === "adjust") && (
            <input
              type="number"
              className="rounded-xl border px-3 py-2"
              placeholder="Costo unitario"
              value={unitCost}
              onChange={(e) => setUnitCost(+e.target.value)}
            />
          )}
        </div>

        <textarea
          className="mt-2 w-full rounded-xl border px-3 py-2"
          rows={3}
          placeholder="Nota…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="mt-3 flex justify-end gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button className="rounded-xl bg-black px-3 py-2 text-sm text-white" onClick={submit}>
            Registrar
          </button>
        </div>
      </div>
    </div>
  )
}
