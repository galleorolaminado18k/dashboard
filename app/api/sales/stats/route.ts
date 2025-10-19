import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_STATS = {
  totalSales: 0,
  totalRevenue: 0,
  transferTotal: 0,
  cashTotal: 0,
  returnsTotal: 0,
  returnsCount: 0,
  averageTicket: 0,
  paidByMipaquete: 0,
  pendingByMipaquete: 0,
}

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: "Configuración de Supabase incompleta",
          ...DEFAULT_STATS,
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "7")

    const supabase = await createClient()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const { data: currentMonthSales, error: currentMonthError } = await supabase
      .from("sales")
      .select("*")
      .eq("is_return", false)
      .gte("sale_date", startOfMonth.toISOString())
      .lte("sale_date", endOfMonth.toISOString())

    if (currentMonthError) {
      console.error("[v0] Supabase error:", currentMonthError.message)
      return NextResponse.json(
        {
          error: currentMonthError.message,
          ...DEFAULT_STATS,
          needsSetup: currentMonthError.message.includes("Could not find the table"),
        },
        { status: currentMonthError.message.includes("Could not find the table") ? 404 : 500 },
      )
    }

    const totalSales = currentMonthSales?.length || 0
    const totalRevenue = currentMonthSales?.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0) || 0

    const transferSales = currentMonthSales?.filter((s) => s.payment_method === "transferencia") || []
    const cashSales = currentMonthSales?.filter((s) => s.payment_method === "efectivo") || []
    const contraentregaSales = currentMonthSales?.filter((s) => s.payment_method === "contraentrega") || []

    const transferTotal = transferSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    const cashTotal = cashSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)

    const { data: returns, error: returnsError } = await supabase
      .from("sales")
      .select("*")
      .eq("is_return", true)
      .gte("sale_date", startOfMonth.toISOString())
      .lte("sale_date", endOfMonth.toISOString())

    if (returnsError) {
      console.error("[v0] Error fetching returns:", returnsError.message)
    }

    const returnsTotal = returns?.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0) || 0

    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

    const periodDate = new Date()
    periodDate.setDate(periodDate.getDate() - period)

    const paidContraentrega = contraentregaSales.filter(
      (s) => s.paid_by_mipaquete === true && s.payment_date && new Date(s.payment_date) >= periodDate,
    )

    const pendingContraentrega = contraentregaSales.filter((s) => s.paid_by_mipaquete === false)

    const paidByMipaquete = paidContraentrega.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
    const pendingByMipaquete = pendingContraentrega.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)

    return NextResponse.json({
      totalSales,
      totalRevenue,
      transferTotal,
      cashTotal,
      returnsTotal,
      returnsCount: returns?.length || 0,
      averageTicket,
      paidByMipaquete,
      pendingByMipaquete,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching stats:", error?.message || error)
    return NextResponse.json(
      {
        error: error?.message || "Error interno del servidor",
        ...DEFAULT_STATS,
      },
      { status: 500 },
    )
  }
}
