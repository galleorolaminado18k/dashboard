export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'
import { headers } from 'next/headers'

export default async function MarketingPage() {
  // Server-side fetch so public /marketing page can render live campaigns
  // even when deployment protection prevents unauthenticated client API calls.
  let initialKpis = null
  let initialCampRes = null
  let initialMonthly = null
  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()

    // Fetch monthly spend on the server (build base from headers)
    async function getMonthlySpendServer(): Promise<number> {
      try {
        const h = await headers()
        const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
        const proto = h.get('x-forwarded-proto') ?? 'https'
        const base = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '')

        if (!base) return 0

        const res = await fetch(`${base}/api/adv/monthly-spend`, { cache: 'no-store', next: { revalidate: 0 } })
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          console.error('monthly-spend error', res.status, txt)
          return 0
        }
        const j = await res.json().catch(() => ({ data: { thisMonth: 0 } }))
        return Number(j?.data?.thisMonth ?? 0)
      } catch (e) {
        console.error('getMonthlySpendServer error', e)
        return 0
      }
    }

    const monthlyNumber = await getMonthlySpendServer()

    initialMonthly = { thisMonth: monthlyNumber, lastMonth: initialMonthly?.lastMonth ?? 0 }

    initialKpis = summary
    initialCampRes = {
      campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status })),
      rows: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status, spend: c.spend_total ?? 0 })),
    }
  } catch (err) {
    console.error('Failed to fetch real ads on server for /marketing:', err)
  }

  // Pass forcedSpend number to client component to avoid client-side overwrite
  return <PublicidadFixed initialKpis={initialKpis} initialCampRes={initialCampRes} initialMonthly={initialMonthly} forcedSpend={initialMonthly?.thisMonth} />
}
