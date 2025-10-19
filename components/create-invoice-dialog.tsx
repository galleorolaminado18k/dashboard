"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

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

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [salesWithoutInvoice, setSalesWithoutInvoice] = useState<Sale[]>([])
  const [selectedSale, setSelectedSale] = useState<string>("")
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
  })
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", reference: "", quantity: 1, unit_price: 0 }])

  useEffect(() => {
    if (open) {
      fetchSalesWithoutInvoice()
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
                <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-[3]">
                    <Input
                      placeholder="Nombre del producto (Ej: BALINERIA)"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Referencia"
                      value={item.reference}
                      onChange={(e) => handleItemChange(index, "reference", e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Cant."
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      placeholder="Precio"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="w-32 flex items-center justify-end font-semibold text-sm">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
    </Dialog>
  )
}
