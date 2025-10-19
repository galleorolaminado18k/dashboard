import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching expenses data...")
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const month = Number.parseInt(searchParams.get("month") || "0")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", startOfMonth.toISOString())
      .lte("expense_date", endOfMonth.toISOString())
      .order("expense_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching expenses:", error)
      return NextResponse.json([])
    }

    console.log("[v0] Expenses data fetched successfully:", data?.length || 0, "records")
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("[v0] Error fetching expenses:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          expense_date: body.expense_date,
          receipt_number: body.receipt_number,
          provider: body.provider,
          category: body.category,
          payment_method: body.payment_method,
          status: body.status,
          amount: body.amount,
          notes: body.notes,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error creating expense:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating expense:", error)
    return NextResponse.json({ error: "Error al crear el gasto" }, { status: 500 })
  }
}
