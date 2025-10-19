import type React from "react"
export const KpiCard = ({
  title,
  value,
  sub,
  icon,
}: {
  title: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
}) => (
  <div className="rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,.10)] border border-neutral-100 p-5 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(1400px_300px_at_-10%_-40%,rgba(216,189,128,.20),transparent)]" />
    <div className="relative flex items-center gap-3">
      <div className="h-10 w-10 grid place-items-center rounded-2xl bg-[rgba(216,189,128,.18)] text-[#6b5728]">
        {icon ?? <span>★</span>}
      </div>
      <div className="text-sm text-neutral-500">{title}</div>
    </div>
    <div className="relative mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
    {sub && <div className="relative mt-1 text-xs text-neutral-500">{sub}</div>}
  </div>
)
