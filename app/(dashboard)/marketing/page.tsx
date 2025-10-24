export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'

import { headers } from 'next/headers'
import { fmtMoney } from '@/lib/format'

function getBaseUrl(): string {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

async function getMonthlySpend() {
  try {
    const base = getBaseUrl()
    const res = await fetch(`${base}/api/adv/monthly-spend`, { cache: 'no-store' })
    const j = await res.json().catch(() => ({ data: { thisMonth: 0, lastMonth: 0 } }))
    return j?.data ?? { thisMonth: 0, lastMonth: 0 }
  } catch (e) {
    console.error('Failed to fetch monthly spend (absolute URL) for /marketing:', e)
    return { thisMonth: 0, lastMonth: 0 }
  }
}

export default async function MarketingPage() {
  // Server-side fetch so public /marketing page can render live campaigns
  // even when deployment protection prevents unauthenticated client API calls.
  let initialKpis = null
  let initialCampRes = null
  let initialMonthly = null
  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()

    // Fetch monthly spend using absolute URL on the server to avoid hydration/host issues
    initialMonthly = await getMonthlySpend()

    initialKpis = summary
    initialCampRes = {
      campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status })),
      rows: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status, spend: c.spend_total ?? 0 })),
    }
  } catch (err) {
    console.error('Failed to fetch real ads on server for /marketing:', err)
  }

  return <PublicidadFixed initialKpis={initialKpis} initialCampRes={initialCampRes} initialMonthly={initialMonthly} />
}
