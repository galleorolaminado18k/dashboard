"use client"

import type React from "react"
import { useState, useMemo, useCallback } from "react"
import {
  Search,
  Download,
  Printer,
  Share2,
  Phone,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Gem,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

type Cliente = {
  id: string
  nombre: string
  email: string
  telefono: string
  ciudad: string
  tipo: "Mayorista Joyería" | "Balinería" | "Detal"
  asesor: string
  ultimaCompra: string
  frecuencia: number
  totalAcumulado: number
  monthlySpent: number[]
  jewelrySpent: number
  balineriaSpent: number
  detalSpent: number
  esProspecto: boolean
  incentivosGanados: Array<{ nivel: number; premio: string; fecha: string }>
  rfmScore: "Bueno" | "Atención" | "Riesgo"
}

const INCENTIVOS = [
  { nivel: 1, monto: 1000000, premio: "Bono Éxito $100K", icon: "🎁" },
  { nivel: 2, monto: 3000000, premio: "Bono Vélez $300K", icon: "🎁" },
  { nivel: 3, monto: 8000000, premio: "Efectivo $800K", icon: "💵" },
  { nivel: 4, monto: 10000000, premio: "Efectivo $1M", icon: "💵" },
  { nivel: 5, monto: 15000000, premio: "Patineta Xiaomi", icon: "🛴" },
  { nivel: 6, monto: 30000000, premio: "Viaje San Andrés", icon: "✈️" },
  { nivel: 7, monto: 35000000, premio: "Efectivo $3.5M", icon: "💵" },
  { nivel: 8, monto: 50000000, premio: 'TV Samsung 70"', icon: "📺" },
  { nivel: 9, monto: 80000000, premio: "Moto Suzuki GN 125", icon: "🏍️" },
  { nivel: 10, monto: 100000000, premio: "Moto AKT TT 200", icon: "🏍️" },
  { nivel: 11, monto: 150000000, premio: "Viaje Cancún", icon: "✈️" },
  { nivel: 12, monto: 200000000, premio: "Crucero Caribe", icon: "🚢" },
  { nivel: 13, monto: 250000000, premio: "Viaje Río + $2M", icon: "✈️" },
  { nivel: 14, monto: 300000000, premio: "Viaje París + $4M", icon: "✈️" },
  { nivel: 15, monto: 500000000, premio: "Rolex Datejust", icon: "⌚" },
  { nivel: 16, monto: 800000000, premio: "Mazda 2 Sedán", icon: "🚗" },
  { nivel: 17, monto: 1000000000, premio: "Toyota Corolla", icon: "🚗" },
  { nivel: 18, monto: 1500000000, premio: "Audi Q2", icon: "🚗" },
  { nivel: 19, monto: 1800000000, premio: "BMW X2", icon: "🚗" },
  { nivel: 20, monto: 2000000000, premio: "Efectivo $200M", icon: "💵" },
]

const MOCK_CLIENTES: Cliente[] = [
  {
    id: "1",
    nombre: "María González",
    email: "maria.gonzalez@email.com",
    telefono: "+57 300 123 4567",
    ciudad: "Bogotá",
    tipo: "Mayorista Joyería",
    asesor: "Carlos Méndez",
    ultimaCompra: "2025-01-10",
    frecuencia: 12,
    totalAcumulado: 145000000,
    monthlySpent: [
      8000000, 10000000, 12000000, 15000000, 11000000, 13000000, 14000000, 12000000, 10000000, 15000000, 13000000,
      12000000,
    ],
    jewelrySpent: 145000000,
    balineriaSpent: 0,
    detalSpent: 0,
    esProspecto: false,
    incentivosGanados: [
      { nivel: 1, premio: "Bono Éxito $100K", fecha: "2024-01-15" },
      { nivel: 5, premio: "Patineta Xiaomi", fecha: "2024-06-20" },
    ],
    rfmScore: "Bueno",
  },
  {
    id: "2",
    nombre: "Carlos Ramírez",
    email: "carlos.ramirez@email.com",
    telefono: "+57 301 234 5678",
    ciudad: "Medellín",
    tipo: "Balinería",
    asesor: "Ana López",
    ultimaCompra: "2025-01-12",
    frecuencia: 8,
    totalAcumulado: 750000,
    monthlySpent: [50000, 60000, 70000, 80000, 90000, 100000, 80000, 70000, 60000, 50000, 40000, 100000],
    jewelrySpent: 0,
    balineriaSpent: 750000,
    detalSpent: 0,
    esProspecto: true,
    incentivosGanados: [],
    rfmScore: "Bueno",
  },
  {
    id: "3",
    nombre: "Ana Martínez",
    email: "ana.martinez@email.com",
    telefono: "+57 302 345 6789",
    ciudad: "Cali",
    tipo: "Detal",
    asesor: "Pedro Ruiz",
    ultimaCompra: "2024-11-11",
    frecuencia: 5,
    totalAcumulado: 280000,
    monthlySpent: [20000, 25000, 30000, 35000, 40000, 30000, 25000, 20000, 15000, 10000, 15000, 15000],
    jewelrySpent: 0,
    balineriaSpent: 0,
    detalSpent: 280000,
    esProspecto: false,
    incentivosGanados: [],
    rfmScore: "Riesgo",
  },
  {
    id: "4",
    nombre: "Luis Hernández",
    email: "luis.hernandez@email.com",
    telefono: "+57 303 456 7890",
    ciudad: "Barranquilla",
    tipo: "Mayorista Joyería",
    asesor: "María Silva",
    ultimaCompra: "2025-01-09",
    frecuencia: 18,
    totalAcumulado: 325000000,
    monthlySpent: [
      25000000, 28000000, 30000000, 27000000, 26000000, 29000000, 31000000, 28000000, 25000000, 27000000, 26000000,
      23000000,
    ],
    jewelrySpent: 325000000,
    balineriaSpent: 0,
    detalSpent: 0,
    esProspecto: false,
    incentivosGanados: [
      { nivel: 1, premio: "Bono Éxito $100K", fecha: "2023-11-10" },
      { nivel: 6, premio: "Viaje San Andrés", fecha: "2024-03-05" },
      { nivel: 14, premio: "Viaje París + $4M", fecha: "2024-12-01" },
    ],
    rfmScore: "Bueno",
  },
  {
    id: "5",
    nombre: "Patricia Silva",
    email: "patricia.silva@email.com",
    telefono: "+57 304 567 8901",
    ciudad: "Cartagena",
    tipo: "Balinería",
    asesor: "Jorge Díaz",
    ultimaCompra: "2024-12-08",
    frecuencia: 6,
    totalAcumulado: 420000,
    monthlySpent: [30000, 35000, 40000, 45000, 50000, 40000, 35000, 30000, 25000, 30000, 35000, 25000],
    jewelrySpent: 0,
    balineriaSpent: 420000,
    detalSpent: 0,
    esProspecto: false,
    incentivosGanados: [],
    rfmScore: "Atención",
  },
  {
    id: "6",
    nombre: "Roberto Díaz",
    email: "roberto.diaz@email.com",
    telefono: "+57 305 678 9012",
    ciudad: "Bucaramanga",
    tipo: "Detal",
    asesor: "Laura Gómez",
    ultimaCompra: "2025-01-13",
    frecuencia: 9,
    totalAcumulado: 580000,
    monthlySpent: [40000, 45000, 50000, 55000, 60000, 50000, 45000, 40000, 35000, 50000, 55000, 55000],
    jewelrySpent: 0,
    balineriaSpent: 0,
    detalSpent: 580000,
    esProspecto: true,
    incentivosGanados: [],
    rfmScore: "Bueno",
  },
  {
    id: "7",
    nombre: "Laura Pérez",
    email: "laura.perez@email.com",
    telefono: "+57 306 789 0123",
    ciudad: "Pereira",
    tipo: "Mayorista Joyería",
    asesor: "Diego Castro",
    ultimaCompra: "2025-01-07",
    frecuencia: 15,
    totalAcumulado: 89000000,
    monthlySpent: [
      6000000, 7000000, 8000000, 7500000, 7000000, 8000000, 8500000, 7000000, 6500000, 8000000, 7500000, 7000000,
    ],
    jewelrySpent: 89000000,
    balineriaSpent: 0,
    detalSpent: 0,
    esProspecto: false,
    incentivosGanados: [
      { nivel: 1, premio: "Bono Éxito $100K", fecha: "2024-02-20" },
      { nivel: 3, premio: "Efectivo $800K", fecha: "2024-08-15" },
    ],
    rfmScore: "Bueno",
  },
  {
    id: "8",
    nombre: "Diego Torres",
    email: "diego.torres@email.com",
    telefono: "+57 307 890 1234",
    ciudad: "Manizales",
    tipo: "Balinería",
    asesor: "Sofía Vargas",
    ultimaCompra: "2025-01-14",
    frecuencia: 7,
    totalAcumulado: 650000,
    monthlySpent: [45000, 50000, 55000, 60000, 65000, 55000, 50000, 45000, 40000, 55000, 60000, 70000],
    jewelrySpent: 0,
    balineriaSpent: 650000,
    detalSpent: 0,
    esProspecto: true,
    incentivosGanados: [],
    rfmScore: "Bueno",
  },
]

const TIPOS_CLIENTE = [
  { id: "todos", label: "Todos", icon: "👥" },
  { id: "mayorista", label: "Mayoristas Joyería", icon: "✨" },
  { id: "balineria", label: "Balinería", icon: "🛍️" },
  { id: "detal", label: "Detal", icon: "⭕" },
  { id: "prospectos", label: "Prospectos 🔥", icon: "" },
]

export default function ClientesPage() {
  const [selectedTipo, setSelectedTipo] = useState("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const filteredClientes = useMemo(() => {
    return MOCK_CLIENTES.filter((cliente) => {
      const matchesTipo =
        selectedTipo === "todos" ||
        (selectedTipo === "mayorista" && cliente.tipo === "Mayorista Joyería") ||
        (selectedTipo === "balineria" && cliente.tipo === "Balinería") ||
        (selectedTipo === "detal" && cliente.tipo === "Detal") ||
        (selectedTipo === "prospectos" && cliente.esProspecto)

      const matchesSearch =
        searchQuery === "" ||
        cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cliente.ciudad.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTipo && matchesSearch
    })
  }, [selectedTipo, searchQuery])

  const kpis = useMemo(() => {
    const activos = MOCK_CLIENTES.filter((c) => {
      const daysSinceLastOrder = Math.floor(
        (new Date().getTime() - new Date(c.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysSinceLastOrder <= 30
    }).length

    const nuevos = MOCK_CLIENTES.filter((c) => c.frecuencia <= 3).length

    const recompra = (MOCK_CLIENTES.filter((c) => c.frecuencia > 1).length / MOCK_CLIENTES.length) * 100

    const ticketPromedio =
      MOCK_CLIENTES.reduce((sum, c) => sum + c.totalAcumulado, 0) /
      MOCK_CLIENTES.reduce((sum, c) => sum + c.frecuencia, 0)

    const ventasMes = MOCK_CLIENTES.reduce((sum, c) => sum + c.monthlySpent[11], 0)

    const incentivosEntregados = MOCK_CLIENTES.reduce((sum, c) => sum + c.incentivosGanados.length, 0)

    return { activos, nuevos, recompra, ticketPromedio, ventasMes, incentivosEntregados }
  }, [])

  const topClientes = useMemo(() => {
    return [...MOCK_CLIENTES].sort((a, b) => b.totalAcumulado - a.totalAcumulado).slice(0, 10)
  }, [])

  const clientesRiesgo = useMemo(() => {
    return [...MOCK_CLIENTES]
      .map((c) => ({
        ...c,
        daysSinceLastOrder: Math.floor(
          (new Date().getTime() - new Date(c.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24),
        ),
      }))
      .filter((c) => c.daysSinceLastOrder > 30)
      .sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder)
      .slice(0, 5)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleTipoChange = useCallback((tipo: string) => {
    setSelectedTipo(tipo)
  }, [])

  const handleClienteClick = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setSelectedCliente(null)
  }, [])

  const getProximoIncentivo = useCallback((totalAcumulado: number) => {
    return INCENTIVOS.find((inc) => inc.monto > totalAcumulado) || INCENTIVOS[INCENTIVOS.length - 1]
  }, [])

  const getProgreso = useCallback(
    (totalAcumulado: number) => {
      const proximo = getProximoIncentivo(totalAcumulado)
      const anterior = INCENTIVOS.find((inc, idx) => INCENTIVOS[idx + 1]?.nivel === proximo.nivel) || INCENTIVOS[0]
      const progreso = ((totalAcumulado - anterior.monto) / (proximo.monto - anterior.monto)) * 100
      return Math.min(Math.max(progreso, 0), 100)
    },
    [getProximoIncentivo],
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-gray-900">Seguimiento de Clientes</h1>
            <p className="mt-2 text-sm text-gray-600">
              Gestión premium de Mayoristas Joyería, Balinería y Clientes Detal
            </p>
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
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-[#F5F5F7] px-8 py-4">
        <div className="flex gap-2">
          {TIPOS_CLIENTE.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => handleTipoChange(tipo.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                selectedTipo === tipo.id
                  ? "bg-[#C8A96A] text-white shadow-lg shadow-[#C8A96A]/30"
                  : "bg-white/80 text-gray-700 backdrop-blur-sm hover:bg-white"
              }`}
            >
              {tipo.icon && <span className="mr-2">{tipo.icon}</span>}
              {tipo.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Activos */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Activos</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-gray-900">{kpis.activos}</div>
              <ResponsiveContainer width="100%" height={30}>
                <LineChart data={[{ v: 45 }, { v: 52 }, { v: 48 }, { v: 61 }, { v: 55 }, { v: kpis.activos }]}>
                  <Line type="monotone" dataKey="v" stroke="#C8A96A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nuevos */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Nuevos</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-gray-900">{kpis.nuevos}</div>
              <ResponsiveContainer width="100%" height={30}>
                <LineChart data={[{ v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 11 }, { v: kpis.nuevos }]}>
                  <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recompra % */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Recompra %</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-gray-900">
                {kpis.recompra.toFixed(0)}%
              </div>
              <ResponsiveContainer width="100%" height={30}>
                <LineChart data={[{ v: 82 }, { v: 85 }, { v: 83 }, { v: 88 }, { v: 86 }, { v: kpis.recompra }]}>
                  <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Promedio */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Ticket Prom.</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-[#C8A96A]">
                ${(kpis.ticketPromedio / 1000000).toFixed(1)}M
              </div>
              <ResponsiveContainer width="100%" height={30}>
                <BarChart
                  data={[
                    { v: 8.2 },
                    { v: 8.5 },
                    { v: 8.8 },
                    { v: 9.1 },
                    { v: 8.9 },
                    { v: kpis.ticketPromedio / 1000000 },
                  ]}
                >
                  <Bar dataKey="v" fill="#C8A96A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ventas Mes */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Ventas Mes</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-gray-900">
                ${(kpis.ventasMes / 1000000).toFixed(0)}M
              </div>
              <ResponsiveContainer width="100%" height={30}>
                <LineChart
                  data={[{ v: 95 }, { v: 102 }, { v: 98 }, { v: 110 }, { v: 105 }, { v: kpis.ventasMes / 1000000 }]}
                >
                  <Line type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incentivos Entregados */}
          <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,.15)]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#C8A96A] via-amber-400 to-[#C8A96A] p-[1px]">
              <div className="h-full w-full rounded-3xl bg-white" />
            </div>
            <div className="relative">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Incentivos</div>
              <div className="mb-3 font-serif text-3xl font-bold tabular-nums text-gray-900">
                {kpis.incentivosEntregados}
              </div>
              <ResponsiveContainer width="100%" height={30}>
                <BarChart data={[{ v: 3 }, { v: 4 }, { v: 5 }, { v: 6 }, { v: 5 }, { v: kpis.incentivosEntregados }]}>
                  <Bar dataKey="v" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top 10 por Ventas */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)]">
            <h3 className="mb-4 font-serif text-xl font-bold text-gray-900">Top 10 por Ventas</h3>
            <div className="space-y-3">
              {topClientes.map((cliente, idx) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFAFC] p-3 transition-all hover:border-[#C8A96A]/30 hover:bg-white"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A96A] to-amber-500 text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                    <div className="text-xs text-gray-500">{cliente.ciudad}</div>
                  </div>
                  <div className="w-20">
                    <ResponsiveContainer width="100%" height={20}>
                      <LineChart data={cliente.monthlySpent.map((v) => ({ v }))}>
                        <Line type="monotone" dataKey="v" stroke="#C8A96A" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-sm font-bold tabular-nums text-[#C8A96A]">
                      ${(cliente.totalAcumulado / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Riesgo de Fuga */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)]">
            <h3 className="mb-4 font-serif text-xl font-bold text-gray-900">Riesgo de Fuga</h3>
            <div className="space-y-3">
              {clientesRiesgo.length > 0 ? (
                clientesRiesgo.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-3 transition-all hover:border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                      <div className="text-xs text-gray-500">{cliente.ciudad}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-red-600">{cliente.daysSinceLastOrder} días</div>
                      <div className="text-xs text-gray-500">sin comprar</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="mb-2 h-12 w-12 text-green-500" />
                  <p className="text-sm font-medium text-gray-900">¡Excelente!</p>
                  <p className="text-xs text-gray-500">No hay clientes en riesgo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Lista de Clientes</h2>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, email o ciudad..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,.08)]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#F5F5F7]">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Cliente
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Segmento
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Ciudad
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Asesor
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Última Compra
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Frecuencia
                </th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Total Acumulado
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Progreso a Incentivo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClientes.map((cliente, idx) => {
                const proximoIncentivo = getProximoIncentivo(cliente.totalAcumulado)
                const progreso = getProgreso(cliente.totalAcumulado)

                return (
                  <tr
                    key={cliente.id}
                    onClick={() => handleClienteClick(cliente)}
                    className={`cursor-pointer transition-colors hover:bg-[#F5F5F7] ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FAFAFC]"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A96A] to-amber-500 text-sm font-bold text-white shadow-md">
                          {cliente.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                          <div className="text-xs text-gray-500">{cliente.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant="secondary"
                        className={
                          cliente.tipo === "Mayorista Joyería"
                            ? "bg-purple-100 text-purple-700"
                            : cliente.tipo === "Balinería"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }
                      >
                        {cliente.tipo}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{cliente.ciudad}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{cliente.asesor}</td>
                    <td className="px-4 py-4 text-xs text-gray-600">{cliente.ultimaCompra}</td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {cliente.frecuencia}x
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-serif text-sm font-bold tabular-nums text-[#C8A96A]">
                        ${(cliente.totalAcumulado / 1000000).toFixed(cliente.totalAcumulado >= 1000000 ? 1 : 0)}
                        {cliente.totalAcumulado >= 1000000 ? "M" : "K"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {cliente.esProspecto && cliente.tipo !== "Mayorista Joyería" && (
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 shadow-sm shadow-orange-200"
                          >
                            🔥 Prospecto Mayorista
                          </Badge>
                        )}
                        <div className="relative h-3 w-48 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-gradient-to-r from-[#C8A96A] via-amber-400 to-amber-500 shadow-inner"
                            style={{ width: `${progreso}%` }}
                          />
                          {INCENTIVOS.map((inc, idx) => (
                            <div
                              key={inc.nivel}
                              className="absolute top-0 h-full w-[2px] bg-white/60"
                              style={{ left: `${(idx / (INCENTIVOS.length - 1)) * 100}%` }}
                              title={`${inc.premio} - $${(inc.monto / 1000000).toFixed(0)}M`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCliente && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={handleCloseDrawer}>
          <div
            className="absolute right-0 top-0 h-full w-[600px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              {/* Header con gradiente dorado */}
              <div className="border-b border-gray-200 bg-gradient-to-br from-[#C8A96A] via-amber-500 to-amber-600 p-8 text-white">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-3xl font-bold">Detalles del Cliente</h2>
                  <button onClick={handleCloseDrawer} className="rounded-full p-2 transition-colors hover:bg-white/20">
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  {/* Avatar con anillo dorado */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-white via-amber-200 to-white opacity-50 blur-md" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-[#C8A96A] shadow-2xl ring-4 ring-white/50">
                      {selectedCliente.nombre.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 font-serif text-2xl font-bold">{selectedCliente.nombre}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={
                          selectedCliente.tipo === "Mayorista Joyería"
                            ? "bg-purple-100 text-purple-700"
                            : selectedCliente.tipo === "Balinería"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }
                      >
                        {selectedCliente.tipo}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          selectedCliente.rfmScore === "Bueno"
                            ? "bg-green-100 text-green-700"
                            : selectedCliente.rfmScore === "Atención"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }
                      >
                        RFM: {selectedCliente.rfmScore}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {/* Información de Contacto */}
                <div className="mb-8">
                  <h4 className="mb-4 font-serif text-xl font-bold text-gray-900">Información de Contacto</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFAFC] p-3">
                      <Mail className="h-5 w-5 text-[#C8A96A]" />
                      <span className="text-sm text-gray-700">{selectedCliente.email}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFAFC] p-3">
                      <Phone className="h-5 w-5 text-[#C8A96A]" />
                      <span className="text-sm text-gray-700">{selectedCliente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#FAFAFC] p-3">
                      <MapPin className="h-5 w-5 text-[#C8A96A]" />
                      <span className="text-sm text-gray-700">{selectedCliente.ciudad}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas Clave */}
                <div className="mb-8 grid grid-cols-2 gap-4">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#FAFAFC] to-white p-5 shadow-sm">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Total Acumulado
                    </div>
                    <div className="font-serif text-3xl font-bold tabular-nums text-[#C8A96A]">
                      ${(selectedCliente.totalAcumulado / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#FAFAFC] to-white p-5 shadow-sm">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Frecuencia</div>
                    <div className="font-serif text-3xl font-bold tabular-nums text-gray-900">
                      {selectedCliente.frecuencia}x
                    </div>
                  </div>
                </div>

                {/* Mix de Compra (Pie Chart) */}
                <div className="mb-8">
                  <h4 className="mb-4 font-serif text-xl font-bold text-gray-900">Mix de Compra</h4>
                  <div className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-[#FAFAFC] p-6">
                    <ResponsiveContainer width={120} height={120}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Joyería", value: selectedCliente.jewelrySpent },
                            { name: "Balinería", value: selectedCliente.balineriaSpent },
                            { name: "Detal", value: selectedCliente.detalSpent },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#C8A96A" />
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {selectedCliente.jewelrySpent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gem className="h-4 w-4 text-[#C8A96A]" />
                            <span className="text-sm text-gray-700">Joyería</span>
                          </div>
                          <span className="font-serif text-sm font-bold tabular-nums text-gray-900">
                            ${(selectedCliente.jewelrySpent / 1000000).toFixed(1)}M
                          </span>
                        </div>
                      )}
                      {selectedCliente.balineriaSpent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700">Balinería</span>
                          </div>
                          <span className="font-serif text-sm font-bold tabular-nums text-gray-900">
                            ${(selectedCliente.balineriaSpent / 1000).toFixed(0)}K
                          </span>
                        </div>
                      )}
                      {selectedCliente.detalSpent > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700">Detal</span>
                          </div>
                          <span className="font-serif text-sm font-bold tabular-nums text-gray-900">
                            ${(selectedCliente.detalSpent / 1000).toFixed(0)}K
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Próximo Incentivo */}
                <div className="mb-8">
                  <h4 className="mb-4 font-serif text-xl font-bold text-gray-900">Próximo Incentivo</h4>
                  <div className="overflow-hidden rounded-2xl border border-[#C8A96A]/30 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-6 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="mb-1 text-2xl">{getProximoIncentivo(selectedCliente.totalAcumulado).icon}</div>
                        <div className="font-serif text-lg font-bold text-gray-900">
                          {getProximoIncentivo(selectedCliente.totalAcumulado).premio}
                        </div>
                      </div>
                      <Award className="h-8 w-8 text-[#C8A96A]" />
                    </div>
                    <div className="mb-3 h-3 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-[#C8A96A] via-amber-400 to-amber-500 shadow-inner"
                        style={{ width: `${getProgreso(selectedCliente.totalAcumulado)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Progreso: {getProgreso(selectedCliente.totalAcumulado).toFixed(0)}%</span>
                      <span className="font-semibold">
                        ${(getProximoIncentivo(selectedCliente.totalAcumulado).monto / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline de Incentivos Ganados */}
                {selectedCliente.incentivosGanados.length > 0 && (
                  <div className="mb-8">
                    <h4 className="mb-4 font-serif text-xl font-bold text-gray-900">Incentivos Ganados</h4>
                    <div className="space-y-3">
                      {selectedCliente.incentivosGanados.map((incentivo, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#C8A96A]/30 hover:shadow-md"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A96A] to-amber-500 text-white shadow-md">
                            <Award className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-serif text-sm font-bold text-gray-900">{incentivo.premio}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {incentivo.fecha}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Nivel {incentivo.nivel}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IA Comercial */}
                <div>
                  <h4 className="mb-4 font-serif text-xl font-bold text-gray-900">IA Comercial</h4>
                  <div className="space-y-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-[#FAFAFC] to-white p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-900">Cómo nos fue</div>
                        <div className="text-xs text-gray-600">Incremento del 15% en compras vs. mes anterior</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                        Bueno
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingDown className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-900">Variaciones</div>
                        <div className="text-xs text-gray-600">Frecuencia estable en los últimos 3 meses</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700">
                        Neutro
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-900">Alertas</div>
                        <div className="text-xs text-gray-600">Próximo a alcanzar incentivo de nivel superior</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-700">
                        Atención
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-500" />
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-900">Acciones</div>
                        <div className="text-xs text-gray-600">Ofrecer productos premium para acelerar progreso</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                        Bueno
                      </Badge>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="mt-0.5 h-5 w-5 text-purple-500" />
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-900">Proyección</div>
                        <div className="text-xs text-gray-600">
                          Alcanzará próximo incentivo en ~2 meses al ritmo actual
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
                        Bueno
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
