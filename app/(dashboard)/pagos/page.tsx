"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import {
  Search,
  Download,
  Printer,
  Share2,
  Plus,
  Check,
  X,
  TrendingUp,
  DollarSign,
  CreditCard,
  Banknote,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Payment = {
  id: string
  date: string
  order: string
  client: string
  method: "transferencia" | "efectivo" | "contraentrega"
  submethod?: "nequi" | "bancolombia" | "daviplata" | "davivienda"
  status: "pagado" | "pendiente" | "observacion"
  amount: number
  note?: string
}

type MonthData = {
  month: number
  year: number
  open: boolean
  payments: Payment[]
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const generateMockData = (year: number): MonthData[] => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    year,
    open: year === currentYear ? i <= currentMonth : year < currentYear,
    payments: [
      {
        id: `${year}-${i}-1`,
        date: `${year}-${String(i + 1).padStart(2, "0")}-05`,
        order: `ORD-${year}-${String(i + 1).padStart(2, "0")}-001`,
        client: "María González",
        method: "transferencia" as const,
        submethod: "nequi" as const,
        status: "pagado" as const,
        amount: 1250000,
      },
      {
        id: `${year}-${i}-2`,
        date: `${year}-${String(i + 1).padStart(2, "0")}-08`,
        order: `ORD-${year}-${String(i + 1).padStart(2, "0")}-002`,
        client: "Carlos Ramírez",
        method: "efectivo" as const,
        status: "pagado" as const,
        amount: 850000,
      },
      {
        id: `${year}-${i}-3`,
        date: `${year}-${String(i + 1).padStart(2, "0")}-12`,
        order: `ORD-${year}-${String(i + 1).padStart(2, "0")}-003`,
        client: "Ana Martínez",
        method: "contraentrega" as const,
        status: i % 2 === 0 ? ("pendiente" as const) : ("pagado" as const),
        amount: 450000,
      },
      {
        id: `${year}-${i}-4`,
        date: `${year}-${String(i + 1).padStart(2, "0")}-15`,
        order: `ORD-${year}-${String(i + 1).padStart(2, "0")}-004`,
        client: "Luis Hernández",
        method: "transferencia" as const,
        submethod: "bancolombia" as const,
        status: "pagado" as const,
        amount: 2100000,
      },
      {
        id: `${year}-${i}-5`,
        date: `${year}-${String(i + 1).padStart(2, "0")}-20`,
        order: `ORD-${year}-${String(i + 1).padStart(2, "0")}-005`,
        client: "Patricia Silva",
        method: "transferencia" as const,
        submethod: "daviplata" as const,
        status: "pagado" as const,
        amount: 680000,
      },
    ],
  }))
}

export default function PagosPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMethod, setFilterMethod] = useState<string>("todos")
  const [filterSubmethod, setFilterSubmethod] = useState<string>("todos")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const availableYears = useMemo(() => {
    const years = []
    for (let i = 0; i < 6; i++) {
      years.push(currentDate.getFullYear() + i)
    }
    return years
  }, [currentDate])

  const allMonthsData = useMemo(() => {
    return generateMockData(selectedYear)
  }, [selectedYear])

  const selectedMonthData = useMemo(() => {
    return allMonthsData.find((m) => m.month === selectedMonth)
  }, [allMonthsData, selectedMonth])

  const filteredPayments = useMemo(() => {
    if (!selectedMonthData) return []

    return selectedMonthData.payments.filter((payment) => {
      const matchesSearch =
        searchQuery === "" ||
        payment.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.order.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMethod = filterMethod === "todos" || payment.method === filterMethod

      const matchesSubmethod =
        filterSubmethod === "todos" || (payment.method === "transferencia" && payment.submethod === filterSubmethod)

      return matchesSearch && matchesMethod && matchesSubmethod
    })
  }, [selectedMonthData, searchQuery, filterMethod, filterSubmethod])

  const totalFiltered = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }, [filteredPayments])

  const kpis = useMemo(() => {
    if (!selectedMonthData) return null

    const totalPagos = selectedMonthData.payments.reduce((sum, p) => sum + p.amount, 0)
    const totalTransacciones = selectedMonthData.payments.length
    const contraentregaPendiente = selectedMonthData.payments.filter(
      (p) => p.method === "contraentrega" && p.status === "pendiente",
    ).length
    const porcentajeContraentrega = (contraentregaPendiente / totalTransacciones) * 100
    const transferencias = selectedMonthData.payments.filter((p) => p.method === "transferencia").length
    const efectivo = selectedMonthData.payments.filter((p) => p.method === "efectivo").length
    const ticketPromedio = totalPagos / totalTransacciones

    return {
      totalPagos,
      totalTransacciones,
      porcentajeContraentrega,
      transferencias,
      efectivo,
      ticketPromedio,
    }
  }, [selectedMonthData])

  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month)
  }, [])

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(Number.parseInt(year))
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleMarkPaid = useCallback((payment: Payment) => {
    setSelectedPayment(payment)
    setShowMarkPaidDialog(true)
  }, [])

  if (!selectedMonthData || !kpis) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
            <p className="mt-1 text-sm text-gray-600">Control financiero por método y submétodo de pago</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#C8A96A] hover:bg-[#B8996A]">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">Agregar Nuevo Pago</DialogTitle>
                  <DialogDescription>Registra un nuevo pago en el sistema</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente</Label>
                    <Input placeholder="Nombre del cliente" />
                  </div>
                  <div>
                    <Label>Monto</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <Label>Método de Pago</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="contraentrega">Contraentrega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-[#C8A96A] hover:bg-[#B8996A]">Guardar Pago</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Selector de Mes y Año */}
      <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
        <div className="mb-4 flex items-center gap-4">
          <Label className="text-sm font-medium text-gray-700">Año:</Label>
          <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {MESES.map((mes, idx) => {
            const monthData = allMonthsData[idx]
            return (
              <button
                key={idx}
                onClick={() => handleMonthChange(idx)}
                disabled={!monthData.open}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedMonth === idx
                    ? "bg-[#C8A96A] text-white shadow-md"
                    : monthData.open
                      ? "bg-white text-gray-700 hover:bg-gray-100"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {mes}
              </button>
            )
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="px-8 py-6">
        <div className="mb-6 grid grid-cols-6 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Total Pagos</span>
              <DollarSign className="h-4 w-4 text-[#C8A96A]" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">
              ${(kpis.totalPagos / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Transacciones</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">{kpis.totalTransacciones}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">% Contraentrega</span>
              <Package className="h-4 w-4 text-orange-500" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">
              {kpis.porcentajeContraentrega.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Transferencia</span>
              <CreditCard className="h-4 w-4 text-green-500" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">{kpis.transferencias}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Efectivo</span>
              <Banknote className="h-4 w-4 text-purple-500" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">{kpis.efectivo}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-600">Ticket Promedio</span>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
            <div className="font-serif text-2xl font-bold tabular-nums text-gray-900">
              ${(kpis.ticketPromedio / 1000).toFixed(0)}K
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por cliente o pedido..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los métodos</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="contraentrega">Contraentrega</SelectItem>
            </SelectContent>
          </Select>
          {filterMethod === "transferencia" && (
            <Select value={filterSubmethod} onValueChange={setFilterSubmethod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Submétodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="nequi">Nequi</SelectItem>
                <SelectItem value="bancolombia">Bancolombia</SelectItem>
                <SelectItem value="daviplata">Daviplata</SelectItem>
                <SelectItem value="davivienda">Davivienda</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Total Prominente de los Pagos Filtrados */}
        <div className="mb-6 rounded-xl border-2 border-[#C8A96A] bg-gradient-to-br from-amber-50 to-yellow-50 p-2 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
                Total{" "}
                {filterMethod === "todos"
                  ? "Todos los Métodos"
                  : filterMethod === "transferencia"
                    ? "Transferencia"
                    : filterMethod === "efectivo"
                      ? "Efectivo"
                      : "Contraentrega"}
                {filterMethod === "transferencia" &&
                  filterSubmethod !== "todos" &&
                  ` - ${filterSubmethod.charAt(0).toUpperCase() + filterSubmethod.slice(1)}`}
              </p>
              <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-[#C8A96A]">
                ${totalFiltered.toLocaleString("es-CO")}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-600">
                {filteredPayments.length} {filteredPayments.length === 1 ? "transacción" : "transacciones"}
              </p>
            </div>
            <div className="rounded-full bg-[#C8A96A] p-2">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        {/* Tabla de Pagos */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Pedido
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Cliente
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Método
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{payment.date}</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">{payment.order}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">{payment.client}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant="secondary"
                        className={
                          payment.method === "transferencia"
                            ? "bg-green-100 text-green-700"
                            : payment.method === "efectivo"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                        }
                      >
                        {payment.method === "transferencia"
                          ? "Transferencia"
                          : payment.method === "efectivo"
                            ? "Efectivo"
                            : "Contraentrega"}
                      </Badge>
                      {payment.submethod && (
                        <span className="text-xs text-gray-500 capitalize">{payment.submethod}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <Badge
                        variant="secondary"
                        className={
                          payment.status === "pagado"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "pendiente"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        {payment.status === "pagado"
                          ? "Pagado"
                          : payment.status === "pendiente"
                            ? "Pendiente"
                            : "Observación"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-semibold tabular-nums text-[#C8A96A]">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {payment.method === "contraentrega" && payment.status === "pendiente" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPaid(payment)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Marcar Pagado
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Marcar como Pagado */}
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Marcar como Pagado</DialogTitle>
            <DialogDescription>¿Estás seguro de que quieres marcar este pago como pagado?</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-700">Pedido: {selectedPayment.order}</div>
                <div className="mb-2 text-sm text-gray-600">Cliente: {selectedPayment.client}</div>
                <div className="text-lg font-bold text-[#C8A96A]">${selectedPayment.amount.toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Aquí iría la lógica para marcar como pagado
                    setShowMarkPaidDialog(false)
                    setSelectedPayment(null)
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowMarkPaidDialog(false)
                    setSelectedPayment(null)
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
