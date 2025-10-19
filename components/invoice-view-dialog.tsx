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
  invoice_items: Array<{
    description: string
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
          <div ref={printRef} className="invoice-container bg-white p-8">
            {/* Encabezado con logo y tipo de documento */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-5xl font-black tracking-wider text-gray-900">GALLE</h1>
                  <div className="mt-3 text-xs leading-relaxed">
                    <p className="font-bold">COMERCIALIZADORA GALLE18K ORO LAMINADO Y</p>
                    <p className="font-bold">ACCESORIOS SAS</p>
                    <p className="mt-2">
                      <span className="font-semibold">NIT:</span> 901357041-4 RESPONSABLE DE IVA
                    </p>
                    <p className="mt-1">VILLA DEL ROSARIO - NORTE DE SANTANDER</p>
                    <p className="mt-1">
                      <span className="font-semibold">TELÉFONOS:</span> LINEA DETAL: 300 5551856 LINEA MAYOR: 304
                      3676388
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">ORDEN DE VENTA</p>
                  <p className="text-sm font-bold mt-1">No. {invoice.invoice_number || ""}</p>
                  <p className="text-sm mt-1">{formatDate(invoice.issue_date)}</p>
                </div>
              </div>
            </div>

            {/* Garantía y políticas */}
            <div className="text-[9px] leading-tight mb-4 border border-gray-300 p-2">
              <p className="font-semibold">
                GARANTÍA 2 AÑOS POR CAMBIO DE COLOR O DEFECTO DE FABRICA. NO APLICA A MODIFICACIONES O DAÑOS A LA PRENDA
                POR USO
              </p>
            </div>

            {/* Información del cliente */}
            <div className="mb-6 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex">
                  <span className="font-bold text-sm w-24">NOMBRE:</span>
                  <span className="text-sm flex-1 border-b border-gray-400">{invoice.client_name}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-sm w-24">CELULAR:</span>
                  <span className="text-sm flex-1 border-b border-gray-400">{invoice.client_phone || ""}</span>
                </div>
              </div>
              <div className="flex">
                <span className="font-bold text-sm w-24">DIRECCIÓN:</span>
                <span className="text-sm flex-1 border-b border-gray-400">{invoice.client_address || ""}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex">
                  <span className="font-bold text-sm w-24">CÉDULA:</span>
                  <span className="text-sm flex-1 border-b border-gray-400">{invoice.client_nit || ""}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-sm w-24">CIUDAD:</span>
                  <span className="text-sm flex-1 border-b border-gray-400"></span>
                </div>
              </div>
              <div className="flex">
                <span className="font-bold text-sm w-24">ASESORA:</span>
                <span className="text-sm flex-1 border-b border-gray-400">KARLA GARCIA</span>
              </div>
            </div>

            {/* Tabla de productos */}
            <div className="mb-6">
              <table className="w-full border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-black px-2 py-2 text-left text-xs font-bold">REF</th>
                    <th className="border border-black px-2 py-2 text-left text-xs font-bold">DESCRIPCIÓN</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">UND</th>
                    <th className="border border-black px-2 py-2 text-center text-xs font-bold">IVA 13%</th>
                    <th className="border border-black px-2 py-2 text-right text-xs font-bold">PRECIO BASE</th>
                    <th className="border border-black px-2 py-2 text-right text-xs font-bold">PRECIO NETO</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items && Array.isArray(invoice.invoice_items) && invoice.invoice_items.length > 0 ? (
                    invoice.invoice_items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-black px-2 py-2 text-xs">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-xs">{item.description}</td>
                        <td className="border border-black px-2 py-2 text-center text-xs">{item.quantity}</td>
                        <td className="border border-black px-2 py-2 text-center text-xs">
                          {formatCurrency(item.unit_price * item.quantity * (invoice.tax_rate / 100))}
                        </td>
                        <td className="border border-black px-2 py-2 text-right text-xs">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-black px-2 py-2 text-right text-xs font-semibold">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-black px-2 py-8 text-center text-xs text-gray-500">
                        No hay items en esta factura
                      </td>
                    </tr>
                  )}
                  {invoice.invoice_items &&
                    invoice.invoice_items.length < 8 &&
                    Array.from({ length: 8 - invoice.invoice_items.length }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border border-black px-2 py-2 text-xs">&nbsp;</td>
                        <td className="border border-black px-2 py-2 text-xs"></td>
                        <td className="border border-black px-2 py-2 text-xs text-center">-</td>
                        <td className="border border-black px-2 py-2 text-xs text-center">$ -</td>
                        <td className="border border-black px-2 py-2 text-xs text-right">$ -</td>
                        <td className="border border-black px-2 py-2 text-xs text-right">$ -</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Totales y forma de pago */}
            <div className="flex justify-between mb-6">
              <div className="w-1/2">
                <div className="border-2 border-black p-2">
                  <p className="text-xs font-bold">FORMA DE PAGO: CONTRA_ENTREGA.</p>
                </div>
              </div>
              <div className="w-5/12">
                <div className="space-y-1">
                  <div className="flex justify-between border-b border-black pb-1">
                    <span className="text-sm font-bold">SUBTOTAL</span>
                    <span className="text-sm font-bold">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between border-b border-black pb-1">
                    <span className="text-sm font-bold">IMPUESTOS</span>
                    <span className="text-sm font-bold">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-b-2 border-black pb-1 pt-1">
                    <span className="text-sm font-bold">TOTAL NETO</span>
                    <span className="text-sm font-bold">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="text-center mb-4">
              <p className="text-xs font-semibold">Síguenos en Instagram @galleorolaminado18k</p>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="border-t-2 border-black pt-1 mt-12">
                  <p className="text-xs font-bold">FIRMA ASESORA</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-1 mt-12">
                  <p className="text-xs font-bold">FIRMA AUDITOR</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-1 mt-12">
                  <p className="text-xs font-bold">FIRMA SUPERVISOR</p>
                </div>
              </div>
            </div>

            {/* Nota legal */}
            <div className="text-[8px] leading-tight text-center border-t border-gray-300 pt-2">
              <p className="font-semibold">
                RECUERDA NO APLICAR RETENCIÓN EN LA FUENTE YA QUE SOMOS BENEFICIARIOS SEZE
              </p>
              <p className="mt-1">SI DESEAS APLICAR RETENCIÓN EN LA FUENTE COMUNICATE CON TU ASESORA</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
