import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

/**
 * POST /api/shipments/force-update
 * Fuerza la actualización de un envío específico con novedad
 */
export async function POST(req: Request) {
  const supabase = createClient()

  try {
    const { tracking_number } = await req.json()

    if (!tracking_number) {
      return NextResponse.json({
        ok: false,
        error: "tracking_number es requerido"
      }, { status: 400 })
    }

    // Forzar actualización del envío
    const { data, error } = await supabase
      .from('shipments')
      .update({
        status: 'delayed',
        mipaquete_status: 'Usuario cancela pedido',
        progress: 50,
        updated_at: new Date().toISOString()
      })
      .eq('tracking_number', tracking_number)
      .select()
      .single()

    if (error) {
      console.error('[Force Update] Error:', error)
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('[Force Update] Actualizado:', data)

    return NextResponse.json({
      ok: true,
      data,
      message: 'Envío actualizado correctamente'
    })

  } catch (error: any) {
    console.error('[Force Update] Exception:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

