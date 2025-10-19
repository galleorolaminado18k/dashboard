import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.toLowerCase() ?? ""
  const state = url.searchParams.get("state") ?? "Todas"

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
