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
  price_retail: number
  price_wholesale: number
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
    description: "",
    category: "CADENAS",
    cost: 0,
    price_retail: 0,
    price_wholesale: 0,
    stock: 0,
    stock_warranty: 0,
    min_stock: 0,
    max_stock: 0,
    status: "active",
    tamano: "",
    grosor: "",
    medida_mm: ""
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
    // Solo actualizar el valor en el estado
    handleItemChange(index, "reference", reference)
  }

  const handleReferenceBlurOrEnter = (index: number, reference: string) => {
    // Buscar el producto en el inventario cuando se termina de escribir
    if (!reference.trim()) return
    
    const product = inventoryProducts.find(p => p.sku.toLowerCase() === reference.toLowerCase())
    
    if (product) {
      // Si se encuentra, autocompletar nombre y precio
      handleItemChange(index, "description", product.name)
      // Usar price_retail si existe, sino price_wholesale, sino price (legacy)
      const precio = product.price_retail || product.price_wholesale || product.price || 0
      handleItemChange(index, "unit_price", precio)
    } else {
      // Si no se encuentra, preparar para crear producto
      setNewProductIndex(index)
      setNewProduct({
        sku: reference,
        name: "",
        description: "",
        category: "CADENAS",
        cost: 0,
        price_retail: 0,
        price_wholesale: 0,
        stock: 0,
        stock_warranty: 0,
        min_stock: 0,
        max_stock: 0,
        status: "active",
        tamano: "",
        grosor: "",
        medida_mm: ""
      })
      setShowCreateProductDialog(true)
    }
  }

  const handleCreateProduct = async () => {
    if (authCode !== "1430") {
      alert("❌ Código de autorización incorrecto. Solo administradores pueden crear productos.")
      return
    }

    // Validaciones
    if (!newProduct.name.trim()) {
      alert("⚠️ El nombre del producto es obligatorio")
      return
    }

    // Para BALINES/BALINERIA solo se valida precio mayor
    const isBalineria = newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA'

    if (isBalineria) {
      if (newProduct.price_wholesale <= 0) {
        alert("⚠️ El precio mayor debe ser mayor a 0 para BALINES/BALINERIA")
        return
      }
    } else {
      if (newProduct.price_retail <= 0) {
        alert("⚠️ El precio detal debe ser mayor a 0")
        return
      }
    }

    // Validar campos de medidas según categoría
    const categoriesWithTamanoGrosor = ['CADENAS', 'PULSERAS', 'TOBILLERAS']
    const categoriesWithMedidaMM = ['ARETES', 'DIJES', 'MANILLAS', 'BALINES', 'BALINERIA', 'ANILLOS', 'CANDONGAS', 'HERRAJES']

    if (categoriesWithTamanoGrosor.includes(newProduct.category)) {
      if (!newProduct.tamano.trim() || !newProduct.grosor.trim()) {
        alert(`⚠️ Los campos Tamaño y Grosor son obligatorios para ${newProduct.category}`)
        return
      }
    }

    if (categoriesWithMedidaMM.includes(newProduct.category)) {
      if (!newProduct.medida_mm.trim()) {
        alert(`⚠️ El campo Medida (MM) es obligatorio para ${newProduct.category}`)
        return
      }
    }

    try {
      const response = await fetch("/api/inventory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      })

      if (response.ok) {
        const createdProduct = await response.json()

        // Autocompletar el item actual con los datos correctos
        if (newProductIndex !== null) {
          handleItemChange(newProductIndex, "description", newProduct.name)
          // Usar precio detal si existe, sino precio mayor
          const precio = isBalineria ? newProduct.price_wholesale : newProduct.price_retail
          handleItemChange(newProductIndex, "unit_price", precio)
        }

        // Recargar productos del inventario
        await fetchInventoryProducts()

        // Cerrar diálogo y resetear
        setShowCreateProductDialog(false)
        setAuthCode("")
        setNewProductIndex(null)
        setNewProduct({
          sku: "",
          name: "",
          description: "",
          category: "CADENAS",
          cost: 0,
          price_retail: 0,
          price_wholesale: 0,
          stock: 0,
          stock_warranty: 0,
          min_stock: 0,
          max_stock: 0,
          status: "active",
          tamano: "",
          grosor: "",
          medida_mm: ""
        })
        
        alert("✅ Producto creado y agregado a la factura exitosamente")
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

    // Validaciones antes de enviar
    if (!formData.client_name.trim()) {
      alert("⚠️ El nombre del cliente es obligatorio")
      return
    }

    if (!formData.ciudad.trim()) {
      alert("⚠️ La ciudad es obligatoria")
      return
    }

    if (!formData.barrio.trim()) {
      alert("⚠️ El barrio es obligatorio")
      return
    }

    if (!formData.guia.trim()) {
      alert("⚠️ El número de guía es obligatorio")
      return
    }

    if (!formData.transportadora) {
      alert("⚠️ La transportadora es obligatoria")
      return
    }

    if (items.length === 0 || !items[0].description) {
      alert("⚠️ Debe agregar al menos un producto")
      return
    }

    if (items.some(item => !item.unit_price || item.unit_price <= 0)) {
      alert("⚠️ Todos los productos deben tener un precio válido")
      return
    }

    setIsLoading(true)

    try {
      let initialStatus = "PENDIENTE PAGO"
      if (formData.payment_method === "efectivo" || formData.payment_method === "transferencia") {
        initialStatus = "PAGADO"
      }

      console.log("[Factura] Enviando datos:", {
        ...formData,
        items,
        tax_rate: 19,
        status: initialStatus,
      })

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

      const data = await response.json()
      console.log("[Factura] Respuesta:", data)

      if (response.ok) {
        alert("✅ Factura creada exitosamente")
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
      } else {
        alert(`❌ Error al crear factura: ${data.error || "Error desconocido"}`)
        console.error("[Factura] Error:", data)
      }
    } catch (error: any) {
      console.error("[v0] Error creating invoice:", error)
      alert(`❌ Error al crear factura: ${error.message}`)
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

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client_name" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Nombre del Cliente *
                </Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                  placeholder="Nombre completo"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="client_nit" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  NIT / Cédula
                </Label>
                <Input
                  id="client_nit"
                  value={formData.client_nit}
                  onChange={(e) => setFormData({ ...formData, client_nit: e.target.value })}
                  placeholder="1234567890"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="client_email" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Email
                </Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="client_phone" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Teléfono
                </Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="+57 300 1234567"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="client_address" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Dirección
                </Label>
                <Input
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                  placeholder="Calle 1 # 2-3, Barrio Centro"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="ciudad" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Ciudad *
                </Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  required
                  placeholder="Ej: Cúcuta"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="barrio" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Barrio *
                </Label>
                <Input
                  id="barrio"
                  value={formData.barrio}
                  onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                  required
                  placeholder="Ej: Centro"
                  className="mt-1 text-xs h-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Información de Envío</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="guia" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Número de Guía *
                </Label>
                <Input
                  id="guia"
                  value={formData.guia}
                  onChange={(e) => setFormData({ ...formData, guia: e.target.value })}
                  required
                  placeholder="Ej: 58048080554"
                  className="mt-1 text-xs h-9 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="transportadora" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Transportadora *
                </Label>
                <Select
                  value={formData.transportadora}
                  onValueChange={(value) => setFormData({ ...formData, transportadora: value })}
                  required
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Seleccionar" />
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
                <Label htmlFor="vendedor" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Vendedor
                </Label>
                <Input
                  id="vendedor"
                  value={formData.vendedor}
                  onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                  placeholder="Nombre del vendedor"
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label htmlFor="evidencia" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Evidencia (URL)
                </Label>
                <Input
                  id="evidencia"
                  value={formData.evidencia}
                  onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 text-xs h-9"
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
                <div key={index} className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    {/* Referencia/SKU */}
                    <div className="col-span-2">
                      <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Ref/SKU *</Label>
                      <div className="relative mt-1">
                        <Input
                          placeholder="04-24"
                          value={item.reference}
                          onChange={(e) => handleReferenceSearch(index, e.target.value)}
                          onBlur={(e) => handleReferenceBlurOrEnter(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleReferenceBlurOrEnter(index, item.reference)
                            }
                          }}
                          required
                          className="pr-7 text-xs h-9 font-mono"
                        />
                        <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="text-[9px] text-gray-500 mt-0.5">Enter para buscar</p>
                    </div>

                    {/* Nombre del Producto */}
                    <div className="col-span-5">
                      <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Nombre del Producto *</Label>
                      <Input
                        placeholder="Ej: Cadena de Oro 18K"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        required
                        className="mt-1 text-xs h-9"
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-1">
                      <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Cant. *</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        required
                        className="mt-1 text-center text-xs h-9 font-semibold"
                      />
                    </div>

                    {/* Precio Unitario - MUCHO MÁS GRANDE */}
                    <div className="col-span-3">
                      <Label className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Precio Unitario *</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-2.5 top-2 text-gray-500 text-xs font-semibold">$</span>
                        <Input
                          type="text"
                          placeholder="155.000"
                          value={item.unit_price > 0 ? item.unit_price.toLocaleString('es-CO') : ''}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/\D/g, '')
                            handleItemChange(index, "unit_price", Number(numericValue))
                          }}
                          required
                          className="pl-6 pr-2 text-sm h-9 font-bold text-amber-700 text-right"
                        />
                      </div>
                    </div>

                    {/* Botón Eliminar */}
                    {items.length > 1 && (
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-end pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold">Subtotal:</span>{" "}
                      <span className="text-sm font-bold text-amber-600">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                    </div>
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

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Detalles de Pago</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Solo mostrar fecha de vencimiento para contraentrega (crédito) */}
              {formData.payment_method === 'contraentrega' && (
                <div>
                  <Label htmlFor="due_date" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Fecha de Vencimiento *
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    className="mt-1 text-xs h-9"
                  />
                  <p className="text-[9px] text-gray-500 mt-0.5">Fecha límite de pago</p>
                </div>
              )}
              <div className={formData.payment_method === 'contraentrega' ? '' : 'col-span-2'}>
                <Label htmlFor="payment_method" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Método de Pago
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value, due_date: value === 'contraentrega' ? formData.due_date : '' })}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo (Pago Inmediato)</SelectItem>
                    <SelectItem value="transferencia">Transferencia (Pago Inmediato)</SelectItem>
                    <SelectItem value="contraentrega">Contraentrega (Crédito)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.payment_method && (formData.payment_method === 'efectivo' || formData.payment_method === 'transferencia') && (
                  <p className="text-[9px] text-green-600 mt-0.5">✓ Pago inmediato - No requiere fecha de vencimiento</p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes" className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 text-xs min-h-[60px]"
                  rows={2}
                  placeholder="Observaciones adicionales..."
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
                      disabled
                      className="mt-1 bg-gray-100 font-mono text-sm h-11"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="new_category" className="text-sm font-semibold text-gray-900">
                      Categoría *
                    </Label>
                    <select
                      id="new_category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="mt-1 h-11 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="CADENAS">CADENAS</option>
                      <option value="ARETES">ARETES</option>
                      <option value="DIJES">DIJES</option>
                      <option value="PULSERAS">PULSERAS</option>
                      <option value="TOBILLERAS">TOBILLERAS</option>
                      <option value="MANILLAS">MANILLAS</option>
                      <option value="BALINES">BALINES</option>
                      <option value="BALINERIA">BALINERIA</option>
                      <option value="ANILLOS">ANILLOS</option>
                      <option value="CANDONGAS">CANDONGAS</option>
                      <option value="HERRAJES">HERRAJES</option>
                    </select>
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
                    placeholder="Ej: Cadena de Oro 18K"
                    className="mt-1 h-11 text-base"
                  />
                </div>

                {/* Fila 3: Descripción */}
                <div>
                  <Label htmlFor="new_description" className="text-sm font-semibold text-gray-900">
                    Descripción
                  </Label>
                  <Input
                    id="new_description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Descripción detallada del producto"
                    className="mt-1 h-11"
                  />
                </div>

                {/* Fila 4: Medidas según categoría */}
                {(newProduct.category === 'CADENAS' || newProduct.category === 'PULSERAS' || newProduct.category === 'TOBILLERAS') && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <Label htmlFor="new_tamano" className="text-sm font-semibold text-blue-900">
                        Tamaño * (ej: 40cm, 18", 50cm)
                      </Label>
                      <Input
                        id="new_tamano"
                        value={newProduct.tamano}
                        onChange={(e) => setNewProduct({ ...newProduct, tamano: e.target.value })}
                        placeholder="Ej: 50cm"
                        className="mt-1 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new_grosor" className="text-sm font-semibold text-blue-900">
                        Grosor * (ej: 2mm, 3mm, fino, mediano, grueso)
                      </Label>
                      <Input
                        id="new_grosor"
                        value={newProduct.grosor}
                        onChange={(e) => setNewProduct({ ...newProduct, grosor: e.target.value })}
                        placeholder="Ej: 3mm"
                        className="mt-1 h-11"
                      />
                    </div>
                  </div>
                )}

                {(newProduct.category === 'ARETES' || newProduct.category === 'DIJES' || newProduct.category === 'MANILLAS' || 
                  newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA' || newProduct.category === 'ANILLOS' ||
                  newProduct.category === 'CANDONGAS' || newProduct.category === 'HERRAJES') && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <Label htmlFor="new_medida_mm" className="text-sm font-semibold text-purple-900">
                      Medida en MM * (ej: 5mm, 8mm, 10mm)
                    </Label>
                    <Input
                      id="new_medida_mm"
                      value={newProduct.medida_mm}
                      onChange={(e) => setNewProduct({ ...newProduct, medida_mm: e.target.value })}
                      placeholder="Ej: 8mm"
                      className="mt-1 h-11"
                    />
                  </div>
                )}

                {/* Fila 5: Costos y Precios */}
                <div className={`grid gap-4 ${newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA' ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
                    <p className="text-xs text-gray-500 mt-1">Costo de producción</p>
                  </div>

                  {/* Precio Detal - Solo si NO es BALINES/BALINERIA */}
                  {newProduct.category !== 'BALINES' && newProduct.category !== 'BALINERIA' && (
                    <div>
                      <Label htmlFor="new_price_retail" className="text-sm font-semibold text-gray-900">
                        Precio Detal *
                      </Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-3 text-amber-600 font-bold text-lg">$</span>
                        <Input
                          id="new_price_retail"
                          type="number"
                          min="0"
                          step="1000"
                          value={newProduct.price_retail}
                          onChange={(e) => setNewProduct({ ...newProduct, price_retail: Number(e.target.value) })}
                          placeholder="0"
                          className="pl-8 h-11 text-base font-bold text-amber-600 border-amber-300 focus:border-amber-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Precio al público</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="new_price_wholesale" className="text-sm font-semibold text-gray-900">
                      Precio Mayor {(newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA') && '*'}
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-green-600 font-semibold">$</span>
                      <Input
                        id="new_price_wholesale"
                        type="number"
                        min="0"
                        step="1000"
                        value={newProduct.price_wholesale}
                        onChange={(e) => setNewProduct({ ...newProduct, price_wholesale: Number(e.target.value) })}
                        placeholder="0"
                        className="pl-7 h-11 text-base font-semibold text-green-600"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA') ? 'Único precio de venta' : 'Precio mayorista'}
                    </p>
                  </div>
                </div>

                {/* Fila 6: Stock */}
                <div className="grid grid-cols-4 gap-4">
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
                  </div>

                  <div>
                    <Label htmlFor="new_stock_warranty" className="text-sm font-semibold text-gray-900">
                      Stock Garantía
                    </Label>
                    <Input
                      id="new_stock_warranty"
                      type="number"
                      min="0"
                      value={newProduct.stock_warranty}
                      onChange={(e) => setNewProduct({ ...newProduct, stock_warranty: Number(e.target.value) })}
                      placeholder="0"
                      className="mt-1 h-11 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_min_stock" className="text-sm font-semibold text-gray-900">
                      Stock Mínimo
                    </Label>
                    <Input
                      id="new_min_stock"
                      type="number"
                      min="0"
                      value={newProduct.min_stock}
                      onChange={(e) => setNewProduct({ ...newProduct, min_stock: Number(e.target.value) })}
                      placeholder="0"
                      className="mt-1 h-11 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_max_stock" className="text-sm font-semibold text-gray-900">
                      Stock Máximo
                    </Label>
                    <Input
                      id="new_max_stock"
                      type="number"
                      min="0"
                      value={newProduct.max_stock}
                      onChange={(e) => setNewProduct({ ...newProduct, max_stock: Number(e.target.value) })}
                      placeholder="0"
                      className="mt-1 h-11 text-base"
                    />
                  </div>
                </div>

                {/* Vista previa de valores */}
                {newProduct.price_retail > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">Vista Previa de Utilidades:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Utilidad Detal:</span>
                        <p className="font-bold text-green-600">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(newProduct.price_retail - newProduct.cost)}
                          {newProduct.cost > 0 && ` (${Math.round(((newProduct.price_retail - newProduct.cost) / newProduct.cost) * 100)}%)`}
                        </p>
                      </div>
                      {newProduct.price_wholesale > 0 && (
                        <div>
                          <span className="text-gray-600">Utilidad Mayor:</span>
                          <p className="font-bold text-green-600">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(newProduct.price_wholesale - newProduct.cost)}
                            {newProduct.cost > 0 && ` (${Math.round(((newProduct.price_wholesale - newProduct.cost) / newProduct.cost) * 100)}%)`}
                          </p>
                        </div>
                      )}
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
                  setNewProduct({
                    sku: "",
                    name: "",
                    description: "",
                    category: "CADENAS",
                    cost: 0,
                    price_retail: 0,
                    price_wholesale: 0,
                    stock: 0,
                    stock_warranty: 0,
                    min_stock: 0,
                    max_stock: 0,
                    status: "active",
                    tamano: "",
                    grosor: "",
                    medida_mm: ""
                  })
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateProduct}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6"
                disabled={
                  authCode !== "1430" ||
                  !newProduct.name ||
                  !newProduct.sku ||
                  ((newProduct.category === 'BALINES' || newProduct.category === 'BALINERIA')
                    ? newProduct.price_wholesale <= 0
                    : newProduct.price_retail <= 0)
                }
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

