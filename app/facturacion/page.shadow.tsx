"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { InvoicesTable } from "@/components/invoices-table"
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, RefreshCw, Search, AlertCircle } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type FilterType = "all" | "PAGADO" | "PENDIENTE" | "DEVOLUCION"

const getMonthNames = () => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthNames = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ]

  // Mes actual
  const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`

  // Mes anterior
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const previousMonthName = `${monthNames[previousMonth]} ${previousYear}`

  // Hace 2 meses
  const twoMonthsAgo = currentMonth === 0 ? 10 : currentMonth === 1 ? 11 : currentMonth - 2
  const twoMonthsAgoYear = currentMonth === 0 ? currentYear - 1 : currentMonth === 1 ? currentYear - 1 : currentYear
  const twoMonthsAgoName = `${monthNames[twoMonthsAgo]} ${twoMonthsAgoYear}`

  return {
    current: currentMonthName,
    previous: previousMonthName,
    twoMonthsAgo: twoMonthsAgoName,
  }
}

export default function FacturacionPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const monthNames = getMonthNames()

  const {
    data: invoicesData,
    error: invoicesError,
    mutate: mutateInvoices,
  } = useSWR(`/api/invoices?status=${activeFilter}`, fetcher, { refreshInterval: 30000 })

  const {
    data: statsData,
    error: statsError,
    mutate: mutateStats,
  } = useSWR("/api/invoices/stats", fetcher, { refreshInterval: 30000 })

  const stats = {
    totalInvoices: statsData?.totalInvoices ?? 0,
    currentMonthCount: statsData?.currentMonthCount ?? 0,
    previousMonthCount: statsData?.previousMonthCount ?? 0,
    twoMonthsAgoCount: statsData?.twoMonthsAgoCount ?? 0,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filters = [
    { id: "all" as FilterType, label: "TODAS" },
    { id: "PAGADO" as FilterType, label: "PAGADAS" },
    { id: "PENDIENTE" as FilterType, label: "PENDIENTES" },
    { id: "DEVOLUCION" as FilterType, label: "DEVOLUCIONES" },
  ]

  const filteredInvoices = invoicesData?.data
    ? invoicesData.data.filter((invoice: any) => {
        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase()
        const invoiceNumber = invoice.invoice_number?.toLowerCase() || ""
        const clientName = invoice.client_name?.toLowerCase() || ""
        const clientNit = invoice.client_nit?.toLowerCase() || ""

        return invoiceNumber.includes(query) || clientName.includes(query) || clientNit.includes(query)
      })
    : []

  const isMissingTablesError =
    invoicesError?.message?.includes("Could not find the table") ||
    statsError?.message?.includes("Could not find the table") ||
    (invoicesData?.error && invoicesData.error.includes("Could not find the table")) ||
    (statsData?.error && statsData.error.includes("Could not find the table"))

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-zinc-900">Facturación</h1>
              <p className="mt-1 text-sm text-zinc-600">Gestiona y genera facturas para tus clientes</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  mutateInvoices()
                  mutateStats()
                }}
                className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-[#C8A96A] hover:bg-[#B8996A] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Factura
              </Button>
            </div>
          </div>

          {/* Alert for configuration errors */}
          {isMissingTablesError && (
            <div className="mb-6 rounded-lg border-2 border-red-400 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Las tablas de facturación no existen</h3>
                  <p className="text-sm text-red-800 mb-3">
                    Necesitas crear las tablas de facturación en tu base de datos de Supabase.
                  </p>
                  <div className="bg-white rounded-md p-3 border border-red-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Pasos para solucionar:</p>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li>
                        Ve a tu{" "}
                        <a
                          href="https://supabase.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Supabase Dashboard
                        </a>
                      </li>
                      <li>
                        Abre el <strong>SQL Editor</strong>
                      </li>
                      <li>
                        Copia y ejecuta el archivo{" "}
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                          scripts/003_create_invoices_tables.sql
                        </code>
                      </li>
                      <li>Recarga esta página</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="TOTAL FACTURAS"
              value={stats.totalInvoices.toString()}
              subtitle="Facturas generadas"
              color="blue"
            />
            <StatCard
              title={monthNames.twoMonthsAgo}
              value={stats.twoMonthsAgoCount.toString()}
              subtitle="Facturas generadas"
              color="purple"
            />
            <StatCard
              title={monthNames.previous}
              value={stats.previousMonthCount.toString()}
              subtitle="Facturas generadas"
              color="orange"
            />
            <StatCard
              title={monthNames.current}
              value={stats.currentMonthCount.toString()}
              subtitle="Facturas generadas"
              color="green"
            />
          </div>

          {/* Filters */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                    activeFilter === filter.id
                      ? "bg-[#C8A96A] text-white shadow-md border-2 border-[#C8A96A]"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#C8A96A] hover:text-[#C8A96A]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por número de factura, cliente o NIT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#C8A96A] focus:ring-[#C8A96A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                Mostrando {filteredInvoices.length} resultado{filteredInvoices.length !== 1 ? "s" : ""} para "
                {searchQuery}"
              </p>
            )}
          </div>

          {/* Invoices Table */}
          {invoicesError && !invoicesData && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              Error al cargar las facturas. Por favor verifica tu configuración de Supabase.
            </div>
          )}

          {!invoicesData && !invoicesError && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C8A96A] border-t-transparent"></div>
            </div>
          )}

          {invoicesData?.data && (
            <>
              <InvoicesTable
                invoices={filteredInvoices}
                onRefresh={() => {
                  mutateInvoices()
                  mutateStats()
                }}
              />

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
                <p>
                  Mostrando {filteredInvoices.length} de {invoicesData.data.length} facturas
                </p>
                <p className="font-semibold text-zinc-900">
                  Total:{" "}
                  {formatCurrency(filteredInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0))}
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <CreateInvoiceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          mutateInvoices()
          mutateStats()
        }}
      />
    </div>
  )
}
