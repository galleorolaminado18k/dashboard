import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error:
            "Configuración de Supabase incompleta. Por favor configura las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY",
          data: [],
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"
    const period = Number.parseInt(searchParams.get("period") || "7")

    const supabase = await createClient()

    let query = supabase.from("sales").select("*").order("sale_date", { ascending: false })

    switch (filter) {
      case "contraentrega":
        query = query.eq("payment_method", "contraentrega").eq("is_return", false)
        break
      case "efectivo":
        query = query.eq("payment_method", "efectivo").eq("is_return", false)
        break
      case "transferencia":
        query = query.eq("payment_method", "transferencia").eq("is_return", false)
        break
      case "devoluciones":
        query = query.eq("is_return", true)
        break
      case "pagado_mipaquete":
        const paidDate = new Date()
        paidDate.setDate(paidDate.getDate() - period)
        query = query
          .eq("payment_method", "contraentrega")
          .eq("paid_by_mipaquete", true)
          .gte("payment_date", paidDate.toISOString())
        break
      case "pendiente_mipaquete":
        query = query.eq("payment_method", "contraentrega").eq("paid_by_mipaquete", false).eq("is_return", false)
        break
      case "all":
      default:
        query = query.eq("is_return", false)
        break
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Supabase error:", error.message)
      return NextResponse.json(
        {
          error: error.message,
          data: [],
          needsSetup: error.message.includes("Could not find the table"),
        },
        { status: error.message.includes("Could not find the table") ? 404 : 500 },
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching sales:", error?.message || error)
    return NextResponse.json(
      {
        error: error?.message || "Error interno del servidor. Verifica tu configuración de Supabase.",
        data: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.from("sales").insert([body]).select().single()

    if (error) {
      console.error("[v0] Error creating sale:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("[v0] Error creating sale:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
