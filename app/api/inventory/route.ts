import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClient()

  try {
    // Obtener productos del inventario desde Supabase
    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Inventory API] Error:', error)
      return NextResponse.json({
        ok: false,
        products: [],
        error: error.message
      }, { status: 500 })
    }

    console.log(`[Inventory API] Retrieved ${products?.length || 0} products`)

    return NextResponse.json({
      ok: true,
      products: products || []
    })

  } catch (error: any) {
    console.error('[Inventory API] Exception:', error)
    return NextResponse.json({
      ok: false,
      products: [],
      error: error.message
    }, { status: 500 })
  }
}

