export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'

export default async function MarketingPage() {
  // Server-side fetch so public /marketing page can render live campaigns
  // even when deployment protection prevents unauthenticated client API calls.
  let initialKpis = null
  let initialCampRes = null
  let initialMonthly = null
  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()
    try {
      const m = await fetch('/api/adv/monthly-spend', { cache: 'no-store' })
      const jm = await m.json()
      initialMonthly = jm?.data ?? null
    } catch (e) {
      console.error('Failed to fetch monthly spend on server for /marketing:', e)
    }
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
