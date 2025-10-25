import { NextResponse } from "next/server"
import advServer from "@/lib/adv-server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.toLowerCase() ?? ""
  const state = url.searchParams.get("state") ?? "Todas"

  // Forzar uso de datos reales - validación eliminada
  try {
    const campaigns = await advServer.getRealCampaigns()
    const filtered = campaigns.filter((c: any) => {
      const stateMatch = state === "Todas" ? true : state === "Activas" ? c.status === "active" : c.status === "paused"
      const qMatch = q ? c.name.toLowerCase().includes(q) || c.id.includes(q) : true
      return stateMatch && qMatch
    })
    const rows = filtered.map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      delivery: c.status === "active" ? "Activa" : "Pausada",
      receive: "—",
      budget: 0,
      spend: c.spend_total ?? 0,
      conversions: 0,
      cpa: 0,
      sales: 0,
      revenue: 0,
      roas: 0,
      ctr: 0,
    }))
    return NextResponse.json({ campaigns: filtered, rows })
  } catch (e: any) {
    console.error("ads/campaigns real error:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
