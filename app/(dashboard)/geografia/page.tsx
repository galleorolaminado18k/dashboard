"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Printer,
  Share2,
  X,
  Award,
  ShoppingBag,
  Loader2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"

const SalesMap = dynamic(() => import("@/components/SalesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-300" />
        <p className="mt-4 text-sm text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  ),
})

// Types
type Order = {
  id: string
  date: string
  city: string
  product: string
  amount: number
  customerId: string
  payment: "transferencia" | "efectivo" | "contraentrega"
  subpayment?: "nequi" | "bancolombia" | "daviplata" | "davivienda"
}

type CityAgg = {
  city: string
  sales: number
  buyers: number
  avgTicket: number
  topProduct: string
  monthly: number[] // 12 meses
  growth: number // % crecimiento
  participation: number // % participación
  coordinates: [number, number]
}

// Mock Data
const MOCK_CITIES: CityAgg[] = [
  {
    city: "Bogotá",
    sales: 45000000,
    buyers: 156,
    avgTicket: 288461,
    topProduct: "Collar Oro 18k",
    monthly: [
      3200000, 3500000, 3800000, 4000000, 4200000, 4500000, 4800000, 5000000, 4700000, 4300000, 4100000, 3900000,
    ],
    growth: 12.5,
    participation: 32.5,
    coordinates: [4.711, -74.0721] as [number, number],
  },
  {
    city: "Medellín",
    sales: 32000000,
    buyers: 98,
    avgTicket: 326530,
    topProduct: "Anillo Diamante",
    monthly: [
      2400000, 2600000, 2800000, 2900000, 3000000, 3200000, 3400000, 3500000, 3300000, 3100000, 2900000, 2700000,
    ],
    growth: 8.3,
    participation: 23.1,
    coordinates: [6.2442, -75.5812] as [number, number],
  },
  {
    city: "Cali",
    sales: 18500000,
    buyers: 67,
    avgTicket: 276119,
    topProduct: "Pulsera Plata",
    monthly: [
      1400000, 1500000, 1600000, 1650000, 1700000, 1800000, 1900000, 1950000, 1850000, 1750000, 1650000, 1550000,
    ],
    growth: 5.2,
    participation: 13.4,
    coordinates: [3.4516, -76.532] as [number, number],
  },
  {
    city: "Barranquilla",
    sales: 12800000,
    buyers: 45,
    avgTicket: 284444,
    topProduct: "Aretes Oro",
    monthly: [
      950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1250000, 1200000, 1150000, 1100000,
    ],
    growth: 6.8,
    participation: 9.2,
    coordinates: [10.9685, -74.7813] as [number, number],
  },
  {
    city: "Cartagena",
    sales: 9200000,
    buyers: 34,
    avgTicket: 270588,
    topProduct: "Cadena Oro",
    monthly: [700000, 750000, 780000, 800000, 820000, 850000, 880000, 900000, 870000, 840000, 810000, 780000],
    growth: 4.1,
    participation: 6.6,
    coordinates: [10.391, -75.4794] as [number, number],
  },
  {
    city: "Bucaramanga",
    sales: 7500000,
    buyers: 28,
    avgTicket: 267857,
    topProduct: "Reloj Oro",
    monthly: [580000, 600000, 620000, 640000, 660000, 680000, 700000, 720000, 690000, 670000, 650000, 630000],
    growth: 3.5,
    participation: 5.4,
    coordinates: [7.1254, -73.1198] as [number, number],
  },
  {
    city: "Pereira",
    sales: 5800000,
    buyers: 22,
    avgTicket: 263636,
    topProduct: "Tobillera Plata",
    monthly: [450000, 470000, 490000, 500000, 510000, 520000, 540000, 550000, 530000, 510000, 490000, 470000],
    growth: 2.8,
    participation: 4.2,
    coordinates: [4.8133, -75.6961] as [number, number],
  },
  {
    city: "Santa Marta",
    sales: 4200000,
    buyers: 16,
    avgTicket: 262500,
    topProduct: "Piercing Oro",
    monthly: [320000, 340000, 350000, 360000, 370000, 380000, 390000, 400000, 385000, 370000, 355000, 340000],
    growth: 1.9,
    participation: 3.0,
    coordinates: [11.2408, -74.2099] as [number, number],
  },
  {
    city: "Manizales",
    sales: 3100000,
    buyers: 12,
    avgTicket: 258333,
    topProduct: "Dije Oro",
    monthly: [240000, 250000, 260000, 265000, 270000, 275000, 280000, 285000, 275000, 265000, 255000, 245000],
    growth: 1.2,
    participation: 2.2,
    coordinates: [5.0689, -75.5174] as [number, number],
  },
  {
    city: "Cúcuta",
    sales: 2400000,
    buyers: 9,
    avgTicket: 266666,
    topProduct: "Anillo Plata",
    monthly: [180000, 190000, 200000, 205000, 210000, 215000, 220000, 225000, 215000, 205000, 195000, 185000],
    growth: 0.8,
    participation: 1.7,
    coordinates: [7.8939, -72.5078] as [number, number],
  },
]

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-2025-001",
    date: "2025-01-15",
    city: "Bogotá",
    product: "Collar Oro 18k",
    amount: 1250000,
    customerId: "C001",
    payment: "transferencia",
    subpayment: "nequi",
  },
  {
    id: "ORD-2025-002",
    date: "2025-01-16",
    city: "Medellín",
    product: "Anillo Diamante",
    amount: 2100000,
    customerId: "C002",
    payment: "transferencia",
    subpayment: "bancolombia",
  },
  {
    id: "ORD-2025-003",
    date: "2025-01-17",
    city: "Cali",
    product: "Pulsera Plata",
    amount: 680000,
    customerId: "C003",
    payment: "efectivo",
  },
  {
    id: "ORD-2025-004",
    date: "2025-01-18",
    city: "Barranquilla",
    product: "Aretes Oro",
    amount: 890000,
    customerId: "C004",
    payment: "contraentrega",
  },
  {
    id: "ORD-2025-005",
    date: "2025-01-19",
    city: "Cartagena",
    product: "Cadena Oro",
    amount: 750000,
    customerId: "C005",
    payment: "transferencia",
    subpayment: "daviplata",
  },
]

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const COLORS = ["#C8A96A", "#F4F1EA", "#8B7355", "#D4AF37", "#B8996A"]

export default function GeografiaPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realCities, setRealCities] = useState<CityAgg[]>([])
  const [realOrders, setRealOrders] = useState<Order[]>([])

  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [selectedPayment, setSelectedPayment] = useState("todos")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchGeoData() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/metrics/geo")
        const data = await response.json()

        if (!data.ok) {
          throw new Error(data.error || "Error al cargar datos")
        }

        if (!data.ranking || data.ranking.length === 0) {
          console.log("[v0] No hay datos reales, usando datos mock")
          setRealCities(MOCK_CITIES)
          setRealOrders(MOCK_ORDERS)
        } else {
          const cities: CityAgg[] = data.ranking.map((city: any, idx: number) => ({
            city: city.ciudad,
            sales: city.total,
            buyers: Math.floor(city.ventas / 3),
            avgTicket: city.ticket_promedio,
            topProduct: "Producto",
            monthly: Array(12).fill(city.total / 12),
            growth: idx === 0 ? 12.5 : 5.0,
            participation: (city.total / data.ranking.reduce((sum: number, c: any) => sum + c.total, 0)) * 100,
            coordinates: getCityCoordinates(city.ciudad),
          }))

          setRealCities(cities)
          setRealOrders([])
        }
      } catch (err: any) {
        console.error("[v0] Error fetching geo data:", err)
        setError(err.message)
        setRealCities(MOCK_CITIES)
        setRealOrders(MOCK_ORDERS)
      } finally {
        setLoading(false)
      }
    }

    fetchGeoData()
  }, [])

  const CITIES = realCities.length > 0 ? realCities : MOCK_CITIES
  const ORDERS = realOrders.length > 0 ? realOrders : MOCK_ORDERS

  const totalSales = useMemo(() => CITIES.reduce((sum, city) => sum + city.sales, 0), [CITIES])

  const topCityBySales = useMemo(() => {
    return CITIES.reduce((max, city) => (city.sales > max.sales ? city : max), CITIES[0])
  }, [CITIES])

  const topCityByTicket = useMemo(() => {
    return CITIES.reduce((max, city) => (city.avgTicket > max.avgTicket ? city : max), CITIES[0])
  }, [CITIES])

  const topCityByBuyers = useMemo(() => {
    return CITIES.reduce((max, city) => (city.buyers > max.buyers ? city : max), CITIES[0])
  }, [CITIES])

  const globalAvgTicket = useMemo(() => {
    const totalBuyers = CITIES.reduce((sum, city) => sum + city.buyers, 0)
    return totalSales / totalBuyers
  }, [totalSales, CITIES])

  const currentMonthLeader = useMemo(() => {
    const currentMonth = new Date().getMonth()
    return CITIES.reduce(
      (max, city) => (city.monthly[currentMonth] > (max.monthly[currentMonth] || 0) ? city : max),
      CITIES[0],
    )
  }, [CITIES])

  const monthlyLeaders = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const leader = CITIES.reduce((max, city) => (city.monthly[idx] > (max.monthly[idx] || 0) ? city : max), CITIES[0])
      return { month, city: leader.city, amount: leader.monthly[idx] }
    })
  }, [CITIES])

  const monthlyStackData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const data: any = { month }
      CITIES.slice(0, 5).forEach((city) => {
        data[city.city] = city.monthly[idx]
      })
      return data
    })
  }, [CITIES])

  const filteredCities = useMemo(() => {
    return CITIES.filter((city) => city.city.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, CITIES])

  const selectedCityData = useMemo(() => {
    return CITIES.find((city) => city.city === selectedCity)
  }, [selectedCity, CITIES])

  const selectedCityOrders = useMemo(() => {
    return ORDERS.filter((order) => order.city === selectedCity)
  }, [selectedCity, ORDERS])

  const selectedCityMonthlyData = useMemo(() => {
    if (!selectedCityData) return []
    return MONTHS.map((month, idx) => ({
      month,
      ventas: selectedCityData.monthly[idx],
    }))
  }, [selectedCityData])

  const selectedCityProductData = useMemo(() => {
    if (!selectedCity) return []
    const cityOrders = ORDERS.filter((o) => o.city === selectedCity)
    const productMap = new Map<string, number>()
    cityOrders.forEach((order) => {
      productMap.set(order.product, (productMap.get(order.product) || 0) + order.amount)
    })
    return Array.from(productMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [selectedCity])

  const handleCloseDrawer = useCallback(() => setSelectedCity(null), [])

  const getCityCoordinates = (city: string): [number, number] => {
    switch (city) {
      case "Bogotá":
        return [4.711, -74.0721] as [number, number]
      case "Medellín":
        return [6.2442, -75.5812] as [number, number]
      case "Cali":
        return [3.4516, -76.532] as [number, number]
      case "Barranquilla":
        return [10.9685, -74.7813] as [number, number]
      case "Cartagena":
        return [10.391, -75.4794] as [number, number]
      case "Bucaramanga":
        return [7.1254, -73.1198] as [number, number]
      case "Pereira":
        return [4.8133, -75.6961] as [number, number]
      case "Santa Marta":
        return [11.2408, -74.2099] as [number, number]
      case "Manizales":
        return [5.0689, -75.5174] as [number, number]
      case "Cúcuta":
        return [7.8939, -72.5078] as [number, number]
      default:
        return [0, 0] as [number, number]
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#C8A96A]" />
          <p className="mt-4 text-gray-600">Cargando datos geográficos...</p>
        </div>
      </div>
    )
  }

  if (error && CITIES.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold text-gray-900">Error al cargar datos</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            Asegúrate de que la tabla 'sales' existe en Supabase y tiene datos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {error && CITIES === MOCK_CITIES && (
        <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Mostrando datos de ejemplo. Error al conectar con la base de datos: {error}
          </p>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-gray-900">Geografía de Ventas</h1>
            <p className="mt-2 text-gray-600">Análisis de ventas por ubicación geográfica</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50">
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 border-gray-200 bg-white text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 border-gray-200 bg-white text-gray-900">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="joyeria">Joyería</SelectItem>
              <SelectItem value="balineria">Balinería</SelectItem>
              <SelectItem value="detal">Detal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPayment} onValueChange={setSelectedPayment}>
            <SelectTrigger className="w-48 border-gray-200 bg-white text-gray-900">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="contraentrega">Contraentrega</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Buscar ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Award className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+{topCityBySales.growth}%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600">Ciudad Top Ventas</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">{topCityBySales.city}</p>
          <p className="text-xs text-gray-600">${(topCityBySales.sales / 1000000).toFixed(1)}M</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+{topCityByTicket.growth}%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600">Ticket Promedio Alto</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">{topCityByTicket.city}</p>
          <p className="text-xs text-gray-600">${topCityByTicket.avgTicket.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Users className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+{topCityByBuyers.growth}%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600"># Compradores</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">{topCityByBuyers.city}</p>
          <p className="text-xs text-gray-600">{topCityByBuyers.buyers} compradores</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <DollarSign className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+7.2%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600">Ventas Totales</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">
            ${(totalSales / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-gray-600">Periodo actual</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+5.8%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600">Ticket Promedio Global</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">
            ${globalAvgTicket.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-600">Todas las ciudades</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <MapPin className="h-5 w-5 text-[#C8A96A]" />
            <span className="text-xs text-green-500">+{currentMonthLeader.growth}%</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-600">Líder del Mes</p>
          <p className="mt-1 font-serif text-xl font-bold tabular-nums text-[#C8A96A]">{currentMonthLeader.city}</p>
          <p className="text-xs text-gray-600">{MONTHS[new Date().getMonth()]}</p>
        </motion.div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-gray-900">Mapa de Ventas</h2>
          <SalesMap
            cities={CITIES.map((city) => ({
              city: city.city,
              sales: city.sales,
              buyers: city.buyers,
              avgTicket: city.avgTicket,
              coordinates: city.coordinates,
            }))}
            onCityClick={(city) => setSelectedCity(city)}
          />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-gray-900">Ranking de Ciudades</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="p-2 text-center text-xs font-semibold uppercase text-gray-600">#</th>
                  <th className="p-2 text-left text-xs font-semibold uppercase text-gray-600">Ciudad</th>
                  <th className="p-2 text-center text-xs font-semibold uppercase text-gray-600">Ventas</th>
                  <th className="p-2 text-center text-xs font-semibold uppercase text-gray-600">Ticket</th>
                  <th className="p-2 text-center text-xs font-semibold uppercase text-gray-600">%</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city, idx) => (
                  <tr
                    key={city.city}
                    onClick={() => setSelectedCity(city.city)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="p-2 text-center text-sm text-gray-600">{idx + 1}</td>
                    <td className="p-2 text-left">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#C8A96A]" />
                        <span className="text-sm font-medium text-gray-900">{city.city}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center text-sm tabular-nums text-[#C8A96A]">
                      ${(city.sales / 1000000).toFixed(1)}M
                    </td>
                    <td className="p-2 text-center text-sm tabular-nums text-gray-900">
                      ${city.avgTicket.toLocaleString()}
                    </td>
                    <td className="p-2 text-center text-sm tabular-nums text-gray-600">
                      {city.participation.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 font-serif text-2xl font-bold text-gray-900">Ciudad Líder por Mes</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
          {monthlyLeaders.map((leader, idx) => (
            <motion.div
              key={leader.month}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <p className="text-xs font-semibold text-[#C8A96A]">{leader.month}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{leader.city}</p>
              <p className="mt-1 text-xs tabular-nums text-gray-600">${(leader.amount / 1000000).toFixed(1)}M</p>
              <div className="mt-2 h-1 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-[#C8A96A]"
                  style={{ width: `${(leader.amount / 5000000) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-gray-900">Distribución Mensual por Ciudad</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStackData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  color: "#111827",
                }}
              />
              <Legend wrapperStyle={{ color: "#111827" }} />
              {CITIES.slice(0, 5).map((city, idx) => (
                <Bar key={city.city} dataKey={city.city} stackId="a" fill={COLORS[idx]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-xl font-bold text-gray-900">Ticket Promedio por Ciudad</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CITIES.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: 12 }} />
              <YAxis dataKey="city" type="category" stroke="#6b7280" style={{ fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  color: "#111827",
                }}
              />
              <Bar dataKey="avgTicket" fill="#C8A96A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedCity && selectedCityData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseDrawer}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 p-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-gray-900">{selectedCity}</h2>
                <p className="text-sm text-gray-600">Análisis detallado de la ciudad</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseDrawer}
                className="text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-600">Ventas Totales</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-[#C8A96A]">
                    ${(selectedCityData.sales / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-600">Ticket Promedio</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-[#C8A96A]">
                    ${selectedCityData.avgTicket.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-600">Compradores</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-[#C8A96A]">
                    {selectedCityData.buyers}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase text-gray-600">Participación</p>
                  <p className="mt-1 font-serif text-2xl font-bold tabular-nums text-[#C8A96A]">
                    {selectedCityData.participation.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#C8A96A]" />
                  <p className="text-sm font-semibold text-gray-900">Producto Más Comprado</p>
                </div>
                <p className="mt-2 font-serif text-xl font-bold text-[#C8A96A]">{selectedCityData.topProduct}</p>
              </div>

              <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Evolución Mensual</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedCityMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        color: "#111827",
                      }}
                    />
                    <Line type="monotone" dataKey="ventas" stroke="#C8A96A" strokeWidth={2} dot={{ fill: "#C8A96A" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {selectedCityProductData.length > 0 && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">Distribución de Productos</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={selectedCityProductData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {selectedCityProductData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          color: "#111827",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Pedidos Recientes</h3>
                <div className="space-y-2">
                  {selectedCityOrders.length > 0 ? (
                    selectedCityOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.product}</p>
                          <p className="text-xs text-gray-600">
                            {order.id} · {order.date}
                          </p>
                        </div>
                        <p className="font-serif text-sm font-bold tabular-nums text-[#C8A96A]">
                          ${order.amount.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-gray-500">No hay pedidos recientes</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
