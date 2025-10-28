import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.sku || !body.name || body.price === undefined) {
      return NextResponse.json({
        ok: false,
        error: 'Faltan campos requeridos: sku, name, price'
      }, { status: 400 })
    }

    // Insertar producto en Supabase
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        sku: body.sku,
        name: body.name,
        description: body.description || null,
        category: body.category || null,
        price: Number(body.price),
        cost: Number(body.cost) || 0,
        stock: Number(body.stock) || 0,
        min_stock: Number(body.min_stock) || 0,
        max_stock: Number(body.max_stock) || 0,
        status: body.status || 'active'
      }])
      .select()
      .single()

    if (error) {
      console.error('[Inventory Create] Error:', error)
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('[Inventory Create] Product created:', data)

    return NextResponse.json({
      ok: true,
      product: data
    })

  } catch (error: any) {
    console.error('[Inventory Create] Exception:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

