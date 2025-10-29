"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Search } from "lucide-react"

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface InvoiceItem {
  description: string
  reference: string
  quantity: number
  unit_price: number
}

interface Sale {
  id: string
  client_name: string
  total: number
  products: string
  invoice_number: string | null
}

interface InventoryProduct {
  id: string
  sku: string
  name: string
  price: number
  cost: number
  stock: number
  category?: string
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [salesWithoutInvoice, setSalesWithoutInvoice] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<string>("")
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([])
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false)
  const [newProductIndex, setNewProductIndex] = useState<number | null>(null)
  const [authCode, setAuthCode] = useState("")
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    price: 0,
    cost: 0,
    stock: 0,
    category: ""
  })
  const [formData, setFormData] = useState({
    client_name: "",
    client_nit: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    ciudad: "",
    barrio: "",
    due_date: "",
    payment_method: "",
    notes: "",
    guia: "",
    transportadora: "",
    vendedor: "",
    evidencia: "",
  })
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", reference: "", quantity: 1, unit_price: 0 }])

  useEffect(() => {
    if (open) {
      fetchSalesWithoutInvoice()
      fetchInventoryProducts()
    }
  }, [open])

  const fetchSalesWithoutInvoice = async () => {
    try {
      const response = await fetch("/api/sales?without_invoice=true")
      if (response.ok) {
        const data = await response.json()
        setSalesWithoutInvoice(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching sales:", error)
    }
  }

  const fetchInventoryProducts = async () => {
    try {
      const response = await fetch("/api/inventory")
      if (response.ok) {
        const data = await response.json()
        setInventoryProducts(data.products || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching inventory:", error)
    }
  }

  const handleReferenceSearch = (index: number, reference: string) => {
    // Actualizar la referencia en el item
    handleItemChange(index, "reference", reference)

    // Buscar el producto en el inventario
    const product = inventoryProducts.find(p => p.sku === reference)

    if (product) {
      // Si se encuentra, autocompletar nombre y precio
      handleItemChange(index, "description", product.name)
      handleItemChange(index, "unit_price", product.price)
    } else if (reference.trim() !== "") {
      // Si no se encuentra y hay una referencia, preparar para crear producto
      setNewProductIndex(index)
      setNewProduct({
        sku: reference,
        name: "",
        price: 0,
        cost: 0,
        stock: 0,
        category: ""
      })
      setShowCreateProductDialog(true)
    }
  }

  const handleCreateProduct = async () => {
    if (authCode !== "1430") {
      alert("❌ Código de autorización incorrecto. Solo administradores pueden crear productos.")
      return
    }

    try {
      const response = await fetch("/api/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newProduct.sku,
          name: newProduct.name,
          price_retail: newProduct.price,
          price: newProduct.price, // Para compatibilidad
          cost: newProduct.cost,
          stock: newProduct.stock,
          category: newProduct.category,
          status: "active"
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Actualizar lista de productos
        await fetchInventoryProducts()

        // Autocompletar el item actual
        if (newProductIndex !== null) {
          handleItemChange(newProductIndex, "description", newProduct.name)
          handleItemChange(newProductIndex, "unit_price", newProduct.price)
        }

        // Cerrar diálogo
        setShowCreateProductDialog(false)
        setAuthCode("")
        setNewProductIndex(null)

        alert("✅ Producto creado exitosamente")
      } else {
        const errorData = await response.json()
        alert(`❌ Error al crear producto: ${errorData.error || "Error desconocido"}`)
      }
    } catch (error: any) {
      alert(`❌ Error al crear producto: ${error.message}`)
    }
  }

  const handleSaleSelect = (saleId: string) => {
    setSelectedSale(saleId)
    const sale = salesWithoutInvoice.find((s) => s.id === saleId)
    if (sale) {
      setFormData({
        ...formData,
        client_name: sale.client_name,
      })
      setItems([{ description: sale.products, reference: "", quantity: 1, unit_price: sale.total / 1.19 }])
    }
  }

  const handleAddItem = () => {
    setItems([...items, { description: "", reference: "", quantity: 1, unit_price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    const totalWithIVA = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    return totalWithIVA / 1.19
  }

  const calculateTax = () => {
    const totalWithIVA = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const subtotal = totalWithIVA / 1.19
    return totalWithIVA - subtotal
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let initialStatus = "PENDIENTE PAGO"
      if (formData.payment_method === "efectivo" || formData.payment_method === "transferencia") {
        initialStatus = "PAGADO"
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          tax_rate: 19,
          status: initialStatus,
          sale_id: selectedSale || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
        setFormData({
          client_name: "",
          client_nit: "",
          client_email: "",
          client_phone: "",
          client_address: "",
          ciudad: "",
          barrio: "",
          due_date: "",
          payment_method: "",
          notes: "",
          guia: "",
          transportadora: "",
          vendedor: "",
          evidencia: "",
        })
        setItems([{ description: "", reference: "", quantity: 1, unit_price: 0 }])
        setSelectedSale("")
      }
    } catch (error) {
      console.error("[v0] Error creating invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-600">Nueva Factura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {salesWithoutInvoice.length > 0 && (
            <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Label htmlFor="sale_select">Vincular con Venta Existente (Opcional)</Label>
              <Select value={selectedSale} onValueChange={handleSaleSelect}>
                <SelectTrigger id="sale_select">
                  <SelectValue placeholder="Seleccionar venta sin factura" />
                </SelectTrigger>
                <SelectContent>
                  {salesWithoutInvoice.map((sale) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.id} - {sale.client_name} - ${sale.total.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Selecciona una venta para vincularla automáticamente con esta factura
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Nombre del Cliente *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_nit">NIT / Cédula</Label>
                <Input
                  id="client_nit"
                  value={formData.client_nit}
                  onChange={(e) => setFormData({ ...formData, client_nit: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_email">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client_phone">Teléfono</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="client_address">Dirección</Label>
                <Input
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                  placeholder="Ej: Cúcuta"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="barrio">Barrio *</Label>
                <Input
                  id="barrio"
                  value={formData.barrio}
                  onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                  required
                  placeholder="Ej: Centro"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información de Envío</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guia">Número de Guía *</Label>
                <Input
                  id="guia"
                  value={formData.guia}
                  onChange={(e) => setFormData({ ...formData, guia: e.target.value })}
                  required
                  placeholder="Ej: GUIA-2025-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="transportadora">Transportadora *</Label>
                <Select
                  value={formData.transportadora}
                  onValueChange={(value) => setFormData({ ...formData, transportadora: value })}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Servientrega">Servientrega</SelectItem>
                    <SelectItem value="Coordinadora">Coordinadora</SelectItem>
                    <SelectItem value="Interrapidisimo">Interrapidísimo</SelectItem>
                    <SelectItem value="Deprisa">Deprisa</SelectItem>
                    <SelectItem value="TCC">TCC</SelectItem>
                    <SelectItem value="Envía">Envía</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vendedor">Vendedor</Label>
                <Input
                  id="vendedor"
                  value={formData.vendedor}
                  onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                  placeholder="Nombre del vendedor"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="evidencia">Evidencia (URL)</Label>
                <Input
                  id="evidencia"
                  value={formData.evidencia}
                  onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
                  placeholder="URL de evidencia de entrega"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Items</h3>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-3">
                    {/* Referencia/SKU - Mediano */}
                    <div className="col-span-3">
                      <Label className="text-xs font-semibold text-gray-700">Referencia/SKU *</Label>
                      <div className="relative mt-1">
                        <Input
                          placeholder="Ej: ORO-ANI-001"
                          value={item.reference}
                          onChange={(e) => handleReferenceSearch(index, e.target.value)}
                          required
                          className="pr-8"
                        />
                        <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Nombre del Producto - Grande */}
                    <div className="col-span-5">
                      <Label className="text-xs font-semibold text-gray-700">Nombre del Producto *</Label>
                      <Input
                        placeholder="Ej: Anillo de Oro 18K"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-gray-700">Cantidad *</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        required
                        className="mt-1"
                      />
                    </div>

                    {/* Precio Unitario */}
                    <div className="col-span-2">
                      <Label className="text-xs font-semibold text-gray-700">Precio Unit. *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Subtotal:</span> {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal (sin IVA):</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">IVA (19%):</span>
                <span className="font-semibold">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-amber-300 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-amber-600">{formatCurrency(calculateTotal())}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">* Los precios de los productos ya incluyen IVA</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detalles de Pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="contraentrega">Contraentrega (Crédito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Factura"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Diálogo para crear nuevo producto */}
      <Dialog open={showCreateProductDialog} onOpenChange={setShowCreateProductDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-600">
              Crear Nuevo Producto en Inventario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Alerta de autorización */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Solo administradores pueden crear productos.</strong> Ingrese el código de autorización para continuar.
              </p>
            </div>

            {/* Código de autorización */}
            <div className="space-y-2">
              <Label htmlFor="auth_code" className="text-base font-semibold text-gray-900">
                Código de Autorización *
              </Label>
              <Input
                id="auth_code"
                type="password"
                placeholder="••••"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="text-center text-2xl tracking-widest font-bold h-14"
                maxLength={4}
              />
              {authCode === "1430" ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">✓ Bienvenido Administrador</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Ingrese el código de 4 dígitos</p>
              )}
            </div>

            {/* Campos del producto - Solo visibles si el código es correcto */}
            {authCode === "1430" && (
              <div className="space-y-5 pt-4 border-t-2 border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900">Datos del Producto</h3>

                {/* Fila 1: SKU y Categoría */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new_sku" className="text-sm font-semibold text-gray-900">
                      SKU / Referencia *
                    </Label>
                    <Input
                      id="new_sku"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="Ej: ORO-ANI-001"
                      disabled
                      className="mt-1 bg-gray-100 font-mono text-sm h-11"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="new_category" className="text-sm font-semibold text-gray-900">
                      Categoría
                    </Label>
                    <Input
                      id="new_category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="Ej: Joyería"
                      className="mt-1 h-11"
                    />
                  </div>
                </div>

                {/* Fila 2: Nombre del Producto */}
                <div>
                  <Label htmlFor="new_name" className="text-sm font-semibold text-gray-900">
                    Nombre del Producto *
                  </Label>
                  <Input
                    id="new_name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ej: Anillo de Oro 18K con Diamantes"
                    className="mt-1 h-11 text-base"
                  />
                </div>

                {/* Fila 3: Costo, Precio y Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="new_cost" className="text-sm font-semibold text-gray-900">
                      Costo Unitario
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500 font-semibold">$</span>
                      <Input
                        id="new_cost"
                        type="number"
                        min="0"
                        step="1000"
                        value={newProduct.cost}
                        onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })}
                        placeholder="0"
                        className="pl-7 h-11 text-base font-semibold"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ej: 5000000</p>
                  </div>

                  <div>
                    <Label htmlFor="new_price" className="text-sm font-semibold text-gray-900">
                      Precio de Venta *
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-amber-600 font-bold text-lg">$</span>
                      <Input
                        id="new_price"
                        type="number"
                        min="0"
                        step="1000"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                        placeholder="0"
                        className="pl-8 h-11 text-base font-bold text-amber-600 border-amber-300 focus:border-amber-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ej: 10000000</p>
                  </div>

                  <div>
                    <Label htmlFor="new_stock" className="text-sm font-semibold text-gray-900">
                      Stock Inicial
                    </Label>
                    <Input
                      id="new_stock"
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                      placeholder="0"
                      className="mt-1 h-11 text-base font-semibold"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unidades</p>
                  </div>
                </div>

                {/* Vista previa de valores */}
                {newProduct.price > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">Vista Previa:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Costo:</span>
                        <p className="font-bold text-gray-900">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(newProduct.cost)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio Venta:</span>
                        <p className="font-bold text-amber-600 text-lg">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(newProduct.price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Utilidad:</span>
                        <p className="font-bold text-green-600">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(newProduct.price - newProduct.cost)}
                          {newProduct.cost > 0 && ` (${Math.round(((newProduct.price - newProduct.cost) / newProduct.cost) * 100)}%)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateProductDialog(false)
                  setAuthCode("")
                  setNewProductIndex(null)
                  setNewProduct({ sku: "", name: "", price: 0, cost: 0, stock: 0, category: "" })
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateProduct}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6"
                disabled={authCode !== "1430" || !newProduct.name || !newProduct.sku || newProduct.price <= 0}
              >
                {authCode !== "1430" ? "Ingrese Código Primero" : "Crear Producto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
