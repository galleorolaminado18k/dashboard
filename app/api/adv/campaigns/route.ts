import { NextResponse } from "next/server"
import advServer from "@/lib/adv-server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.toLowerCase() ?? ""
  const state = url.searchParams.get("state") ?? "Todas"

  // SIEMPRE usar datos reales de Meta Ads
  try {
    console.log('📡 [API CAMPAIGNS] Obteniendo datos REALES de Meta Ads...')
    const campaigns = await advServer.getRealCampaigns()
    console.log(`✅ [API CAMPAIGNS] ${campaigns.length} campañas obtenidas de Meta Ads`)

    // Apply client filters to keep response shape stable
    const filtered = campaigns.filter((c: any) => {
      const stateMatch = state === "Todas" ? true : state === "Activas" ? c.status === "active" : c.status === "paused"
      const qMatch = q ? c.name.toLowerCase().includes(q) || c.id.includes(q) : true
      return stateMatch && qMatch
    })

    const rows = filtered.map((c: any, i: number) => {
      const spend = c.spend_total ?? 0
      console.log(`  💰 ${c.name}: $${spend.toLocaleString('es-CO')}`)
      return {
        id: c.id,
        name: c.name,
        status: c.status === undefined ? "active" : c.status,
        delivery: c.status === "active" ? "Activa" : "Pausada",
        receive: "—",
        budget: c.daily_budget ?? 0,
        spend: spend,
        conversions: 0,
        cpa: 0,
        sales: 0,
        revenue: 0,
        roas: 0,
        ctr: 0,
      }
    })

    console.log(`💸 [API CAMPAIGNS] Total gasto: $${rows.reduce((sum, r) => sum + r.spend, 0).toLocaleString('es-CO')}`)
    return NextResponse.json({ campaigns: filtered, rows })
  } catch (err: any) {
    // Si falla, loguear el error detallado
    console.error("❌ [API CAMPAIGNS] Error al obtener datos reales de Meta Ads:", err)
    console.error("Stack:", err.stack)
    // Retornar error para que el cliente sepa que falló
    return NextResponse.json({ error: err.message, campaigns: [], rows: [] }, { status: 500 })
  }

  // Mock fallback (unchanged)
  const base = [
    { id: "120233445687010113", name: "Mensajes a WhatsApp del Mayor", status: "active" },
    { id: "120232220411150113", name: "Campaña Balines – Mensajes", status: "paused" },
    { id: "120230275307150113", name: "CÚCUTA – AGOSTO", status: "paused" },
    { id: "1202312355180113", name: "AGOSTO – JOYERÍA – WHATSAPP", status: "paused" },
  ] as const

  const campaigns = base
    .filter((c) => (state === "Todas" ? true : state === "Activas" ? c.status === "active" : c.status === "paused"))
    .filter((c) => (q ? c.name.toLowerCase().includes(q) || c.id.includes(q) : true))

  const rows = campaigns.map((c, i) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    delivery: c.status === "active" ? "Activa" : "Pausada",
    receive: "—",
    budget: 0,
    spend: i === 0 ? 548428 : i === 1 ? 12880 : 0,
    conversions: i === 0 ? 3666 : i === 1 ? 54 : 0,
    cpa: i === 0 ? 149598 : 238519,
    sales: i === 0 ? 807 : i === 1 ? 12 : 0,
    revenue: i === 0 ? 23000000 : 342000,
    roas: i === 0 ? 41.94 : 26.55,
    ctr: i === 0 ? 0.0294 : 0.0275,
  }))

  return NextResponse.json({ campaigns, rows })
}

