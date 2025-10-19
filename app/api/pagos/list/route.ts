import { NextResponse } from "next/server"
import { DB } from "@/lib/store"

export async function GET() {
  return NextResponse.json({ ok: true, data: DB.getPagos() })
}
