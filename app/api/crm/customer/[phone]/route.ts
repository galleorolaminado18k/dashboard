import { NextResponse } from "next/server"
import { DB } from "@/lib/store"

export async function GET(_: Request, { params }: { params: { phone: string } }) {
  const c = DB.getCRMByPhone(params.phone)
  if (!c) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true, data: c })
}
