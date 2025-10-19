import { NextResponse } from "next/server"
import { listVentas } from "@/lib/ventasStore"

export async function GET() {
  return NextResponse.json({ ok: true, data: listVentas() })
}
