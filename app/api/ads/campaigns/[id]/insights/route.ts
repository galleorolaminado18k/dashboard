import { NextResponse } from "next/server"

// Mock de insights por campaña
const insightsByCampaign: Record<string, any> = {
  camp_1: {
    roas: 3.2,
    spend: 2550000,
    revenue: 8160000,
    cpa: 36428,
    ctr: 0.042,
    positivePct: 68,
    negativePct: 18,
  },
  camp_2: {
    roas: 2.8,
    spend: 2090000,
    revenue: 5852000,
    cpa: 33709,
    ctr: 0.038,
    positivePct: 62,
    negativePct: 22,
  },
  camp_3: {
    roas: 4.1,
    spend: 2500000,
    revenue: 10250000,
    cpa: 36764,
    ctr: 0.051,
    positivePct: 75,
    negativePct: 12,
  },
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const insights = insightsByCampaign[params.id] || null
  return NextResponse.json({ insights })
}
