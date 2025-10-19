import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching KPIs...")
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    if (!month || month === "null") {
      const startOfYear = new Date(year, 0, 1).toISOString()
      const endOfYear = new Date(year, 11, 31, 23, 59, 59).toISOString()
      const startOfPrevYear = new Date(year - 1, 0, 1).toISOString()
      const endOfPrevYear = new Date(year - 1, 11, 31, 23, 59, 59).toISOString()

      const { data: currentSales, error: salesError } = await supabase
        .from("sales")
        .select("total, payment_method, sale_date")
        .gte("sale_date", startOfYear)
        .lte("sale_date", endOfYear)
        .eq("status", "PAGADO")

      if (salesError) {
        console.error("[v0] Error fetching sales:", salesError)
      }

      const { data: prevSales } = await supabase
        .from("sales")
        .select("total")
        .gte("sale_date", startOfPrevYear)
        .lte("sale_date", endOfPrevYear)
        .eq("status", "PAGADO")

      const { data: currentExpenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .gte("expense_date", startOfYear)
        .lte("expense_date", endOfYear)
        .eq("status", "PAGADO")

      if (expensesError) {
        console.error("[v0] Error fetching expenses:", expensesError)
      }

      const { data: prevExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", startOfPrevYear)
        .lte("expense_date", endOfPrevYear)
        .eq("status", "PAGADO")

      const totalSales = currentSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
      const totalExpenses = currentExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
      const netProfit = totalSales - totalExpenses
      const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0"
      const tickets = currentSales?.length || 0
      const avgSale = tickets > 0 ? totalSales / tickets : 0

      const prevTotalSales = prevSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
      const prevTotalExpenses = prevExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
      const prevNetProfit = prevTotalSales - prevTotalExpenses
      const prevMargin = prevTotalSales > 0 ? (prevNetProfit / prevTotalSales) * 100 : 0
      const prevTickets = prevSales?.length || 0
      const prevAvgSale = prevTickets > 0 ? prevTotalSales / prevTickets : 0

      const salesDelta = prevTotalSales > 0 ? (((totalSales - prevTotalSales) / prevTotalSales) * 100).toFixed(1) : "0"
      const expensesDelta =
        prevTotalExpenses > 0 ? (((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100).toFixed(1) : "0"
      const profitDelta = prevNetProfit > 0 ? (((netProfit - prevNetProfit) / prevNetProfit) * 100).toFixed(1) : "0"
      const marginDelta =
        prevMargin > 0 ? (((Number.parseFloat(margin.toString()) - prevMargin) / prevMargin) * 100).toFixed(1) : "0"
      const ticketsDelta = prevTickets > 0 ? (((tickets - prevTickets) / prevTickets) * 100).toFixed(1) : "0"
      const avgSaleDelta = prevAvgSale > 0 ? (((avgSale - prevAvgSale) / prevAvgSale) * 100).toFixed(1) : "0"

      console.log("[v0] KPIs calculated successfully")
      return NextResponse.json({
        totalSales,
        totalExpenses,
        netProfit,
        margin,
        tickets,
        avgSale,
        salesDelta,
        expensesDelta,
        profitDelta,
        marginDelta,
        ticketsDelta,
        avgSaleDelta,
        weeklyData: [],
        paymentMethods: [],
        expenseCategories: [],
      })
    }

    // Calculate date ranges
    const startOfMonth = new Date(year, Number.parseInt(month) - 1, 1)
    const endOfMonth = new Date(year, Number.parseInt(month), 0, 23, 59, 59)
    const startOfPrevMonth = new Date(year, Number.parseInt(month) - 2, 1)
    const endOfPrevMonth = new Date(year, Number.parseInt(month) - 1, 0, 23, 59, 59)

    // Fetch current month sales
    const { data: currentSales } = await supabase
      .from("sales")
      .select("total, payment_method, sale_date")
      .gte("sale_date", startOfMonth.toISOString())
      .lte("sale_date", endOfMonth.toISOString())
      .eq("status", "PAGADO")

    // Fetch previous month sales
    const { data: prevSales } = await supabase
      .from("sales")
      .select("total")
      .gte("sale_date", startOfPrevMonth.toISOString())
      .lte("sale_date", endOfPrevMonth.toISOString())
      .eq("status", "PAGADO")

    // Fetch current month expenses
    const { data: currentExpenses } = await supabase
      .from("expenses")
      .select("amount, category, expense_date")
      .gte("expense_date", startOfMonth.toISOString())
      .lte("expense_date", endOfMonth.toISOString())
      .eq("status", "PAGADO")

    // Fetch previous month expenses
    const { data: prevExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", startOfPrevMonth.toISOString())
      .lte("expense_date", endOfPrevMonth.toISOString())
      .eq("status", "PAGADO")

    // Calculate KPIs
    const totalSales = currentSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
    const totalExpenses = currentExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const netProfit = totalSales - totalExpenses
    const margin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0"
    const tickets = currentSales?.length || 0
    const avgSale = tickets > 0 ? totalSales / tickets : 0

    const prevTotalSales = prevSales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0
    const prevTotalExpenses = prevExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const prevNetProfit = prevTotalSales - prevTotalExpenses
    const prevMargin = prevTotalSales > 0 ? (prevNetProfit / prevTotalSales) * 100 : 0
    const prevTickets = prevSales?.length || 0
    const prevAvgSale = prevTickets > 0 ? prevTotalSales / prevTickets : 0

    // Calculate deltas
    const salesDelta = prevTotalSales > 0 ? (((totalSales - prevTotalSales) / prevTotalSales) * 100).toFixed(1) : "0"
    const expensesDelta =
      prevTotalExpenses > 0 ? (((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100).toFixed(1) : "0"
    const profitDelta = prevNetProfit > 0 ? (((netProfit - prevNetProfit) / prevNetProfit) * 100).toFixed(1) : "0"
    const marginDelta =
      prevMargin > 0 ? (((Number.parseFloat(margin.toString()) - prevMargin) / prevMargin) * 100).toFixed(1) : "0"
    const ticketsDelta = prevTickets > 0 ? (((tickets - prevTickets) / prevTickets) * 100).toFixed(1) : "0"
    const avgSaleDelta = prevAvgSale > 0 ? (((avgSale - prevAvgSale) / prevAvgSale) * 100).toFixed(1) : "0"

    // Weekly data
    const weeklyData = []
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(year, Number.parseInt(month) - 1, (week - 1) * 7 + 1)
      const weekEnd = new Date(year, Number.parseInt(month) - 1, week * 7, 23, 59, 59)

      const weekSales =
        currentSales
          ?.filter((s) => {
            const date = new Date(s.sale_date)
            return date >= weekStart && date <= weekEnd
          })
          .reduce((sum, s) => sum + (s.total || 0), 0) || 0

      const weekExpenses =
        currentExpenses
          ?.filter((e) => {
            const date = new Date(e.expense_date)
            return date >= weekStart && date <= weekEnd
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      weeklyData.push({
        week: `Sem ${week}`,
        ventas: weekSales,
        gastos: weekExpenses,
      })
    }

    // Payment methods distribution
    const paymentMethods = [
      { name: "Efectivo", value: 0 },
      { name: "Transferencia", value: 0 },
      { name: "Contraentrega", value: 0 },
    ]
    currentSales?.forEach((s) => {
      const method = paymentMethods.find((m) => m.name.toLowerCase() === s.payment_method?.toLowerCase())
      if (method) method.value += s.total || 0
    })
    const totalPayments = paymentMethods.reduce((sum, m) => sum + m.value, 0)
    paymentMethods.forEach((m) => {
      m.value = totalPayments > 0 ? Number.parseFloat(((m.value / totalPayments) * 100).toFixed(1)) : 0
    })

    // Expense categories distribution
    const expenseCategories = [
      { name: "Fijos", value: 0 },
      { name: "Variables", value: 0 },
      { name: "Marketing", value: 0 },
      { name: "Logistica", value: 0 },
      { name: "Otros", value: 0 },
    ]
    currentExpenses?.forEach((e) => {
      const category = expenseCategories.find((c) => c.name.toLowerCase() === e.category?.toLowerCase())
      if (category) category.value += e.amount || 0
    })
    const totalExpensesCategories = expenseCategories.reduce((sum, c) => sum + c.value, 0)
    expenseCategories.forEach((c) => {
      c.value =
        totalExpensesCategories > 0 ? Number.parseFloat(((c.value / totalExpensesCategories) * 100).toFixed(1)) : 0
    })

    return NextResponse.json({
      totalSales,
      totalExpenses,
      netProfit,
      margin,
      tickets,
      avgSale,
      salesDelta,
      expensesDelta,
      profitDelta,
      marginDelta,
      ticketsDelta,
      avgSaleDelta,
      weeklyData,
      paymentMethods,
      expenseCategories,
    })
  } catch (error) {
    console.error("[v0] Error fetching KPIs:", error)
    return NextResponse.json({ error: "Error fetching KPIs" }, { status: 500 })
  }
}
