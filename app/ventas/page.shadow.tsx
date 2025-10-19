"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { SalesTable } from "@/components/sales-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, RefreshCw, AlertCircle, Search } from "lucide-react"
import { exportToCSV, exportToExcel } from "@/lib/export-utils"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type FilterType =
  | "all"
  | "contraentrega"
  | "efectivo"
  | "transferencia"
  | "devoluciones"
  | "pagado_mipaquete"
  | "pendiente_mipaquete"
type TimePeriod = 7 | 14 | 21 | 28

export default function VentasPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(7)
  const [isCheckingReturns, setIsCheckingReturns] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const monthMap: { [key: string]: string[] } = {
    enero: ["ene", "enero", "january", "jan"],
    febrero: ["feb", "febrero", "february"],
    marzo: ["mar", "marzo", "march"],
    abril: ["abr", "abril", "april", "apr"],
    mayo: ["may", "mayo"],
    junio: ["jun", "junio", "june"],
    julio: ["jul", "julio", "july"],
    agosto: ["ago", "agosto", "august", "aug"],
    septiembre: ["sep", "sept", "septiembre", "september"],
    octubre: ["oct", "octubre", "october"],
    noviembre: ["nov", "noviembre", "november"],
    diciembre: ["dic", "diciembre", "december", "dec"],
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const normalizeMonthSearch = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim()

    for (const [fullMonth, variants] of Object.entries(monthMap)) {
      if (variants.some((variant) => lowerQuery.includes(variant))) {
        return fullMonth.substring(0, 3) // Retorna las primeras 3 letras del mes
      }
    }

    return query
  }

  const apiUrl =
    activeFilter === "pagado_mipaquete" || activeFilter === "pendiente_mipaquete"
      ? `/api/sales?filter=${activeFilter}&period=${timePeriod}`
      : `/api/sales?filter=${activeFilter}`

  const {
    data: salesData,
    error: salesError,
    mutate: mutateSales,
  } = useSWR(apiUrl, fetcher, { refreshInterval: 30000 })

  const {
    data: statsData,
    error: statsError,
    mutate: mutateStats,
  } = useSWR(
    activeFilter === "pagado_mipaquete" || activeFilter === "pendiente_mipaquete"
      ? `/api/sales/stats?period=${timePeriod}`
      : "/api/sales/stats",
    fetcher,
    { refreshInterval: 30000 },
  )

  useEffect(() => {
    const checkReturns = async () => {
      try {
        setIsCheckingReturns(true)
        await fetch("/api/mipaquete/check-returns")
        mutateSales()
        mutateStats()
      } catch (error) {
        console.error("[v0] Error checking returns:", error)
      } finally {
        setIsCheckingReturns(false)
      }
    }

    checkReturns()

    const interval = setInterval(checkReturns, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [mutateSales, mutateStats])

  const handleExport = (format: "csv" | "excel") => {
    if (!salesData?.data) return

    const exportData = salesData.data.map((sale: any) => ({
      ID: sale.sale_id,
      Cliente: sale.client_name,
      Fecha: new Date(sale.sale_date).toLocaleDateString("es-CO"),
      Productos: sale.products.map((p: any) => p.name).join(", "),
      Total: sale.total,
      Estado: sale.status,
      "Método de Pago": sale.payment_method,
      Transportadora: sale.shipping_company || "",
      Guía: sale.tracking_number || "",
      Vendedor: sale.seller_name,
      "Pagado MiPaquete": sale.paid_by_mipaquete ? "Sí" : "No",
    }))

    if (format === "csv") {
      exportToCSV(exportData, `ventas_${activeFilter}_${new Date().toISOString().split("T")[0]}`)
    } else {
      exportToExcel(exportData, `ventas_${activeFilter}_${new Date().toISOString().split("T")[0]}`)
    }
  }

  const stats = statsData || {
    totalRevenue: 0,
    transferTotal: 0,
    cashTotal: 0,
    returnsTotal: 0,
    averageTicket: 0,
    paidByMipaquete: 0,
    pendingByMipaquete: 0,
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
    { id: "contraentrega" as FilterType, label: "PAGADAS" },
    { id: "efectivo" as FilterType, label: "PENDIENTES" },
    { id: "transferencia" as FilterType, label: "DEVOLUCIONES" },
  ]

  const showTimePeriodSelector = activeFilter === "pagado_mipaquete" || activeFilter === "pendiente_mipaquete"

  const isMissingTablesError =
    salesError?.message?.includes("Could not find the table") ||
    statsError?.message?.includes("Could not find the table") ||
    (salesData?.error && salesData.error.includes("Could not find the table")) ||
    (statsData?.error && statsData.error.includes("Could not find the table"))

  const filteredSales = salesData?.data
    ? salesData.data.filter((sale: any) => {
        if (!searchQuery.trim()) return true

        const normalizedQuery = normalizeMonthSearch(searchQuery).toLowerCase()
        const clientName = sale.client_name?.toLowerCase() || ""
        const saleId = sale.sale_id?.toLowerCase() || ""
        const saleDate = formatDate(sale.sale_date).toLowerCase()

        return (
          clientName.includes(normalizedQuery) || saleId.includes(normalizedQuery) || saleDate.includes(normalizedQuery)
        )
      })
    : []

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-zinc-900">Ventas</h1>
              <p className="mt-1 text-sm text-zinc-600">Gestiona y visualiza todas las ventas</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  mutateSales()
                  mutateStats()
                }}
                className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingReturns ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("csv")}
                className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                disabled={!salesData?.data || salesData.data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("excel")}
                className="border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                disabled={!salesData?.data || salesData.data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {/* Alert for configuration errors */}
          {isMissingTablesError && (
            <div className="mb-6 rounded-lg border-2 border-red-400 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Las tablas de la base de datos no existen</h3>
                  <p className="text-sm text-red-800 mb-3">
                    Necesitas crear las tablas en tu base de datos de Supabase para que el dashboard funcione.
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
                        Abre el <strong>SQL Editor</strong> en el menú lateral
                      </li>
                      <li>
                        Copia el contenido del archivo{" "}
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                          scripts/001_create_sales_tables.sql
                        </code>
                      </li>
                      <li>
                        Pégalo en el editor y haz clic en <strong>Run</strong>
                      </li>
                      <li>Recarga esta página</li>
                    </ol>
                  </div>
                  <p className="text-xs text-red-700 mt-3">
                    📄 Consulta <strong>INSTRUCCIONES_SETUP.md</strong> para más detalles
                  </p>
                </div>
              </div>
            </div>
          )}

          {(salesError || statsError) && !isMissingTablesError && (
            <div className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Error de conexión a Supabase</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Hay un problema al conectar con la base de datos. Verifica tu configuración.
                  </p>
                  <div className="bg-white rounded-md p-3 border border-amber-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Verifica:</p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>
                        Las variables de entorno en la sección <strong>Vars</strong> del sidebar
                      </li>
                      <li>Que tu proyecto de Supabase esté activo</li>
                      <li>Que las credenciales sean correctas</li>
                    </ul>
                  </div>
                  {(salesError || statsError) && (
                    <details className="mt-3">
                      <summary className="text-xs text-amber-700 cursor-pointer hover:text-amber-900">
                        Ver detalles del error
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(salesError || statsError, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard title="VENTA TOTAL" value={formatCurrency(stats.totalRevenue)} color="blue" trend={15} />
            <StatCard title="TRANSFERENCIA" value={formatCurrency(stats.transferTotal)} color="green" />
            <StatCard title="EFECTIVO" value={formatCurrency(stats.cashTotal)} color="yellow" />
            <StatCard
              title="DEVOLUCIONES"
              value={formatCurrency(stats.returnsTotal)}
              subtitle={`${stats.returnsCount || 0} devoluciones`}
              color="red"
            />
            <StatCard
              title="TICKET PROMEDIO"
              value={formatCurrency(stats.averageTicket)}
              subtitle="Por venta"
              color="purple"
            />
            <StatCard title="PAGADO MIPAQUETE" value={formatCurrency(stats.paidByMipaquete)} color="orange" />
            <StatCard title="PENDIENTE MIPAQUETE" value={formatCurrency(stats.pendingByMipaquete)} color="pink" />
          </div>

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

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, factura o fecha (ej: octubre, oct, 15/oct)..."
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
                Mostrando {filteredSales.length} resultado{filteredSales.length !== 1 ? "s" : ""} para "{searchQuery}"
              </p>
            )}
          </div>

          {/* Time Period Selector */}
          {showTimePeriodSelector && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Seleccionar período</h3>
                <div className="flex gap-2">
                  {[7, 14, 21, 28].map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimePeriod(days as TimePeriod)}
                      className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                        timePeriod === days
                          ? "bg-[#C8A96A] text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      }`}
                    >
                      {days} días
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 p-3">
                <span className="text-sm font-medium text-gray-600">Total últimos {timePeriod} días:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    activeFilter === "pagado_mipaquete" ? stats.paidByMipaquete : stats.pendingByMipaquete,
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Sales Table */}
          {salesError && !salesData && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              Error al cargar las ventas. Por favor verifica tu configuración de Supabase.
            </div>
          )}

          {!salesData && !salesError && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C8A96A] border-t-transparent"></div>
            </div>
          )}

          {salesData?.data && (
            <>
              <SalesTable
                sales={filteredSales}
                onRefresh={() => {
                  mutateSales()
                  mutateStats()
                }}
                showPaymentCheckbox={
                  activeFilter === "contraentrega" ||
                  activeFilter === "pagado_mipaquete" ||
                  activeFilter === "pendiente_mipaquete"
                }
              />

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
                <p>
                  Mostrando {filteredSales.length} de {salesData.data.length} ventas
                </p>
                <p className="font-semibold text-zinc-900">
                  Total: {formatCurrency(filteredSales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0))}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
