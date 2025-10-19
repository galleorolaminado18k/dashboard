"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Printer, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InvoiceViewDialog } from "@/components/invoice-view-dialog"

interface Invoice {
  invoice_number: string
  client_name: string
  client_nit?: string
  issue_date: string
  due_date?: string
  subtotal: number
  tax_amount: number
  total: number
  status: "ENTREGADO" | "PENDIENTE PAGO" | "PAGADO"
  payment_method?: string
  guia?: string
  transportadora?: string
  ciudad?: string
  barrio?: string
  invoice_items: Array<{
    description: string
    reference?: string
    quantity: number
    unit_price: number
    total: number
  }>
}

interface InvoicesTableProps {
  invoices: Invoice[]
  onRefresh: () => void
}

export function InvoicesTable({ invoices, onRefresh }: InvoicesTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAGADO: { label: "Pagado", className: "bg-green-100 text-green-800 border-green-300" },
      "PENDIENTE PAGO": { label: "Pendiente Pago", className: "bg-orange-100 text-orange-800 border-orange-300" },
      ENTREGADO: { label: "Entregado", className: "bg-blue-100 text-blue-800 border-blue-300" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["PENDIENTE PAGO"]

    return (
      <Badge variant="outline" className={`${config.className} font-medium text-[10px] px-1.5 py-0.5`}>
        {config.label}
      </Badge>
    )
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
    // El diálogo manejará la impresión
  }

  const handleUpdateStatus = async (invoiceNumber: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          payment_date: newStatus === "PAGADO" ? new Date().toISOString() : null,
        }),
      })

      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error("[v0] Error updating invoice status:", error)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Número
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Cliente
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Guía
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Transp.
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Ciudad
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Emisión
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Venc.
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Subtotal
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  IVA
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Total
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Estado
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Método
                </th>
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.invoice_number} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 text-center text-[10px] font-semibold text-amber-600 whitespace-nowrap">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="text-[10px] font-medium text-gray-900">{invoice.client_name}</div>
                    {invoice.client_nit && <div className="text-[9px] text-gray-500">NIT: {invoice.client_nit}</div>}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700 whitespace-nowrap">
                    {invoice.guia || "-"}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700">{invoice.transportadora || "-"}</td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700">{invoice.ciudad || "-"}</td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700 whitespace-nowrap">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700 whitespace-nowrap">
                    {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 whitespace-nowrap">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700 whitespace-nowrap">
                    {formatCurrency(invoice.tax_amount)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-900 whitespace-nowrap">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-2 py-2 text-center">{getStatusBadge(invoice.status)}</td>
                  <td className="px-2 py-2 text-center text-[10px] text-gray-700 capitalize">
                    {invoice.payment_method || "-"}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        className="h-7 w-7 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        className="h-7 w-7 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-600 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.invoice_number, "PAGADO")}>
                            Marcar como pagado
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(invoice.invoice_number, "PENDIENTE PAGO")}
                          >
                            Marcar como pendiente pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.invoice_number, "ENTREGADO")}>
                            Marcar como entregado
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No se encontraron facturas</p>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <InvoiceViewDialog
          invoice={selectedInvoice}
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}
