import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: number
  color?: "blue" | "green" | "yellow" | "purple" | "red" | "orange" | "pink"
}

const colorClasses = {
  blue: "border-l-blue-500",
  green: "border-l-green-500",
  yellow: "border-l-amber-500",
  purple: "border-l-purple-500",
  red: "border-l-red-500",
  orange: "border-l-orange-500",
  pink: "border-l-pink-500",
}

export function StatCard({ title, value, subtitle, trend, color = "blue" }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white ${colorClasses[color]} border-l-4 p-3 shadow-sm transition-shadow hover:shadow-md min-w-[160px]`}
    >
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 leading-tight">{title}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight break-words">{value}</p>
        {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[10px] font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>+{Math.abs(trend)}% vs anterior</span>
          </div>
        )}
      </div>
    </div>
  )
}
