export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'default-no-store'

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'

export default async function MarketingPage() {
  // Server-side fetch so public /marketing page can render live campaigns
  // even when deployment protection prevents unauthenticated client API calls.
  let initialKpis: any = null
  let initialCampRes: any = null
  let initialMonthly: { thisMonth?: number; lastMonth?: number } | null = null

  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()

    // getRealSummary() ahora retorna totalSpend con el gasto del mes actual
    initialKpis = summary

    // Usar totalSpend de getRealSummary() como el gasto del mes actual
    initialMonthly = {
      thisMonth: summary.totalSpend || 0,
      lastMonth: 0 // Por ahora no calculamos el mes anterior
    }

    console.log('[Marketing SSR] Gasto del mes actual:', initialMonthly.thisMonth)

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
