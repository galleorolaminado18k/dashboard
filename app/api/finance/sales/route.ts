import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching sales data...")
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const month = Number.parseInt(searchParams.get("month") || "0")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59)

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .gte("sale_date", startOfMonth.toISOString())
      .lte("sale_date", endOfMonth.toISOString())
      .order("sale_date", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sales:", error)
      return NextResponse.json([])
    }

    console.log("[v0] Sales data fetched successfully:", data?.length || 0, "records")
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error("[v0] Error fetching sales:", error)
    return NextResponse.json([])
  }
}
