import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  DollarSign,
  ReceiptText,
  ShoppingCart,
  PackageCheck,
  UserPlus,
  UsersRound,
  Percent,
  BarChart3,
  MapPin,
  Clock3,
} from "lucide-react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"

/**
 * â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
 * LUXURY SALES DASHBOARD âœ¨ (v2 â€” Ultra Luxury / brillante / estÃ©tico)
 *
 * Concepto visual:
 *  - Fondo blanco puro, tipografÃ­a negra, acentos dorado champagne.
 *  - Tarjetas con "glass-lux": blur + brillo sutil + borde con gradiente dorado.
 *  - JerarquÃ­a: Hero KPI (Ventas del Mes) XL, KPIs premium, mÃ³dulos CRM.
 *  - LÃ­nea de ventas con trazo dorado y puntos suaves.
 *  - Pie de mÃ©todos con vidrio pulido.
 *
 * Pasa tus datos reales por props; existen mocks por defecto.
 * â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
 */

export type KPI = {
  label: string
  value: string | number
  delta?: string
  icon?: React.ReactNode
}

export type MayoristasStats = {
  joyeria: { nuevos: number; recurrentes: number }
  balineria: { nuevos: number; recurrentes: number }
}

export type GeographyItem = { ciudad: string; ventas: number; ticket: number; share: number }

export type PaymentBreakdown = { metodo: string; monto: number }

export interface LuxurySalesDashboardProps {
  ventasMesUSD: number
  margenUtilidadPromedio: number // 0â€“1
  tasaConversion: number // 0â€“1
  ticketPromedioUSD: number
  pendienteMiPaqueteUSD: number
  mayoristas: MayoristasStats
  serieVentasDiarias: { fecha: string; ventas: number }[]
  seriePagosPorMetodo: PaymentBreakdown[]
  ventasRecientes: { id: string; cliente: string; producto: string; total: number; estado: string }[]
  riesgoFuga: { cliente: string; diasSinComprar: number; ciudad?: string }[]
  rankingCiudades: GeographyItem[]
}

// Paleta
const GOLD = "#D8BD80" // champagne mÃ¡s brillante
const GOLD_SOFT = "#E8D7A5"
const INK = "#0B0B0C"
const GLASS = "bg-white/80 backdrop-blur-xl"

// Mocks
const fallback: LuxurySalesDashboardProps = {
  ventasMesUSD: 371000000,
  margenUtilidadPromedio: 0.42,
  tasaConversion: 0.68,
  ticketPromedioUSD: 39000,
  pendienteMiPaqueteUSD: 23,
  mayoristas: {
    joyeria: { nuevos: 12, recurrentes: 34 },
    balineria: { nuevos: 8, recurrentes: 27 },
  },
  serieVentasDiarias: [
    { fecha: "L", ventas: 45_000 },
    { fecha: "M", ventas: 52_000 },
    { fecha: "X", ventas: 48_000 },
    { fecha: "J", ventas: 61_000 },
    { fecha: "V", ventas: 56_000 },
    { fecha: "S", ventas: 69_000 },
    { fecha: "D", ventas: 43_000 },
  ],
  seriePagosPorMetodo: [
    { metodo: "Transferencia", monto: 45 },
    { metodo: "Efectivo", monto: 30 },
    { metodo: "Contraentrega", monto: 25 },
  ],
  ventasRecientes: [
    { id: "VT-008", cliente: "Diego Torres", producto: "Pulsera", total: 280000, estado: "Pagado" },
    { id: "VT-007", cliente: "Valentina Cruz", producto: "Anillo Compromiso", total: 850000, estado: "Pendiente" },
    { id: "VT-006", cliente: "Sofía Ramírez", producto: "Cadena", total: 190000, estado: "Pagado" },
  ],
  riesgoFuga: [
    { cliente: "Ana Martínez", diasSinComprar: 341, ciudad: "Cali" },
    { cliente: "Patricia Silva", diasSinComprar: 314, ciudad: "Cartagena" },
    { cliente: "Laura Pérez", diasSinComprar: 284, ciudad: "Pereira" },
  ],
  rankingCiudades: [
    { ciudad: "Bogotá", ventas: 45_000_000, ticket: 288_461, share: 32.5 },
    { ciudad: "Medellín", ventas: 32_000_000, ticket: 326_530, share: 23.1 },
    { ciudad: "Cali", ventas: 18_500_000, ticket: 276_119, share: 13.4 },
  ],
}

function Peso({ value }: { value: number }) {
  return <span className="tabular-nums">${value.toLocaleString("es-CO")}</span>
}

function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-gold-frame card-with-shadow group">
      <div className="card-surface transition-all duration-300 ease-out group-hover:-translate-y-1">
        {children}
      </div>
    </div>
  )
}

function Kpi({ label, value, delta, icon }: KPI) {
  return (
    <GradientCard>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{label}</span>
          <div className="text-neutral-900">{icon}</div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="text-4xl font-semibold tracking-tight">{value}</div>
          {delta && <Badge className={`rounded-full border-0 bg-[${GOLD}]/90 text-black`}>{delta}</Badge>}
        </div>
      </div>
    </GradientCard>
  )
}

export default function LuxurySalesDashboard(props: Partial<LuxurySalesDashboardProps>) {
  const data = { ...fallback, ...props } as LuxurySalesDashboardProps
  const PIE_COLORS = [GOLD, INK, GOLD_SOFT]

  return (
    <div className="galle-dashboard bg-dashboard-soft min-h-screen bg-white text-[#0B0B0C]">
      {/* HERO */}
      <section className="px-6 lg:px-10 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-tight">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-[#111] via-[#111] to-[${GOLD}]`}>
                DASHBOARD GALLE
              </span>
            </h1>
            <p className="text-sm text-neutral-500 mt-1">RESUMEN DEL MES ACTUAL</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full border-neutral-200 bg-transparent">
              Imprimir
            </Button>
            <Button className={`rounded-full bg-[${GOLD}] text-black hover:bg-[${GOLD}]/90`}>Compartir</Button>
          </div>
        </div>

        {/* KPI HERO (VENTAS) */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <GradientCard>
              <div className="p-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-500">Ventas del Mes</div>
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="mt-3 text-5xl md:text-6xl font-semibold">
                  <Peso value={data.ventasMesUSD} />
                </div>
                <div className="mt-4">
                  <Badge className="rounded-full bg-black text-white border-0">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12.5% vs mes anterior
                  </Badge>
                </div>
              </div>
            </GradientCard>
          </div>

          {/* KPIs PREMIUM */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <Kpi
              label="Margen Promedio"
              value={`${Math.round(data.margenUtilidadPromedio * 100)}%`}
              delta={"+3.2 pp"}
              icon={<ReceiptText className="w-4 h-4" />}
            />
            <Kpi
              label="Tasa de Conversión"
              value={`${Math.round(data.tasaConversion * 100)}%`}
              delta={"-2.1 pp"}
              icon={<Percent className="w-4 h-4" />}
            />
            <Kpi
              label="Ticket Promedio"
              value={<Peso value={data.ticketPromedioUSD} />}
              delta={"+8.3%"}
              icon={<DollarSign className="w-4 h-4" />}
            />
          </div>
        </div>
      </section>

      {/* SEGUNDA BANDA: Mayoristas + Pendientes Mipaquete */}
      <section className="px-6 lg:px-10 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nuevos Mayoristas Joyería
            </div>
            <div className="mt-2 text-5xl font-semibold">{data.mayoristas.joyeria.nuevos}</div>
            <p className="text-xs text-neutral-500 mt-2">Este mes</p>
          </div>
        </GradientCard>
        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <UsersRound className="w-4 h-4" /> Recurrentes Joyería
            </div>
            <div className="mt-2 text-5xl font-semibold">{data.mayoristas.joyeria.recurrentes}</div>
            <p className="text-xs text-neutral-500 mt-2">Este mes</p>
          </div>
        </GradientCard>
        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Nuevos Mayoristas Balinería
            </div>
            <div className="mt-2 text-5xl font-semibold">{data.mayoristas.balineria.nuevos}</div>
            <p className="text-xs text-neutral-500 mt-2">Este mes</p>
          </div>
        </GradientCard>
        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <UsersRound className="w-4 h-4" /> Recurrentes Balinería
            </div>
            <div className="mt-2 text-5xl font-semibold">{data.mayoristas.balineria.recurrentes}</div>
            <p className="text-xs text-neutral-500 mt-2">Este mes</p>
          </div>
        </GradientCard>
      </section>

      {/* TERCERA BANDA: GrÃ¡ficas principales */}
      <section className="px-6 lg:px-10 mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Línea ventas */}}
        <GradientCard>
          <div className="p-6 h-[320px]">
            <div className="text-sm text-neutral-500">Ventas Diarias (7 días)</div>
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.serieVentasDiarias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString("es-CO")}`} />
                  <Line type="monotone" dataKey="ventas" stroke={GOLD} strokeWidth={3.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GradientCard>

        {/* Pie métodos */}
        <GradientCard>
          <div className="p-6 h-[320px]">
            <div className="text-sm text-neutral-500">Métodos de Pago (distribución)</div>
            <div className="mt-3 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.seriePagosPorMetodo}
                    dataKey="monto"
                    nameKey="metodo"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    labelLine
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.seriePagosPorMetodo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GradientCard>

        {/* Pendientes MiPaquete + Riesgo Fuga */}
        <GradientCard>
          <div className="p-6 h-[320px] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500 flex items-center gap-2">
                <PackageCheck className="w-4 h-4" /> Pendiente MiPaquete
              </div>
              <Badge className="rounded-full bg-amber-100 text-amber-900 border-0">5 urgentes</Badge>
            </div>
            <div className="mt-2 text-6xl font-semibold">{data.pendienteMiPaqueteUSD}</div>
            <div className="mt-5 text-sm text-neutral-500">Riesgo de Fuga</div>
            <ul className="mt-2 space-y-2 flex-1 overflow-auto pr-1 max-h-[170px]">
              {data.riesgoFuga.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2">
                  <div>
                    <p className="font-medium">{r.cliente}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.ciudad ?? "â€”"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-black text-white border-0">
                    <Clock3 className="w-3 h-3 mr-1" /> {r.diasSinComprar} dÃ­as
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </GradientCard>
      </section>

      {/* CUARTA BANDA: Ranking + Ãšltimas ventas */}
      <section className="px-6 lg:px-10 mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 pb-12">
        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Ranking de Ciudades
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/60">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="text-center px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Ciudad</th>
                    <th className="text-center px-4 py-3">Ventas</th>
                    <th className="text-center px-4 py-3">Ticket</th>
                    <th className="text-center px-4 py-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rankingCiudades.map((c, i) => (
                    <tr key={i} className="odd:bg-white even:bg-neutral-50">
                      <td className="px-4 py-3 text-center">{i + 1}</td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#D8BD80]" />
                          <span>{c.ciudad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Peso value={c.ventas} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Peso value={c.ticket} />
                      </td>
                      <td className="px-4 py-3 text-center">{c.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GradientCard>

        <GradientCard>
          <div className="p-6">
            <div className="text-sm text-neutral-500">Ãšltimas Ventas</div>
            <ul className="mt-3 space-y-3">
              {data.ventasRecientes.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                  <div>
                    <p className="font-medium">{v.cliente}</p>
                    <p className="text-xs text-neutral-500">
                      {v.producto} â€¢ {v.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      <Peso value={v.total} />
                    </div>
                    <div className="text-xs text-neutral-500">{v.estado}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </GradientCard>

        {/* CTA Mini */}
        <GradientCard>
          <div className="p-6 flex h-full items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Brilla más este mes ✨</h3>
              <p className="text-sm text-neutral-500 mt-1">Exporta el informe y comparte resultados con tu equipo.</p>
            </div>
            <Button className={`rounded-full bg-[${GOLD}] text-black hover:bg-[${GOLD}]/90`}>Exportar</Button>
          </div>
        </GradientCard>
      </section>

      <footer className="pb-10 text-center text-xs text-neutral-400">
        GALLE â€¢ Ultra Luxury Dashboard â€¢ Tailwind + shadcn/ui + Recharts
      </footer>
    </div>
  )
}


