"use client"

import useSWR from "swr"
import { Donut } from "./Donut"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export function CampaignCard({ id, name }: { id: string; name: string }) {
  const { data: adsetsC } = useSWR(`/api/ads/campaigns/${id}/adsets`, fetcher, {
    refreshInterval: 5000,
  })
  const { data: insC } = useSWR(`/api/ads/campaigns/${id}/insights`, fetcher, {
    refreshInterval: 5000,
  })
  const inC = insC?.insights

  const sd = (adsetsC?.adsets || []).map((a: any) => ({
    name: a.name,
    value: a.spend,
  }))
  const cd = (adsetsC?.adsets || []).map((a: any) => ({
    name: a.name,
    value: a.conversions,
  }))
  const fd = inC
    ? [
        { name: "Positivo", value: inC.positivePct },
        { name: "Negativo", value: inC.negativePct },
        {
          name: "Neutro",
          value: Math.max(0, 100 - inC.positivePct - inC.negativePct),
        },
      ]
    : []

  return (
    <div className="rounded-3xl bg-white border border-neutral-100 shadow-[0_20px_60px_rgba(0,0,0,.06)] p-4">
      <div className="text-sm font-semibold mb-3">{name}</div>
      <div className="space-y-4">
        <Donut title="Gasto por ad set" data={sd} />
        <Donut title="Conversiones por ad set" data={cd} />
        <Donut title="Feedback (±)" data={fd} />
      </div>
    </div>
  )
}
