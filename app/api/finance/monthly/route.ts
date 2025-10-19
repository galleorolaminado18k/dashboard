import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching monthly data...")
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("total, sale_date")
      .gte("sale_date", new Date(year, 0, 1).toISOString())
      .lte("sale_date", new Date(year, 11, 31, 23, 59, 59).toISOString())
      .eq("status", "PAGADO")

    if (salesError) {
      console.error("[v0] Error fetching sales:", salesError)
    }

    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, expense_date")
      .gte("expense_date", new Date(year, 0, 1).toISOString())
      .lte("expense_date", new Date(year, 11, 31, 23, 59, 59).toISOString())
      .eq("status", "PAGADO")

    if (expensesError) {
      console.error("[v0] Error fetching expenses:", expensesError)
    }

    const monthlyData = []
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    for (let month = 0; month < 12; month++) {
      const monthSales =
        salesData
          ?.filter((s) => new Date(s.sale_date).getMonth() === month)
          .reduce((sum, s) => sum + (s.total || 0), 0) || 0

      const monthExpenses =
        expensesData
          ?.filter((e) => new Date(e.expense_date).getMonth() === month)
          .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const utilidad = monthSales - monthExpenses
      const margen = monthSales > 0 ? ((utilidad / monthSales) * 100).toFixed(1) : "0"

      monthlyData.push({
        month: monthNames[month],
        ventas: monthSales,
        gastos: monthExpenses,
        utilidad,
        margen,
      })
    }

    console.log("[v0] Monthly data fetched successfully")
    return NextResponse.json(monthlyData)
  } catch (error) {
    console.error("[v0] Error fetching monthly data:", error)
    return NextResponse.json([])
  }
}
