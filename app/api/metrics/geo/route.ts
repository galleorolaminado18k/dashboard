import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.SUPABASE_SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Ignore errors in middleware
            }
          },
        },
      },
    )

    const { data: sales, error } = await supabase
      .from("sales")
      .select("city, total_amount, shipping_amount, payment_method, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching sales from Supabase:", error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    // Agrupar por ciudad y calcular métricas
    const byCity = (sales || []).reduce<
      Record<
        string,
        {
          total: number
          count: number
          buyers: Set<string>
          revenue: number
        }
      >
    >((acc, sale) => {
      const city = sale.city || "Sin ciudad"
      if (!acc[city]) {
        acc[city] = {
          total: 0,
          count: 0,
          buyers: new Set(),
          revenue: 0,
        }
      }
      acc[city].total += sale.total_amount || 0
      acc[city].count += 1
      acc[city].revenue += (sale.total_amount || 0) - (sale.shipping_amount || 0)
      return acc
    }, {})

    const ranking = Object.entries(byCity)
      .map(([ciudad, data]) => ({
        ciudad,
        total: data.total,
        ventas: data.count,
        ticket_promedio: data.count > 0 ? data.total / data.count : 0,
        revenue_sin_envio: data.revenue,
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({ ok: true, ranking, sales })
  } catch (error: any) {
    console.error("[v0] Error in geo metrics API:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
