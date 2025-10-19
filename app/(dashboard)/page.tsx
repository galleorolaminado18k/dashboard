"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  MapPin,
  AlertTriangle,
  Download,
} from "lucide-react"
import {
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

// Datos mock
const kpiData = {
  ventasMes: 45680000,
  ventasMesAnterior: 42300000,
  margenPromedio: 32.5,
  tasaConversion: 68.3,
  ticketPromedio: 1250000,
  pendienteMiPaquete: 15,
}

const ventasDiarias = [
  { dia: "1", ventas: 1200000 },
  { dia: "5", ventas: 1800000 },
  { dia: "10", ventas: 1500000 },
  { dia: "15", ventas: 2100000 },
  { dia: "20", ventas: 1900000 },
  { dia: "25", ventas: 2400000 },
  { dia: "30", ventas: 2200000 },
]

const metodosPago = [
  { name: "Transferencia", value: 45, color: "#C8A96A" },
  { name: "Efectivo", value: 30, color: "#8B6914" },
  { name: "Tarjeta", value: 20, color: "#D9C99A" },
  { name: "Crédito", value: 5, color: "#F3E9BA" },
]

const rankingCiudades = [
  { ciudad: "Bogotá", ventas: 18500000, pedidos: 145 },
  { ciudad: "Medellín", ventas: 12300000, pedidos: 98 },
  { ciudad: "Cali", ventas: 8900000, pedidos: 72 },
  { ciudad: "Barranquilla", ventas: 5980000, pedidos: 48 },
]

const ultimasVentas = [
  {
    id: "V-1234",
    cliente: "Joyería El Dorado",
    monto: 3500000,
    fecha: "2025-01-15",
    estado: "Completado",
  },
  {
    id: "V-1235",
    cliente: "Balinería Premium",
    monto: 2800000,
    fecha: "2025-01-15",
    estado: "Pendiente",
  },
  {
    id: "V-1236",
    cliente: "Accesorios Luxury",
    monto: 4200000,
    fecha: "2025-01-14",
    estado: "Completado",
  },
]

const mayoristas = {
  joyeria: { nuevos: 12, recurrentes: 45 },
  balineria: { nuevos: 8, recurrentes: 32 },
}

const riesgoFuga = [
  { cliente: "Joyería Central", diasSinComprar: 45, ultimaCompra: 2500000 },
  { cliente: "Balinería Express", diasSinComprar: 38, ultimaCompra: 1800000 },
  { cliente: "Accesorios Plus", diasSinComprar: 32, ultimaCompra: 3200000 },
]

const formatCOP = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

export default function DashboardPage() {
  const cambioVentas = ((kpiData.ventasMes - kpiData.ventasMesAnterior) / kpiData.ventasMesAnterior) * 100

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-2 text-lg">Resumen ejecutivo de ventas y métricas clave</p>
          </div>
          <Button className="bg-[#C8A96A] hover:bg-[#8B6914] text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base">
            <Download className="h-5 w-5 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Ventas del Mes */}
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-[#C8A96A]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Ventas del Mes
              </CardTitle>
              <div className="p-2 bg-[#C8A96A]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#C8A96A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{formatCOP(kpiData.ventasMes)}</div>
              <div className="flex items-center gap-2">
                {cambioVentas > 0 ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">+{cambioVentas.toFixed(1)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">{cambioVentas.toFixed(1)}%</span>
                  </div>
                )}
                <span className="text-sm text-gray-500">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Margen Promedio */}
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-[#C8A96A]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Margen Promedio
              </CardTitle>
              <div className="p-2 bg-[#C8A96A]/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#C8A96A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpiData.margenPromedio}%</div>
              <p className="text-sm text-gray-500">Utilidad sobre ventas</p>
            </CardContent>
          </Card>

          {/* Tasa de Conversión */}
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-[#C8A96A]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Tasa de Conversión
              </CardTitle>
              <div className="p-2 bg-[#C8A96A]/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-[#C8A96A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpiData.tasaConversion}%</div>
              <p className="text-sm text-gray-500">Pedidos confirmados</p>
            </CardContent>
          </Card>

          {/* Ticket Promedio */}
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-[#C8A96A]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Ticket Promedio
              </CardTitle>
              <div className="p-2 bg-[#C8A96A]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#C8A96A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{formatCOP(kpiData.ticketPromedio)}</div>
              <p className="text-sm text-gray-500">Por venta</p>
            </CardContent>
          </Card>

          {/* Pendiente MiPaquete */}
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-[#C8A96A]/5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Pendiente MiPaquete
              </CardTitle>
              <div className="p-2 bg-[#C8A96A]/10 rounded-lg">
                <Package className="h-5 w-5 text-[#C8A96A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{kpiData.pendienteMiPaquete}</div>
              <p className="text-sm text-gray-500">Guías pendientes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-2 bg-[#C8A96A] rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Mayoristas Joyería
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-around">
                <div className="text-center group cursor-pointer">
                  <div className="text-5xl font-bold text-[#C8A96A] mb-3 group-hover:scale-110 transition-transform duration-300">
                    {mayoristas.joyeria.nuevos}
                  </div>
                  <Badge variant="outline" className="border-[#C8A96A] text-[#8B6914] px-4 py-1 text-sm font-semibold">
                    Nuevos
                  </Badge>
                </div>
                <div className="h-24 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
                <div className="text-center group cursor-pointer">
                  <div className="text-5xl font-bold text-gray-900 mb-3 group-hover:scale-110 transition-transform duration-300">
                    {mayoristas.joyeria.recurrentes}
                  </div>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-semibold">
                    Recurrentes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[#C8A96A]/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-2 bg-[#C8A96A] rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                Mayoristas Balinería
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-around">
                <div className="text-center group cursor-pointer">
                  <div className="text-5xl font-bold text-[#C8A96A] mb-3 group-hover:scale-110 transition-transform duration-300">
                    {mayoristas.balineria.nuevos}
                  </div>
                  <Badge variant="outline" className="border-[#C8A96A] text-[#8B6914] px-4 py-1 text-sm font-semibold">
                    Nuevos
                  </Badge>
                </div>
                <div className="h-24 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
                <div className="text-center group cursor-pointer">
                  <div className="text-5xl font-bold text-gray-900 mb-3 group-hover:scale-110 transition-transform duration-300">
                    {mayoristas.balineria.recurrentes}
                  </div>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-semibold">
                    Recurrentes
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas Diarias */}
          <Card className="border border-[#C8A96A]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="text-gray-900 text-xl font-bold">Ventas Diarias</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Evolución de ventas durante el mes</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={ventasDiarias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="dia"
                    stroke="#666"
                    tick={{ fill: "#666", fontSize: 12 }}
                    label={{ value: "Día del mes", position: "insideBottom", offset: -5, fill: "#666" }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: "#666", fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCOP(value)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #C8A96A",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    stroke="#C8A96A"
                    strokeWidth={3}
                    dot={{ fill: "#8B6914", r: 6, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                    name="Ventas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Métodos de Pago */}
          <Card className="border border-[#C8A96A]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="text-gray-900 text-xl font-bold">Métodos de Pago</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Distribución por tipo de pago</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={metodosPago}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {metodosPago.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #C8A96A",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking de Ciudades */}
          <Card className="border border-[#C8A96A]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-2 bg-[#C8A96A] rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                Ranking de Ciudades
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {rankingCiudades.map((ciudad, index) => (
                  <div
                    key={ciudad.ciudad}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-[#C8A96A]/5 hover:to-white transition-all duration-300 border border-gray-100 hover:border-[#C8A96A]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#C8A96A] to-[#8B6914] text-white font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#C8A96A]" />
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{ciudad.ciudad}</div>
                          <div className="text-sm text-gray-500">{ciudad.pedidos} pedidos</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="font-bold text-gray-900 text-lg">{formatCOP(ciudad.ventas)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Ventas */}
          <Card className="border border-[#C8A96A]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#C8A96A]/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-2 bg-[#C8A96A] rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                Últimas Ventas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {ultimasVentas.map((venta) => (
                  <div
                    key={venta.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-[#C8A96A]/5 hover:to-white transition-all duration-300 border border-gray-100 hover:border-[#C8A96A]/30 hover:shadow-md"
                  >
                    <div>
                      <div className="font-bold text-gray-900">{venta.cliente}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {venta.id} • {venta.fecha}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 mb-2">{formatCOP(venta.monto)}</div>
                      <Badge
                        variant={venta.estado === "Completado" ? "default" : "outline"}
                        className={
                          venta.estado === "Completado"
                            ? "bg-green-100 text-green-800 border-green-200 font-semibold"
                            : "border-yellow-300 text-yellow-800 font-semibold"
                        }
                      >
                        {venta.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-red-200 shadow-xl bg-gradient-to-br from-white to-red-50/30">
          <CardHeader className="bg-gradient-to-r from-red-50 to-transparent border-b border-red-100">
            <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
              <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Riesgo de Fuga
              <Badge variant="destructive" className="ml-2 px-3 py-1 text-sm font-bold shadow-lg">
                {riesgoFuga.length} clientes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {riesgoFuga.map((cliente) => (
                <div
                  key={cliente.cliente}
                  className="flex items-center justify-between p-5 rounded-xl bg-white border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-300"
                >
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{cliente.cliente}</div>
                    <div className="text-sm text-gray-600 mt-1">Última compra: {formatCOP(cliente.ultimaCompra)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-red-600 mb-1">{cliente.diasSinComprar}</div>
                    <div className="text-sm text-gray-600 font-semibold">días sin comprar</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
