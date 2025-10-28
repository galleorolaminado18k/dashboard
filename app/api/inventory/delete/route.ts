import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function DELETE(request: Request) {
  const supabase = createClient()

  try {
    const body = await request.json()

    // Validar campos requeridos
    if (!body.id) {
      return NextResponse.json({
        ok: false,
        error: 'Falta el ID del producto'
      }, { status: 400 })
    }

    // Eliminar producto de Supabase
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', body.id)

    if (error) {
      console.error('[Inventory Delete] Error:', error)
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('[Inventory Delete] Product deleted:', body.id)

    return NextResponse.json({
      ok: true,
      message: 'Producto eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('[Inventory Delete] Exception:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}

