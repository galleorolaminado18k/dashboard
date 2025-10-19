import { NextResponse } from "next/server"

export async function GET() {
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
