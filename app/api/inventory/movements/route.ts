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

    // Validar tipos de movimiento (incluye ajuste_especial)
    const validTypes = ['entrada', 'salida', 'ajuste', 'ajuste_especial', 'transferencia']
    if (!validTypes.includes(body.movement_type)) {
      return NextResponse.json({
        ok: false,
        error: `movement_type debe ser uno de: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validar que salidas especiales tengan tipo
    if (body.movement_type === 'salida' && !body.special_exit_type) {
      return NextResponse.json({
        ok: false,
        error: 'Las salidas especiales requieren special_exit_type'
      }, { status: 400 })
    }

    // Validar que ajuste, ajuste_especial y salidas tengan descripción
    if ((body.movement_type === 'ajuste' || body.movement_type === 'ajuste_especial' || body.movement_type === 'salida') && !body.notes) {
      return NextResponse.json({
        ok: false,
        error: 'La descripción es obligatoria para este tipo de movimiento'
      }, { status: 400 })
    }

    // Preparar notas con tipo de salida especial si aplica
    let finalNotes = body.notes || null
    if (body.movement_type === 'salida' && body.special_exit_type) {
      const specialTypeLabels: Record<string, string> = {
        bono: 'Bono',
        obsequios: 'Obsequios',
        canje: 'Canje',
        puntos_acumulados: 'Puntos Acumulados',
        otros: 'Otros'
      }
      const typeLabel = specialTypeLabels[body.special_exit_type] || body.special_exit_type
      finalNotes = `[${typeLabel}] ${body.notes || ''}`
    } else if (body.movement_type === 'ajuste_especial') {
      finalNotes = `[Ajuste Especial - Descuento de ${body.quantity}] ${body.notes || ''}`
    }

    // Insertar movimiento (el trigger actualizará el stock automáticamente)
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([{
        inventory_id: body.inventory_id,
        movement_type: body.movement_type,
        warehouse_type: body.warehouse_type || 'cantidad',
        quantity: Number(body.quantity),
        notes: finalNotes,
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

