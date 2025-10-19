"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Search, Download, Plus, Upload } from "lucide-react"
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"

const MONTHS = [
  { name: "ENE", fullName: "Enero", value: 1, closed: true },
  { name: "FEB", fullName: "Febrero", value: 2, closed: true },
  { name: "MAR", fullName: "Marzo", value: 3, closed: true },
  { name: "ABR", fullName: "Abril", value: 4, closed: true },
  { name: "MAY", fullName: "Mayo", value: 5, closed: true },
  { name: "JUN", fullName: "Junio", value: 6, closed: true },
  { name: "JUL", fullName: "Julio", value: 7, closed: true },
  { name: "AGO", fullName: "Agosto", value: 8, closed: true },
  { name: "SEP", fullName: "Septiembre", value: 9, closed: true },
  { name: "OCT", fullName: "Octubre", value: 10, closed: true },
  { name: "NOV", fullName: "Noviembre", value: 11, closed: true },
  { name: "DIC", fullName: "Diciembre", value: 12, closed: false },
]

const MOCK_DATA = {
  invoices: [
    // Enero
    {
      docNumber: "1001",
      customerName: "Tech Solutions",
      invoiceDate: "2024-01-10",
      amount: 4800000, // COP
      balance: 0,
      month: 1,
    },
    {
      docNumber: "1002",
      customerName: "Digital Corp",
      invoiceDate: "2024-01-15",
      amount: 3400000,
      balance: 0,
      month: 1,
    },
    // Febrero
    {
      docNumber: "1010",
      customerName: "Innovation Labs",
      invoiceDate: "2024-02-05",
      amount: 8400000,
      balance: 0,
      month: 2,
    },
    {
      docNumber: "1011",
      customerName: "Smart Systems",
      invoiceDate: "2024-02-12",
      amount: 7000000,
      balance: 0,
      month: 2,
    },
    // Marzo
    {
      docNumber: "1020",
      customerName: "Future Tech",
      invoiceDate: "2024-03-08",
      amount: 12800000,
      balance: 0,
      month: 3,
    },
    // Junio
    {
      docNumber: "1056",
      customerName: "Elite Systems",
      invoiceDate: "2024-06-12",
      amount: 2000000,
      balance: 0,
      month: 6,
    },
    {
      docNumber: "1079",
      customerName: "Quantum Services",
      invoiceDate: "2024-06-15",
      amount: 33760000,
      balance: 0,
      month: 6,
    },
    {
      docNumber: "1082",
      customerName: "Shoreline Technologies",
      invoiceDate: "2024-06-15",
      amount: 2000000,
      balance: 0,
      month: 6,
    },
    {
      docNumber: "1057",
      customerName: "Proactive Solutions",
      invoiceDate: "2024-06-16",
      amount: 1360000,
      balance: 800000,
      month: 6,
    },
    {
      docNumber: "2226",
      customerName: "Bright Future Ltd.",
      invoiceDate: "2024-06-16",
      amount: 1600000,
      balance: 1600000,
      month: 6,
    },
    {
      docNumber: "1035",
      customerName: "United Solutions",
      invoiceDate: "2024-06-17",
      amount: 800000,
      balance: 0,
      month: 6,
    },
    {
      docNumber: "1070",
      customerName: "Nexus Technologies",
      invoiceDate: "2024-06-17",
      amount: 2400000,
      balance: 0,
      month: 6,
    },
    {
      docNumber: "1064",
      customerName: "United Solutions",
      invoiceDate: "2024-06-18",
      amount: 5972000,
      balance: 0,
      month: 6,
    },
    // Diciembre
    {
      docNumber: "1200",
      customerName: "Global Enterprises",
      invoiceDate: "2024-12-05",
      amount: 22000000,
      balance: 0,
      month: 12,
    },
    {
      docNumber: "1201",
      customerName: "Mega Corp",
      invoiceDate: "2024-12-10",
      amount: 12800000,
      balance: 4000000,
      month: 12,
    },
  ],
  salesByPaymentMethod: {
    1: { transferencia: 3200000, efectivo: 1600000, mipaquete: 0 },
    2: { transferencia: 10400000, efectivo: 5000000, mipaquete: 0 },
    3: { transferencia: 8500000, efectivo: 4300000, mipaquete: 0 },
    6: { transferencia: 32000000, efectivo: 12692000, mipaquete: 5200000 },
    12: { transferencia: 24000000, efectivo: 8800000, mipaquete: 2000000 },
  },
  expensesByCategory: {
    1: {
      gastosOficina: 2400000,
      nomina: 18500000,
      serviciosPublicos: 1800000,
      arrendamiento: 5000000,
      impuestos: 3200000,
      transporte: 1500000,
      publicidad: 2800000,
      mantenimiento: 900000,
      otros: 1200000,
    },
    2: {
      gastosOficina: 2600000,
      nomina: 19200000,
      serviciosPublicos: 1900000,
      arrendamiento: 5000000,
      impuestos: 3400000,
      transporte: 1600000,
      publicidad: 3200000,
      mantenimiento: 1100000,
      otros: 1400000,
    },
    3: {
      gastosOficina: 2800000,
      nomina: 20100000,
      serviciosPublicos: 2100000,
      arrendamiento: 5000000,
      impuestos: 3600000,
      transporte: 1700000,
      publicidad: 3500000,
      mantenimiento: 1200000,
      otros: 1500000,
    },
    6: {
      gastosOficina: 3200000,
      nomina: 22500000,
      serviciosPublicos: 2400000,
      arrendamiento: 5000000,
      impuestos: 4200000,
      transporte: 1900000,
      publicidad: 4100000,
      mantenimiento: 1400000,
      otros: 1800000,
    },
    12: {
      gastosOficina: 3800000,
      nomina: 24800000,
      serviciosPublicos: 2800000,
      arrendamiento: 5000000,
      impuestos: 4800000,
      transporte: 2200000,
      publicidad: 4800000,
      mantenimiento: 1600000,
      otros: 2100000,
    },
  },
  costOfGoodsSold: {
    1: { inventarioInicial: 15000000, compras: 8000000, inventarioFinal: 12000000 },
    2: { inventarioInicial: 12000000, compras: 10000000, inventarioFinal: 11000000 },
    3: { inventarioInicial: 11000000, compras: 9500000, inventarioFinal: 10500000 },
    6: { inventarioInicial: 10000000, compras: 12000000, inventarioFinal: 9000000 },
    12: { inventarioInicial: 9500000, compras: 14000000, inventarioFinal: 8500000 },
  },
}

const generateChartData = () => {
  const currentYear = new Date().getFullYear()
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]

  return months.map((month, index) => {
    const monthNum = index + 1
    const sales = MOCK_DATA.salesByPaymentMethod[monthNum as keyof typeof MOCK_DATA.salesByPaymentMethod]
    const expenses = MOCK_DATA.expensesByCategory[monthNum as keyof typeof MOCK_DATA.expensesByCategory]
    const cmv = MOCK_DATA.costOfGoodsSold[monthNum as keyof typeof MOCK_DATA.costOfGoodsSold]

    const totalSales = sales ? (sales.transferencia + sales.efectivo + sales.mipaquete) / 1000000 : 0
    const totalExpenses = expenses
      ? (expenses.gastosOficina +
          expenses.nomina +
          expenses.serviciosPublicos +
          expenses.arrendamiento +
          expenses.impuestos +
          expenses.transporte +
          expenses.publicidad +
          expenses.mantenimiento +
          expenses.otros) /
        1000000
      : 0
    const totalCMV = cmv ? (cmv.inventarioInicial + cmv.compras - cmv.inventarioFinal) / 1000000 : 0
    const utilidad = totalSales - totalExpenses - totalCMV

    return {
      month: `${month} ${currentYear}`,
      ventas: Math.round(totalSales * 10) / 10,
      gastos: Math.round(totalExpenses * 10) / 10,
      cmv: Math.round(totalCMV * 10) / 10,
      utilidad: Math.round(utilidad * 10) / 10,
    }
  })
}

const CHART_DATA = generateChartData()

export default function VentasGastosPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "setup">("overview")
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Ventas", "Gastos", "CMV"])
  const [selectedMonth, setSelectedMonth] = useState<number>(12)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    receiptNumber: "",
    purchaseType: "", // Cambiado de provider a purchaseType
    amount: "",
    expenseDate: "",
    category: "",
    paymentMethod: "",
    bank: "", // Nuevo campo para banco
    notes: "",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null) // Nuevo estado para archivo

  const currentYear = new Date().getFullYear()

  const filteredInvoices = useMemo(() => {
    let invoices = MOCK_DATA.invoices.filter((invoice) => invoice.month === selectedMonth)

    if (searchQuery.trim()) {
      invoices = invoices.filter((invoice) => invoice.docNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return invoices
  }, [selectedMonth, searchQuery])

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName],
    )
  }

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalBalance = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0)

  const formatCOP = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const selectedMonthName = MONTHS.find((m) => m.value === selectedMonth)?.fullName || "Mes"
  const salesData = MOCK_DATA.salesByPaymentMethod[selectedMonth as keyof typeof MOCK_DATA.salesByPaymentMethod] || {
    transferencia: 0,
    efectivo: 0,
    mipaquete: 0,
  }
  const expensesData = MOCK_DATA.expensesByCategory[selectedMonth as keyof typeof MOCK_DATA.expensesByCategory] || {
    gastosOficina: 0,
    nomina: 0,
    serviciosPublicos: 0,
    arrendamiento: 0,
    impuestos: 0,
    transporte: 0,
    publicidad: 0,
    mantenimiento: 0,
    otros: 0,
  }
  const cmvData = MOCK_DATA.costOfGoodsSold[selectedMonth as keyof typeof MOCK_DATA.costOfGoodsSold] || {
    inventarioInicial: 0,
    compras: 0,
    inventarioFinal: 0,
  }

  const totalVentas = salesData.transferencia + salesData.efectivo + salesData.mipaquete
  const totalGastos =
    expensesData.gastosOficina +
    expensesData.nomina +
    expensesData.serviciosPublicos +
    expensesData.arrendamiento +
    expensesData.impuestos +
    expensesData.transporte +
    expensesData.publicidad +
    expensesData.mantenimiento +
    expensesData.otros
  const totalCMV = cmvData.inventarioInicial + cmvData.compras - cmvData.inventarioFinal
  const utilidadReal = totalVentas - totalGastos - totalCMV

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que si es transferencia, debe tener archivo y banco
    if (expenseForm.paymentMethod === "transferencia") {
      if (!receiptFile) {
        alert("Debes adjuntar una captura de la transferencia")
        return
      }
      if (!expenseForm.bank) {
        alert("Debes seleccionar el banco de la transferencia")
        return
      }
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      let receiptUrl = null

      // Subir archivo a Vercel Blob si existe
      if (receiptFile) {
        const blob = await put(receiptFile.name, receiptFile, {
          access: "public",
        })
        receiptUrl = blob.url
      }

      const { data, error } = await supabase.from("expenses").insert({
        receipt_number: expenseForm.receiptNumber,
        purchase_type: expenseForm.purchaseType,
        amount: Number.parseFloat(expenseForm.amount),
        expense_date: expenseForm.expenseDate,
        category: expenseForm.category,
        payment_method: expenseForm.paymentMethod,
        bank: expenseForm.bank || null,
        receipt_url: receiptUrl,
        notes: expenseForm.notes || null,
        status: "pagado",
      })

      if (error) throw error

      // Resetear formulario
      setExpenseForm({
        receiptNumber: "",
        purchaseType: "",
        amount: "",
        expenseDate: "",
        category: "",
        paymentMethod: "",
        bank: "",
        notes: "",
      })
      setReceiptFile(null)
      setIsCreateExpenseOpen(false)
      alert("Gasto creado exitosamente")
    } catch (error) {
      console.error("Error al crear gasto:", error)
      alert("Error al crear el gasto. Por favor intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white px-8 py-6 shadow-lg border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-black text-zinc-900 tracking-tight">VENTAS & GASTOS</h1>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-1">Dashboard Financiero</p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Buscar por Nº documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border-zinc-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg">
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>

              <Button
                onClick={() => setIsCreateExpenseOpen(true)}
                className="bg-[#C8A96A] hover:bg-[#B8996A] text-white font-bold shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Gasto
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-0 mb-6">
            {MONTHS.map((month) => (
              <button
                key={month.value}
                onClick={() => setSelectedMonth(month.value)}
                className={`
                  flex-1 px-4 py-3 text-sm font-bold uppercase transition-all duration-200 border-r border-zinc-200 last:border-r-0
                  ${
                    selectedMonth === month.value
                      ? "bg-[#C8A96A] text-white shadow-lg"
                      : "bg-white text-zinc-600 hover:bg-zinc-50"
                  }
                `}
              >
                {month.name}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <Card className="p-6 rounded-2xl shadow-lg border border-zinc-200 bg-white">
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-700">Nº Documento</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-700">Nombre Cliente</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-700">Fecha Factura</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-700">Monto</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-zinc-700">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-zinc-900 text-center">
                            {invoice.docNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-center">{invoice.customerName}</td>
                          <td className="px-4 py-3 text-sm text-zinc-700 text-center">{invoice.invoiceDate}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-zinc-900 text-center tabular-nums">
                            {formatCOP(invoice.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-zinc-900 text-center tabular-nums">
                            {formatCOP(invoice.balance)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                          {searchQuery.trim()
                            ? `No se encontraron resultados para "${searchQuery}"`
                            : `No hay facturas para ${MONTHS.find((m) => m.value === selectedMonth)?.fullName}`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t-2 border-zinc-300">
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-sm font-black text-zinc-900 text-center">
                        Total
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-zinc-900 text-center tabular-nums">
                        {formatCOP(totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-zinc-900 text-center tabular-nums">
                        {formatCOP(totalBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6 mt-6">
            <div className="col-span-6">
              <Card className="p-6 rounded-2xl shadow-lg border border-zinc-200 bg-white">
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-100 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-zinc-700">Categoría</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-zinc-700">
                          {selectedMonthName} {currentYear}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Ventas */}
                      <tr className="bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                        <td
                          className="px-4 py-3 text-sm font-bold text-zinc-900 flex items-center gap-2"
                          onClick={() => toggleCategory("Ventas")}
                        >
                          {expandedCategories.includes("Ventas") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Ventas
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right tabular-nums text-emerald-600">
                          {formatCOP(totalVentas)}
                        </td>
                      </tr>
                      {expandedCategories.includes("Ventas") && (
                        <>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Transferencia</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(salesData.transferencia)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Efectivo</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(salesData.efectivo)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Pagado por Mipaquete</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(salesData.mipaquete)}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* Gastos */}
                      <tr className="bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                        <td
                          className="px-4 py-3 text-sm font-bold text-zinc-900 flex items-center gap-2"
                          onClick={() => toggleCategory("Gastos")}
                        >
                          {expandedCategories.includes("Gastos") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Gastos
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right tabular-nums text-red-600">
                          {formatCOP(totalGastos)}
                        </td>
                      </tr>
                      {expandedCategories.includes("Gastos") && (
                        <>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Gastos de Oficina</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.gastosOficina)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Nómina</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.nomina)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Servicios Públicos</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.serviciosPublicos)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Arrendamiento</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.arrendamiento)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Impuestos</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.impuestos)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Transporte</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.transporte)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Publicidad y Marketing</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.publicidad)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Mantenimiento</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.mantenimiento)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Otros Gastos</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(expensesData.otros)}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* Costo de Mercancía Vendida */}
                      <tr className="bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                        <td
                          className="px-4 py-3 text-sm font-bold text-zinc-900 flex items-center gap-2"
                          onClick={() => toggleCategory("CMV")}
                        >
                          {expandedCategories.includes("CMV") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Costo de Mercancía Vendida
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right tabular-nums text-orange-600">
                          {formatCOP(totalCMV)}
                        </td>
                      </tr>
                      {expandedCategories.includes("CMV") && (
                        <>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Inventario Inicial</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(cmvData.inventarioInicial)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Compras</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              {formatCOP(cmvData.compras)}
                            </td>
                          </tr>
                          <tr className="hover:bg-blue-50 transition-colors">
                            <td className="px-4 py-2 pl-12 text-sm text-zinc-700">Inventario Final</td>
                            <td className="px-4 py-2 text-sm font-semibold text-right tabular-nums text-zinc-900">
                              -{formatCOP(cmvData.inventarioFinal)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Utilidad Real */}
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1">
                        Utilidad Real del Mes
                      </p>
                      <p
                        className="text-2xl font-black tabular-nums"
                        style={{ color: utilidadReal >= 0 ? "#10b981" : "#ef4444" }}
                      >
                        {formatCOP(utilidadReal)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-zinc-600">
                      <p className="font-semibold">Ventas: {formatCOP(totalVentas)}</p>
                      <p className="font-semibold">- Gastos: {formatCOP(totalGastos)}</p>
                      <p className="font-semibold">- CMV: {formatCOP(totalCMV)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-span-6">
              <Card className="p-6 rounded-2xl shadow-lg border border-zinc-200 bg-white">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-zinc-900">Resumen Financiero Anual</h3>
                  <p className="text-xs text-zinc-500 mt-1">Valores en millones de pesos (COP)</p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: "11px", fontWeight: 600 }} />
                    <YAxis
                      stroke="#71717a"
                      style={{ fontSize: "11px", fontWeight: 600 }}
                      label={{
                        value: "Millones COP",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: "11px", fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        padding: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(1)}M`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} iconType="circle" />
                    <Bar dataKey="ventas" fill="#10b981" name="Ventas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cmv" fill="#f97316" name="CMV" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="utilidad"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Utilidad Real"
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={isCreateExpenseOpen} onOpenChange={setIsCreateExpenseOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Crear Nuevo Gasto</DialogTitle>
              <DialogDescription>Ingresa los detalles del gasto a registrar</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateExpense}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="receiptNumber">Número de Documento *</Label>
                  <Input
                    id="receiptNumber"
                    value={expenseForm.receiptNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="purchaseType">Tipo Compra/Pago *</Label>
                  <Input
                    id="purchaseType"
                    value={expenseForm.purchaseType}
                    onChange={(e) => setExpenseForm({ ...expenseForm, purchaseType: e.target.value })}
                    placeholder="Ej: Compra de suministros, Pago de servicios"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Monto (COP) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expenseDate">Fecha del Gasto *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gastos_oficina">Gastos de Oficina</SelectItem>
                      <SelectItem value="nomina">Nómina</SelectItem>
                      <SelectItem value="servicios_publicos">Servicios Públicos</SelectItem>
                      <SelectItem value="arrendamiento">Arrendamiento</SelectItem>
                      <SelectItem value="impuestos">Impuestos</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="publicidad">Publicidad y Marketing</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="otros">Otros Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <Select
                    value={expenseForm.paymentMethod}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentMethod: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {expenseForm.paymentMethod === "transferencia" && (
                  <div className="grid gap-2">
                    <Label htmlFor="bank">Banco *</Label>
                    <Select
                      value={expenseForm.bank}
                      onValueChange={(value) => setExpenseForm({ ...expenseForm, bank: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bancolombia">Bancolombia</SelectItem>
                        <SelectItem value="nequi">Nequi</SelectItem>
                        <SelectItem value="daviplata">Daviplata</SelectItem>
                        <SelectItem value="davivienda">Davivienda</SelectItem>
                        <SelectItem value="itau">Itaú</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="receiptFile">
                    Adjuntar Captura {expenseForm.paymentMethod === "transferencia" && "*"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="receiptFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      required={expenseForm.paymentMethod === "transferencia"}
                      className="cursor-pointer"
                    />
                    {receiptFile && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {receiptFile.name}
                      </span>
                    )}
                  </div>
                  {expenseForm.paymentMethod === "transferencia" && (
                    <p className="text-xs text-amber-600 font-semibold">* Obligatorio para transferencias</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateExpenseOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#C8A96A] hover:bg-[#B8996A]">
                  {isSubmitting ? "Guardando..." : "Crear Gasto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
