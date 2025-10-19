import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { paid } = await request.json()
    const supabase = await createClient()

    const updateData: any = {
      paid_by_mipaquete: paid,
    }

    // Si se marca como pagado, guardar la fecha de pago
    if (paid) {
      updateData.payment_date = new Date().toISOString()
    } else {
      updateData.payment_date = null
    }

    const { data, error } = await supabase.from("sales").update(updateData).eq("id", params.id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error updating payment status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
