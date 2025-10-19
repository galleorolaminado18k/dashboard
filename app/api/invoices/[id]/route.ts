import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    console.log("[v0] Fetching invoice:", id)

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .eq("invoice_number", id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.log("[v0] Invoice not found:", id)
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    console.log("[v0] Invoice found:", data.invoice_number, "Items:", data.invoice_items?.length || 0)

    // Retornar directamente el objeto de factura para consistencia
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in invoice GET API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase.from("invoices").update(body).eq("invoice_number", id).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    console.log("[v0] Invoice updated, status synced to sale:", data.invoice_number, data.status)

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error in invoice PATCH API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const { id } = params

    const { error } = await supabase.from("invoices").delete().eq("invoice_number", id)

    if (error) {
      console.error("[v0] Error deleting invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in invoice DELETE API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
