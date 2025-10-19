import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Total de facturas
    const { count: totalInvoices } = await supabase.from("invoices").select("*", { count: "exact", head: true })

    // Facturas del mes actual
    const { count: currentMonthCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("issue_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`)
      .lt(
        "issue_date",
        currentMonth === 12
          ? `${currentYear + 1}-01-01`
          : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`,
      )

    // Facturas del mes anterior
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const { count: previousMonthCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("issue_date", `${previousYear}-${String(previousMonth).padStart(2, "0")}-01`)
      .lt(
        "issue_date",
        previousMonth === 12
          ? `${previousYear + 1}-01-01`
          : `${previousYear}-${String(previousMonth + 1).padStart(2, "0")}-01`,
      )

    // Facturas de hace 2 meses
    const twoMonthsAgo = currentMonth <= 2 ? 12 - (2 - currentMonth) : currentMonth - 2
    const twoMonthsAgoYear = currentMonth <= 2 ? currentYear - 1 : currentYear
    const { count: twoMonthsAgoCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("issue_date", `${twoMonthsAgoYear}-${String(twoMonthsAgo).padStart(2, "0")}-01`)
      .lt(
        "issue_date",
        twoMonthsAgo === 12
          ? `${twoMonthsAgoYear + 1}-01-01`
          : `${twoMonthsAgoYear}-${String(twoMonthsAgo + 1).padStart(2, "0")}-01`,
      )

    return NextResponse.json({
      totalInvoices: totalInvoices || 0,
      currentMonthCount: currentMonthCount || 0,
      previousMonthCount: previousMonthCount || 0,
      twoMonthsAgoCount: twoMonthsAgoCount || 0,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching invoice stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
