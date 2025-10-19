import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MIPAQUETE_API_URL = "https://api-v2.mpr.mipaquete.com/getSendingTracking"
const SESSION_TRACKER = "a0c96ea6-b22d-4fb7-a278-850678d5429c"
const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzExOWRjNDMzNjk2M2YzMzBlYjFjZTYiLCJuYW1lIjoiQ29tZXJjaWFsaXphZG9yYSIsInN1cm5hbWUiOiJnYWxlMThrIiwiZW1haWwiOiJnYWxsZW9yb2xhbWluYWRvMThrQGdtYWlsLmNvbSIsImNlbGxQaG9uZSI6IjMwMTY4NDUwMjYiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTE3VDIzOjI5OjA4LjAxNFoiLCJkYXRlIjoiMjAyNS0wOC0xOSAxMDoyMDoyNCIsImlhdCI6MTc1NTYxNjgyNH0.LHBLIsBCQlNM6WlnB514dN00dR7LcPjIQcYt1B62hEA"

export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener todas las ventas con contraentrega que no sean devoluciones
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .eq("payment_method", "contraentrega")
      .eq("is_return", false)
      .not("mipaquete_code", "is", null)

    if (salesError) {
      console.error("[v0] Error fetching sales:", salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    const updates = []

    for (const sale of sales || []) {
      if (!sale.mipaquete_code) continue

      try {
        const response = await fetch(MIPAQUETE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "session-tracker": SESSION_TRACKER,
            apikey: API_KEY,
          },
          body: JSON.stringify({ mpCode: sale.mipaquete_code }),
        })

        if (!response.ok) {
          console.error(`[v0] MiPaquete API error for ${sale.mipaquete_code}:`, response.status)
          continue
        }

        const trackingData = await response.json()

        let latestStatus = "Pendiente"
        const carrierName = trackingData?.deliveryCompanyName || ""

        if (trackingData?.tracking && Array.isArray(trackingData.tracking)) {
          const sortedTracking = trackingData.tracking.sort(
            (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          if (sortedTracking.length > 0) {
            latestStatus = sortedTracking[0].updateState || "Pendiente"
          }
        }

        const isReturn =
          latestStatus.toLowerCase().includes("devolucion") ||
          latestStatus.toLowerCase().includes("devuelto") ||
          latestStatus.toLowerCase().includes("novedad") ||
          trackingData?.tracking?.some(
            (t: any) =>
              t.updateState?.toLowerCase().includes("devolucion") || t.updateState?.toLowerCase().includes("devuelto"),
          )

        const updateData: any = {
          mipaquete_status: latestStatus,
          mipaquete_carrier: carrierName,
        }

        if (isReturn) {
          updateData.is_return = true
          updateData.status = "cancelada"
          updateData.return_date = new Date().toISOString()
        }

        const { error: updateError } = await supabase.from("sales").update(updateData).eq("id", sale.id)

        if (updateError) {
          console.error(`[v0] Error updating sale ${sale.sale_id}:`, updateError)
        } else {
          updates.push({
            sale_id: sale.sale_id,
            status: isReturn ? "moved_to_returns" : "updated",
            mipaquete_status: latestStatus,
          })
        }

        // Guardar tracking data
        await supabase.from("return_tracking").upsert({
          sale_id: sale.id,
          mipaquete_code: sale.mipaquete_code,
          last_check: new Date().toISOString(),
          status: latestStatus,
          tracking_data: trackingData,
        })
      } catch (error) {
        console.error(`[v0] Error processing sale ${sale.sale_id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      checked: sales?.length || 0,
      updates: updates.length,
      details: updates,
    })
  } catch (error) {
    console.error("[v0] Error in check-returns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
