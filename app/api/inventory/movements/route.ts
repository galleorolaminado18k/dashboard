import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.inventory_id || !body.movement_type || body.quantity === undefined) {
      return NextResponse.json({
        ok: false,
        error: 'Faltan campos requeridos: inventory_id, movement_type, quantity'
      }, { status: 400 })
    }

    // Validar tipos de movimiento
    const validTypes = ['entrada', 'salida', 'ajuste', 'transferencia', 'garantia']
    if (!validTypes.includes(body.movement_type)) {
      return NextResponse.json({
        ok: false,
        error: `movement_type debe ser uno de: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Insertar movimiento (el trigger actualizará el stock automáticamente)
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([{
        inventory_id: body.inventory_id,
        movement_type: body.movement_type,
        warehouse_type: body.warehouse_type || 'cantidad',
        quantity: Number(body.quantity),
        notes: body.notes || null,
        created_by: body.created_by || 'sistema'
      }])
      .select()
      .single()

    if (error) {
      console.error('[Inventory Movement] Error:', error)
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('[Inventory Movement] Movement created:', data)

    return NextResponse.json({
      ok: true,
      movement: data
    })

  } catch (error: any) {
    console.error('[Inventory Movement] Exception:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET: Obtener movimientos de un producto
export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const inventoryId = searchParams.get('inventory_id')

  try {
    let query = supabase
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })

    if (inventoryId) {
      query = query.eq('inventory_id', inventoryId)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('[Inventory Movement] Error:', error)
      return NextResponse.json({
        ok: false,
        movements: [],
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      movements: data || []
    })

  } catch (error: any) {
    console.error('[Inventory Movement] Exception:', error)
    return NextResponse.json({
      ok: false,
      movements: [],
      error: error.message
    }, { status: 500 })
  }
}

