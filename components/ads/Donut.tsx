import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function Donut({
  title,
  data,
  valueKey = "value",
  nameKey = "name",
}: {
  title: string
  data: { name: string; value: number }[]
  valueKey?: string
  nameKey?: string
}) {
  const COLORS = ["#c9b074", "#e5d6a7", "#9f8b54", "#d8bd80", "#b59b5a", "#eee3bf"]
  return (
    <div className="rounded-3xl bg-white p-4 border border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,.06)]">
      <div className="text-sm text-neutral-600 mb-2">{title}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={60} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
