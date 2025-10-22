import PublicidadFixed from "@/app/publicidad/_client/PublicidadFixed"
import { getRealCampaigns, getRealSummary } from '@/lib/adv-server'

export default async function PublicidadGroupPage() {
  // Fetch real ads data on the server so the rendered page includes
  // live campaigns even when deployment protection prevents unauthenticated
  // client-side requests to /api/adv/*.
  let initialKpis = null
  let initialCampRes = null
  try {
    const summary = await getRealSummary()
    const campaigns = await getRealCampaigns()
    initialKpis = summary
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

  return <PublicidadFixed initialKpis={initialKpis} initialCampRes={initialCampRes} />
}

