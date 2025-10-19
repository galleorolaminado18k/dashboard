import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    let query = supabase
      .from("invoices")
      .select(`
        *,
        invoice_items (*)
      `)
      .order("issue_date", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching invoices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error in invoices API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    if (!body.guia || !body.transportadora) {
      return NextResponse.json({ error: "Los campos guía y transportadora son obligatorios" }, { status: 400 })
    }

    if (!body.ciudad || !body.barrio) {
      return NextResponse.json({ error: "Los campos ciudad y barrio son obligatorios" }, { status: 400 })
    }

    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase.rpc("generate_invoice_number")

    if (invoiceNumberError) {
      console.error("[v0] Error generating invoice number:", invoiceNumberError)
      return NextResponse.json({ error: invoiceNumberError.message }, { status: 500 })
    }

    const invoiceNumber = invoiceNumberData

    // Calcular totales
    const subtotal = body.items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)
    const taxRate = body.tax_rate || 19
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_name: body.client_name,
        client_nit: body.client_nit,
        client_email: body.client_email,
        client_phone: body.client_phone,
        client_address: body.client_address,
        ciudad: body.ciudad,
        barrio: body.barrio,
        issue_date: body.issue_date || new Date().toISOString(),
        due_date: body.due_date,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status: body.status || "PENDIENTE PAGO",
        payment_method: body.payment_method,
        notes: body.notes,
        guia: body.guia,
        transportadora: body.transportadora,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error("[v0] Error creating invoice:", invoiceError)
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    const items = body.items.map((item: any) => ({
      invoice_id: invoice.invoice_number,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase.from("invoice_items").insert(items)

    if (itemsError) {
      console.error("[v0] Error creating invoice items:", itemsError)
      await supabase.from("invoices").delete().eq("invoice_number", invoice.invoice_number)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error in invoices POST API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
