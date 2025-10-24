export const dynamic = 'force-dynamic'
export const revalidate = 0

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'
import { headers } from 'next/headers'

async function getMonthlySpendServer(): Promise<{ thisMonth: number; lastMonth: number }> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const base = `${proto}://${host}`

    const res = await fetch(`${base}/api/adv/monthly-spend`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.error('monthly-spend error', res.status, await res.text().catch(() => ''))
      return { thisMonth: 0, lastMonth: 0 }
    }

    const json = await res.json().catch(() => ({ data: { thisMonth: 0, lastMonth: 0 } }))
    return { thisMonth: Number(json?.data?.thisMonth ?? 0), lastMonth: Number(json?.data?.lastMonth ?? 0) }
  } catch (e) {
    console.error('getMonthlySpendServer error', e)
    return { thisMonth: 0, lastMonth: 0 }
  }
}

export default async function PublicidadGroupPage() {
  // Fetch real ads data on the server so the rendered page includes
  // live campaigns even when deployment protection prevents unauthenticated
  // client-side requests to /api/adv/*.
  let initialKpis = null
  let initialCampRes = null
  let initialMonthly = { thisMonth: 0, lastMonth: 0 }
  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()
    initialKpis = summary
    // Map campaigns to the shape expected by the client (campaigns + rows)
    initialCampRes = {
      campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status })),
      rows: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status, spend: c.spend_total ?? 0 })),
    }

    // Fetch monthly spend server-side and pass it to the client as initialMonthly
    initialMonthly = await getMonthlySpendServer()
  } catch (err) {
    // If fetching fails, render the client-only component which will use its
    // regular /api/adv/* endpoints and fallbacks. Errors are logged server-side.
    console.error('Failed to fetch real ads on server:', err)
  }

  // Pass forcedSpend so the client component uses the server value as source of truth
  return <PublicidadFixed initialKpis={initialKpis} initialCampRes={initialCampRes} initialMonthly={initialMonthly} forcedSpend={initialMonthly?.thisMonth} />
}

