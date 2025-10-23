"use client"

import { fmtMoney, fmtNum, fmtDate } from '@/lib/format'

export default function AdsKpiCards({
  gastoTotal,
  conversaciones,
  ventas,
  roas,
  cvr,
  lastUpdated,
}: {
  gastoTotal: number
  conversaciones: number
  ventas: number
  roas: number
  cvr: number
  lastUpdated: string
}) {
  const Card = ({ title, value, foot }: { title: string; value: string; foot?: string }) => (
    <div className="rounded-2xl border bg-white p-4 shadow-[0_1px_0_#ececec]">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {foot && <div className="mt-1 text-xs text-neutral-400">{foot}</div>}
    </div>
  )

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-emerald-700">
        <span className="inline-flex h-5 items-center rounded-full bg-emerald-50 px-2">En vivo desde Meta Ads</span>
        <span className="ml-auto text-neutral-400">Última actualización: {fmtDate(lastUpdated)}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="GASTO TOTAL" value={fmtMoney(gastoTotal)} />
        <Card title="CONVERSACIONES" value={fmtNum(conversaciones)} />
        <Card title="VENTAS" value={fmtNum(ventas)} foot="tasa conversión en Tabla" />
        <Card title="ROAS" value={`${(roas ?? 0).toFixed(2)}x`} />
        <Card title="CVR PROMEDIO" value={`${((cvr ?? 0) * 100).toFixed(2)}%`} />
      </div>
    </div>
  )
}
