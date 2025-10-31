import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

// Endpoint de prueba para verificar conexión con Supabase
export async function GET() {
  try {
    const supabase = createClient()

    // Consulta directa a invoices
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      count: invoices?.length || 0,
      data: invoices || [],
      timestamp: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}

