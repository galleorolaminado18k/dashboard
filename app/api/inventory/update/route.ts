import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function PATCH(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({
        ok: false,
        error: 'Se requiere el ID del producto'
      }, { status: 400 })
    }

    // Actualizar producto
    const updateData: any = {}

    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.cost !== undefined) updateData.cost = Number(body.cost)
    if (body.price_retail !== undefined) {
      updateData.price_retail = Number(body.price_retail)
      updateData.price = Number(body.price_retail) // Mantener sincronizado
    }
    if (body.price_wholesale !== undefined) updateData.price_wholesale = Number(body.price_wholesale)
    if (body.stock !== undefined) updateData.stock = Number(body.stock)
    if (body.stock_warranty !== undefined) updateData.stock_warranty = Number(body.stock_warranty)
    if (body.min_stock !== undefined) updateData.min_stock = Number(body.min_stock)
    if (body.max_stock !== undefined) updateData.max_stock = Number(body.max_stock)
    if (body.status !== undefined) updateData.status = body.status

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('[Inventory Update] Error:', error)
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('[Inventory Update] Product updated:', data)

    return NextResponse.json({
      ok: true,
      product: data
    })

  } catch (error: any) {
    console.error('[Inventory Update] Exception:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

