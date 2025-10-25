export const dynamic = 'force-dynamic'
export const revalidate = 0

import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'

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

    // getRealSummary() ahora retorna totalSpend con el gasto del mes actual
    initialKpis = summary

    // Usar totalSpend de getRealSummary() como el gasto del mes actual
    initialMonthly = {
      thisMonth: summary.totalSpend || 0,
      lastMonth: 0 // Por ahora no calculamos el mes anterior
    }

    console.log('[Publicidad SSR] Gasto del mes actual:', initialMonthly.thisMonth)

    // Map campaigns to the shape expected by the client (campaigns + rows)
    initialCampRes = {
      campaigns: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status })),
      rows: campaigns.map((c: any) => ({ id: c.id, name: c.name, status: c.status, spend: c.spend_total ?? 0 })),
    }
  } catch (err) {
    // If fetching fails, render the client-only component which will use its
    // regular /api/adv/* endpoints and fallbacks. Errors are logged server-side.
    console.error('Failed to fetch real ads on server:', err)
  }

  // Pass forcedSpend so the client component uses the server value as source of truth
  return <PublicidadFixed initialKpis={initialKpis} initialCampRes={initialCampRes} initialMonthly={initialMonthly} forcedSpend={initialMonthly?.thisMonth} />
}

