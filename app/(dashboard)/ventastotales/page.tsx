"use client"

import { useState, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Printer, Share2, Plus, TrendingUp, TrendingDown, FileText, Edit, Eye, Upload } from "lucide-react"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type TransferSub = "bancolombia" | "nequi" | "daviplata" | "davivienda"
type PayMethod = "transferencia" | "efectivo" | "mipaquete"
type PayStatus = "pagado" | "pendiente"
type ExpenseCat = "oficina" | "nomina" | "servicios" | "logistica" | "marketing" | "devoluciones" | "otros"

type Payment = {
  id: string
  date: string
  order: string
  client: string
  method: PayMethod
  submethod?: TransferSub
  status: PayStatus
  amount: number
  note?: string
  receiptUrl?: string
}

type Expense = {
  id: string
  date: string
  vendor: string
  category: ExpenseCat
  method: "efectivo" | "transferencia" | "tarjeta" | "credito"
  status: "pagado" | "pendiente"
  amount: number
  note?: string
  receiptUrl?: string
  createdBy: string // Agregado campo obligatorio "createdBy"
}

type MonthFinance = {
  month: number
  year: number
  cogs: number
  payments: Payment[]
  expenses: Expense[]
  isOpen: boolean
}

const MOCK_DATA: MonthFinance[] = [
  {
    month: 1,
    year: 2025,
    cogs: 11000000,
    isOpen: false,
    payments: [
      {
        id: "p1",
        date: "2025-01-05",
        order: "ORD-2025-01-001",
        client: "María González",
        method: "transferencia",
        submethod: "nequi",
        status: "pagado",
        amount: 1250000,
        receiptUrl: "https://example.com/receipt1.jpg",
      },
      {
        id: "p2",
        date: "2025-01-10",
        order: "ORD-2025-01-002",
        client: "Carlos Ramírez",
        method: "efectivo",
        status: "pagado",
        amount: 800000,
      },
    ],
    expenses: [
      {
        id: "e1",
        date: "2025-01-03",
        vendor: "Papelería Central",
        category: "oficina",
        method: "transferencia",
        status: "pagado",
        amount: 450000,
        receiptUrl: "https://example.com/expense1.jpg",
        createdBy: "Juan Pérez", // Added for mock data consistency
      },
      {
        id: "e2",
        date: "2025-01-15",
        vendor: "Nómina Enero",
        category: "nomina",
        method: "transferencia",
        status: "pagado",
        amount: 18500000,
        createdBy: "Ana López", // Added for mock data consistency
      },
    ],
  },
  // ... más meses con datos variados
]

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

const COLORS = {
  transferencia: "#10b981",
  efectivo: "#3b82f6",
  mipaquete: "#f59e0b",
  bancolombia: "#FFDD00",
  nequi: "#A020F0",
  daviplata: "#FF0000",
  davivienda: "#ED1C24",
}

export default function VentasGastosPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [searchQuery, setSearchQuery] = useState("")

  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isEditCOGSOpen, setIsEditCOGSOpen] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    date: "",
    order: "",
    client: "",
    method: "" as PayMethod | "",
    submethod: "" as TransferSub | "",
    amount: "",
    status: "pagado" as PayStatus,
    note: "",
  })
  const [paymentFile, setPaymentFile] = useState<File | null>(null)

  const [expenseForm, setExpenseForm] = useState({
    date: "",
    vendor: "",
    category: "" as ExpenseCat | "",
    method: "" as "efectivo" | "transferencia" | "tarjeta" | "credito" | "",
    amount: "",
    status: "pagado" as "pagado" | "pendiente",
    note: "",
    createdBy: "", // Agregado campo obligatorio "createdBy"
  })
  const [expenseFile, setExpenseFile] = useState<File | null>(null)

  const [cogsAmount, setCogsAmount] = useState("")

  const monthData = useMemo(() => {
    return (
      MOCK_DATA.find((m) => m.month === selectedMonth + 1 && m.year === selectedYear) || {
        month: selectedMonth + 1,
        year: selectedYear,
        cogs: 0,
        payments: [],
        expenses: [],
        isOpen: true,
      }
    )
  }, [selectedMonth, selectedYear])

  const kpis = useMemo(() => {
    const totalVentas = monthData.payments.reduce((sum, p) => sum + p.amount, 0)
    const transferencia = monthData.payments
      .filter((p) => p.method === "transferencia")
      .reduce((sum, p) => sum + p.amount, 0)
    const efectivo = monthData.payments.filter((p) => p.method === "efectivo").reduce((sum, p) => sum + p.amount, 0)
    const mipaquetePagado = monthData.payments
      .filter((p) => p.method === "mipaquete" && p.status === "pagado")
      .reduce((sum, p) => sum + p.amount, 0)
    const mipaquetePendiente = monthData.payments
      .filter((p) => p.method === "mipaquete" && p.status === "pendiente")
      .reduce((sum, p) => sum + p.amount, 0)
    const totalGastos = monthData.expenses.reduce((sum, e) => sum + e.amount, 0)
    const utilidadNeta = totalVentas - monthData.cogs - totalGastos
    const margen = totalVentas > 0 ? (utilidadNeta / totalVentas) * 100 : 0

    return {
      totalVentas,
      transferencia,
      efectivo,
      mipaquetePagado,
      mipaquetePendiente,
      totalGastos,
      cogs: monthData.cogs,
      utilidadNeta,
      margen,
    }
  }, [monthData])

  const formatCOP = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  const waterfallData = useMemo(() => {
    return [
      { name: "Ventas", value: kpis.totalVentas / 1000000, fill: "#10b981" },
      { name: "COGS", value: -kpis.cogs / 1000000, fill: "#f59e0b" },
      { name: "Gastos", value: -kpis.totalGastos / 1000000, fill: "#ef4444" },
      { name: "Utilidad", value: kpis.utilidadNeta / 1000000, fill: "#3b82f6" },
    ]
  }, [kpis])

  const paymentMethodsData = useMemo(() => {
    return [
      { name: "Transferencia", value: kpis.transferencia, color: COLORS.transferencia },
      { name: "Efectivo", value: kpis.efectivo, color: COLORS.efectivo },
      { name: "MiPaquete", value: kpis.mipaquetePagado + kpis.mipaquetePendiente, color: COLORS.mipaquete },
    ].filter((item) => item.value > 0)
  }, [kpis])

  const transferSubData = useMemo(() => {
    const subs = monthData.payments
      .filter((p) => p.method === "transferencia" && p.submethod)
      .reduce(
        (acc, p) => {
          const sub = p.submethod!
          acc[sub] = (acc[sub] || 0) + p.amount
          return acc
        },
        {} as Record<TransferSub, number>,
      )

    return Object.entries(subs).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as TransferSub],
    }))
  }, [monthData.payments])

  const expensesCategoryData = useMemo(() => {
    const categories = monthData.expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount
        return acc
      },
      {} as Record<ExpenseCat, number>,
    )

    const categoryNames: Record<ExpenseCat, string> = {
      oficina: "Oficina",
      nomina: "Nómina",
      servicios: "Servicios",
      logistica: "Logística",
      marketing: "Marketing",
      devoluciones: "Devoluciones",
      otros: "Otros",
    }

    return Object.entries(categories).map(([cat, value]) => ({
      name: categoryNames[cat as ExpenseCat],
      value: value / 1000000,
    }))
  }, [monthData.expenses])

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-4xl font-bold text-gray-900">Ventas & Gastos</h1>
            <p className="text-sm text-gray-600 mt-1">Control financiero por método y submétodo de pago</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {MONTHS.map((month, idx) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(idx)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  selectedMonth === idx
                    ? "bg-[#C8A96A] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-4 gap-6">
          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Ventas Totales</p>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 tabular-nums">{formatCOP(kpis.totalVentas)}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-2">+12% vs mes anterior</p>
          </Card>

          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Transferencia</p>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 tabular-nums">{formatCOP(kpis.transferencia)}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-2">+8% vs mes anterior</p>
          </Card>

          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Efectivo</p>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 tabular-nums">{formatCOP(kpis.efectivo)}</p>
            <p className="text-xs text-red-600 font-semibold mt-2">-5% vs mes anterior</p>
          </Card>

          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">MiPaquete</p>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-serif font-bold text-gray-900 tabular-nums">
              {formatCOP(kpis.mipaquetePagado)}
            </p>
            <p className="text-xs text-amber-600 font-semibold mt-2">Pendiente: {formatCOP(kpis.mipaquetePendiente)}</p>
          </Card>

          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Gastos Totales</p>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 tabular-nums">{formatCOP(kpis.totalGastos)}</p>
            <p className="text-xs text-red-600 font-semibold mt-2">+3% vs mes anterior</p>
          </Card>

          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">COGS</p>
              <Edit className="h-4 w-4 text-[#C8A96A] cursor-pointer" onClick={() => setIsEditCOGSOpen(true)} />
            </div>
            <p className="text-3xl font-serif font-bold text-gray-900 tabular-nums">{formatCOP(kpis.cogs)}</p>
            <p className="text-xs text-gray-600 font-semibold mt-2">
              {((kpis.cogs / kpis.totalVentas) * 100).toFixed(1)}% de ventas
            </p>
          </Card>

          <Card className="p-6 rounded-3xl border-2 border-[#C8A96A] shadow-[0_20px_60px_rgba(0,0,0,.15)] bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Utilidad Neta</p>
              {kpis.utilidadNeta >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p
              className={`text-3xl font-serif font-bold tabular-nums ${
                kpis.utilidadNeta >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCOP(kpis.utilidadNeta)}
            </p>
            <p className="text-xs text-gray-600 font-semibold mt-2">Ventas - COGS - Gastos</p>
          </Card>

          <Card className="p-6 rounded-3xl border-2 border-[#C8A96A] shadow-[0_20px_60px_rgba(0,0,0,.15)] bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase">Margen %</p>
              {kpis.margen >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p
              className={`text-3xl font-serif font-bold tabular-nums ${
                kpis.margen >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {kpis.margen.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 font-semibold mt-2">Utilidad / Ventas</p>
          </Card>
        </div>

        <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
          <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Bridge de Utilidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: "Millones COP", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(1)}M`} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Participación por Método</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / kpis.totalVentas) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCOP(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {transferSubData.length > 0 && (
            <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Desglose de Transferencias</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transferSubData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / kpis.transferencia) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {transferSubData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCOP(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold text-gray-900">Pagos del Mes</h3>
            <Button onClick={() => setIsAddPaymentOpen(true)} className="bg-[#C8A96A] hover:bg-[#B8996A] gap-2">
              <Plus className="h-4 w-4" />
              Agregar Pago
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Nº Pedido</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Submétodo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Comprobante</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Importe</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthData.payments.length > 0 ? (
                  monthData.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{payment.order}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.client}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.submethod
                          ? payment.submethod.charAt(0).toUpperCase() + payment.submethod.slice(1)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {payment.receiptUrl ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            Adjunto
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            payment.status === "pagado"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {formatCOP(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay pagos registrados para este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {expensesCategoryData.length > 0 && (
          <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Gastos por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: "Millones COP", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(1)}M`} />
                <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card className="p-6 rounded-3xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,.15)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold text-gray-900">Gastos del Mes</h3>
            <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-[#C8A96A] hover:bg-[#B8996A] gap-2">
              <Plus className="h-4 w-4" />
              Agregar Gasto
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Soporte</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Monto</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthData.expenses.length > 0 ? (
                  monthData.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{expense.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{expense.vendor}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{expense.method}</td>
                      <td className="px-4 py-3 text-sm">
                        {expense.receiptUrl ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            Adjunto
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            expense.status === "pagado"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right tabular-nums">
                        {formatCOP(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                      No hay gastos registrados para este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-2 border-[#C8A96A] shadow-[0_20px_60px_rgba(0,0,0,.15)] bg-gradient-to-br from-amber-50 to-yellow-50">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Ventas Totales</p>
              <p className="text-2xl font-serif font-bold text-emerald-600 tabular-nums">
                {formatCOP(kpis.totalVentas)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Gastos Totales</p>
              <p className="text-2xl font-serif font-bold text-red-600 tabular-nums">{formatCOP(kpis.totalGastos)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">COGS</p>
              <p className="text-2xl font-serif font-bold text-amber-600 tabular-nums">{formatCOP(kpis.cogs)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Utilidad Neta</p>
              <p
                className={`text-2xl font-serif font-bold tabular-nums ${
                  kpis.utilidadNeta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatCOP(kpis.utilidadNeta)}
              </p>
              <p className="text-xs text-gray-600 font-semibold mt-1">Margen: {kpis.margen.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Agregar Nuevo Pago</DialogTitle>
            <DialogDescription>Registra un nuevo pago recibido</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (paymentForm.method === "transferencia" && !paymentFile) {
                alert("Debes adjuntar el comprobante de transferencia")
                return
              }
              alert("Pago agregado exitosamente")
              setIsAddPaymentOpen(false)
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentDate">Fecha *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentOrder">Nº Pedido *</Label>
                  <Input
                    id="paymentOrder"
                    value={paymentForm.order}
                    onChange={(e) => setPaymentForm({ ...paymentForm, order: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentClient">Cliente *</Label>
                <Input
                  id="paymentClient"
                  value={paymentForm.client}
                  onChange={(e) => setPaymentForm({ ...paymentForm, client: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Método *</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value as PayMethod })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="mipaquete">MiPaquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentForm.method === "transferencia" && (
                  <div className="grid gap-2">
                    <Label htmlFor="paymentSubmethod">Submétodo *</Label>
                    <Select
                      value={paymentForm.submethod}
                      onValueChange={(value) => setPaymentForm({ ...paymentForm, submethod: value as TransferSub })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bancolombia">Bancolombia</SelectItem>
                        <SelectItem value="nequi">Nequi</SelectItem>
                        <SelectItem value="daviplata">Daviplata</SelectItem>
                        <SelectItem value="davivienda">Davivienda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentAmount">Importe (COP) *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentStatus">Estado *</Label>
                  <Select
                    value={paymentForm.status}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, status: value as PayStatus })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentFile">Comprobante {paymentForm.method === "transferencia" && "*"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="paymentFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                    required={paymentForm.method === "transferencia"}
                    className="cursor-pointer"
                  />
                  {paymentFile && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {paymentFile.name}
                    </span>
                  )}
                </div>
                {paymentForm.method === "transferencia" && (
                  <p className="text-xs text-amber-600 font-semibold">* Obligatorio para transferencias</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentNote">Nota (opcional)</Label>
                <Textarea
                  id="paymentNote"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#C8A96A] hover:bg-[#B8996A]">
                Guardar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Agregar Nuevo Gasto</DialogTitle>
            <DialogDescription>Registra un nuevo gasto del negocio</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!expenseForm.createdBy.trim()) {
                alert("Debes ingresar el nombre de quien realiza el gasto")
                return
              }
              alert("Gasto agregado exitosamente")
              setIsAddExpenseOpen(false)
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expenseDate">Fecha *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expenseVendor">Proveedor *</Label>
                  <Input
                    id="expenseVendor"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expenseCreatedBy">Realizado por *</Label>
                <Input
                  id="expenseCreatedBy"
                  value={expenseForm.createdBy}
                  onChange={(e) => setExpenseForm({ ...expenseForm, createdBy: e.target.value })}
                  placeholder="Nombre de quien realiza el gasto"
                  required
                />
                <p className="text-xs text-amber-600 font-semibold">* Campo obligatorio</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expenseCategory">Categoría *</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value as ExpenseCat })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="nomina">Nómina</SelectItem>
                      <SelectItem value="servicios">Servicios Públicos</SelectItem>
                      <SelectItem value="logistica">Logística/Envíos</SelectItem>
                      <SelectItem value="marketing">Marketing/Ads</SelectItem>
                      <SelectItem value="devoluciones">Devoluciones</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expenseMethod">Método *</Label>
                  <Select
                    value={expenseForm.method}
                    onValueChange={(value) =>
                      setExpenseForm({
                        ...expenseForm,
                        method: value as "efectivo" | "transferencia" | "tarjeta" | "credito",
                      })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expenseAmount">Monto (COP) *</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expenseStatus">Estado *</Label>
                  <Select
                    value={expenseForm.status}
                    onValueChange={(value) =>
                      setExpenseForm({ ...expenseForm, status: value as "pagado" | "pendiente" })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expenseFile">Soporte (opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="expenseFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setExpenseFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {expenseFile && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      {expenseFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expenseNote">Nota (opcional)</Label>
                <Textarea
                  id="expenseNote"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#C8A96A] hover:bg-[#B8996A]">
                Guardar Gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditCOGSOpen} onOpenChange={setIsEditCOGSOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Editar COGS</DialogTitle>
            <DialogDescription>Costo de la mercancía vendida del mes</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              alert("COGS actualizado exitosamente")
              setIsEditCOGSOpen(false)
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cogsAmount">COGS del Mes (COP) *</Label>
                <Input
                  id="cogsAmount"
                  type="number"
                  value={cogsAmount}
                  onChange={(e) => setCogsAmount(e.target.value)}
                  placeholder={monthData.cogs.toString()}
                  required
                />
                <p className="text-xs text-gray-600">Se usa para calcular la utilidad real</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditCOGSOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#C8A96A] hover:bg-[#B8996A]">
                Guardar COGS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
