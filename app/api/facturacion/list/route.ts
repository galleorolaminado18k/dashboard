import { NextResponse } from "next/server"
import { DB } from "@/lib/store"

export async function GET() {
  const s = DB.get()
  return NextResponse.json({
    ok: true,
    facturas: s.facturas,
    devoluciones: s.devoluciones,
  })
}
