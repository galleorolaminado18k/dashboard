"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, Loader2, Download } from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_nit?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  issue_date: string
  due_date?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: string
  payment_method?: string
  notes?: string
  shipping_cost?: number
  invoice_items: Array<{
    description: string
    reference?: string
    quantity: number
    unit_price: number
    total: number
  }>
}

interface InvoiceViewDialogProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function InvoiceViewDialog({ invoice, open, onOpenChange, onRefresh }: InvoiceViewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Debug: ver el valor de shipping_cost
  console.log('[InvoiceViewDialog] Invoice data:', {
    invoice_number: invoice?.invoice_number,
    shipping_cost: invoice?.shipping_cost,
    shipping_cost_type: typeof invoice?.shipping_cost
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return ""
    }
  }

  const getInvoiceNumber = (invoiceNumber?: string) => {
    return invoiceNumber || ""
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "", "width=800,height=600")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${invoice?.invoice_number || ""}</title>
          <style>
            @page { margin: 15mm; size: letter; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            .invoice-container { 
              max-width: 210mm; 
              margin: 0 auto; 
              background: white;
              padding: 10mm;
            }
            
            /* Encabezado */
            .border-b-2 { border-bottom: 2px solid #000; }
            .border-black { border-color: #000; }
            .pb-4 { padding-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-12 { margin-top: 3rem; }
            .pt-1 { padding-top: 0.25rem; }
            .pt-2 { padding-top: 0.5rem; }
            
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .text-5xl { font-size: 3rem; line-height: 1; }
            .font-black { font-weight: 900; }
            .tracking-wider { letter-spacing: 0.05em; }
            .text-gray-900 { color: #111827; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .leading-relaxed { line-height: 1.625; }
            .leading-tight { line-height: 1.25; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            
            /* Garantía */
            .border { border: 1px solid; }
            .border-gray-300 { border-color: #d1d5db; }
            .p-2 { padding: 0.5rem; }
            
            /* Cliente */
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .w-24 { width: 6rem; }
            .w-1\\/2 { width: 50%; }
            .w-5\\/12 { width: 41.666667%; }
            .flex-1 { flex: 1 1 0%; }
            .border-b { border-bottom-width: 1px; }
            .border-b-2 { border-bottom-width: 2px; }
            .border-t { border-top-width: 1px; }
            .border-t-2 { border-top-width: 2px; }
            .border-gray-400 { border-color: #9ca3af; }
            
            /* Tabla */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              border: 2px solid #000;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 0.5rem; 
            }
            th { 
              background: white; 
              font-weight: 700;
            }
            .text-gray-500 { color: #6b7280; }
            .bg-neutral-50 { background-color: #fafafa; }
            
            /* Totales */
            .pb-1 { padding-bottom: 0.25rem; }
            
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleGeneratePDF = async () => {
    if (!invoice?.invoice_number) return

    setIsGeneratingPDF(true)
    try {
      const response = await fetch("/api/invoices/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber: invoice.invoice_number,
        }),
      })

      if (!response.ok) {
        throw new Error("Error generando PDF")
      }

      const data = await response.json()

      // Abrir el PDF en una nueva pestaña
      if (data.url) {
        window.open(data.url, "_blank")
      }

      // Refrescar los datos para mostrar la URL del PDF
      onRefresh()
    } catch (error) {
      console.error("Error generando PDF:", error)
      alert("Error al generar el PDF de la factura")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      paid: "PAGADA",
      pending: "PENDIENTE",
      overdue: "VENCIDA",
      cancelled: "CANCELADA",
    }
    return labels[status as keyof typeof labels] || "PENDIENTE"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      paid: "bg-green-100 text-green-800 border-green-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      overdue: "bg-red-100 text-red-800 border-red-300",
      cancelled: "bg-gray-100 text-gray-800 border-gray-300",
    }
    return colors[status as keyof typeof colors] || "bg-yellow-100 text-yellow-800 border-yellow-300"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogDescription className="sr-only">
          Vista detallada de la factura con información del cliente, productos y totales
        </DialogDescription>

        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-900">Vista de Factura</h2>
          <div className="flex gap-2">
            {invoice && (
              <>
                <Button onClick={handlePrint} size="sm" className="bg-amber-600 hover:bg-amber-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  onClick={handleGeneratePDF}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Guardar PDF
                    </>
                  )}
                </Button>
              </>
            )}
            <Button onClick={() => onOpenChange(false)} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!invoice ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Cargando factura...</p>
            </div>
          </div>
        ) : (
          <div ref={printRef} className="max-w-[600px] mx-auto bg-white rounded-xl shadow-lg p-8 text-sm">
            {/* Encabezado empresa */}
            <div className="text-center border-b-2 border-dashed border-neutral-300 pb-4 mb-4">
              <div className="text-2xl font-bold text-[rgba(216,189,128,1)]">GALLE</div>
              <div className="text-xs mt-1">COMERCIALIZADORA GALLE18K</div>
              <div className="text-xs">ORO LAMINADO Y ACCESORIOS SAS</div>
              <div className="text-xs mt-1">NIT: 901357041-4</div>
              <div className="text-xs">Tel: 300 5551856</div>
            </div>

            {/* Información de la factura */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-[10px]">
              <div className="text-center">
                <div className="font-semibold">FACTURA:</div>
                <div>{invoice.invoice_number}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">FECHA:</div>
                <div>{formatDate(invoice.issue_date)}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">MÉTODO:</div>
                <div>{invoice.payment_method || 'Contraentrega'}</div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 mb-4">
              <div className="font-semibold text-[9px] mb-2 text-center">DATOS DEL CLIENTE</div>
              <div className="text-[9px] space-y-0.5 text-center">
                <div>
                  <span className="font-semibold">Nombre:</span> {invoice.client_name}
                </div>
                {invoice.client_nit && (
                  <div>
                    <span className="font-semibold">NIT:</span> {invoice.client_nit}
                  </div>
                )}
                {invoice.client_phone && (
                  <div>
                    <span className="font-semibold">Teléfono:</span> {invoice.client_phone}
                  </div>
                )}
                {invoice.client_address && (
                  <div>
                    <span className="font-semibold">Dirección:</span> {invoice.client_address}
                  </div>
                )}
              </div>
            </div>

            {/* Items - Formato simple y organizado */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-4 mb-4">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b border-neutral-300">
                    <th className="text-center py-1 text-[8px] font-semibold">SKU</th>
                    <th className="text-center py-1 text-[8px] font-semibold">DESCRIPCIÓN</th>
                    <th className="text-center py-1 text-[8px] font-semibold">CANT</th>
                    <th className="text-center py-1 text-[8px] font-semibold">IVA</th>
                    <th className="text-center py-1 text-[8px] font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items && Array.isArray(invoice.invoice_items) && invoice.invoice_items.length > 0 ? (
                    <>
                      {invoice.invoice_items.map((item, index) => (
                        <tr key={index} className="border-b border-neutral-200">
                          <td className="py-1 text-[9px] text-gray-600 text-center">{item.reference || '-'}</td>
                          <td className="py-1 text-[9px] text-center">{item.description}</td>
                          <td className="text-center py-1 text-[9px]">{item.quantity}</td>
                          <td className="text-center py-1 text-[9px]">19%</td>
                          <td className="text-center py-1 text-[9px] font-semibold">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                      {/* Fila de envío - SIEMPRE SE MUESTRA */}
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <td className="py-1 text-[9px] text-center">-</td>
                        <td className="py-1 text-[9px] font-semibold text-center">COSTO DE ENVÍO</td>
                        <td className="text-center py-1 text-[9px]">1</td>
                        <td className="text-center py-1 text-[9px]">0%</td>
                        <td className="text-center py-1 text-[9px] font-semibold">
                          {formatCurrency(invoice.shipping_cost || 0)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-[9px]">
                        No hay items en esta factura
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totales - Formato organizado */}
            <div className="border-t-2 border-dashed border-neutral-300 pt-3 space-y-1.5 text-[9px] mb-6">
              {(() => {
                // Calcular totales correctamente
                const totalProductosConIVA = invoice.invoice_items?.reduce((sum, item) => sum + item.total, 0) || 0
                const subtotalProductos = totalProductosConIVA / 1.19 // Subtotal sin IVA
                const ivaProductos = totalProductosConIVA - subtotalProductos // IVA de los productos
                const costoEnvio = invoice.shipping_cost || 0 // Envío sin IVA
                const subtotalFinal = subtotalProductos + costoEnvio // Subtotal + Envío (sin IVA)
                const totalFinal = totalProductosConIVA + costoEnvio // Total con IVA + Envío

                return (
                  <>
                    <div className="flex justify-between">
                      <span>SUBTOTAL PRODUCTOS (sin IVA):</span>
                      <span className="font-semibold">{formatCurrency(Math.round(subtotalProductos))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">{formatCurrency(Math.round(ivaProductos))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>COSTO ENVÍO:</span>
                      <span className="font-semibold">{formatCurrency(costoEnvio)}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-300 pt-2">
                      <span>SUBTOTAL FINAL:</span>
                      <span className="font-semibold">{formatCurrency(Math.round(subtotalFinal))}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t-2 border-neutral-300 pt-2 mt-2">
                      <span>TOTAL A PAGAR:</span>
                      <span>{formatCurrency(Math.round(totalFinal))}</span>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Pie */}
            <div className="text-center mt-4 text-[9px] text-neutral-600 border-t-2 border-dashed border-neutral-300 pt-3">
              ¡Gracias por su compra!
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

