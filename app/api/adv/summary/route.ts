import { NextResponse } from "next/server"
import advServer from "@/lib/adv-server"

export async function GET() {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (useReal) {
    try {
      const data = await advServer.getRealSummary()
      return NextResponse.json({ data })
    } catch (err: any) {
      console.error("adv summary: failed to fetch real summary:", err)
    }
  }

  return NextResponse.json({
    data: {
      spend: 561308,
      conv: 3720,
      sales: 819,
      roas: 41.58,
      ctr: 0.0294,
      revenue: 23341500,
      cpa: 150.89,
      convRate: 0.22,
      impr: 126463,
      deltaSpend: "+12.3%",
    },
  })
}

