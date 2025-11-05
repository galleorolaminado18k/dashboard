import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      shipment_id,
      action_type,
      notes,
      new_address,
      new_phone,
      contact_method
    } = body

    // Validar datos requeridos
    if (!shipment_id || !action_type) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // 1. Registrar la acción en la tabla de novedades
    const { data: novedadData, error: novedadError } = await supabase
      .from('shipment_novedades')
      .insert({
        shipment_id,
        action_type,
        notes,
        contact_method,
        created_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (novedadError) {
      console.error('Error al registrar novedad:', novedadError)
      return NextResponse.json(
        { error: 'Error al registrar la acción' },
        { status: 500 }
      )
    }

    // 2. Actualizar información según el tipo de acción
    switch (action_type) {
      case 'contactar_cliente':
        // Actualizar última fecha de contacto
        await supabase
          .from('shipments')
          .update({
            last_contact: new Date().toISOString(),
            contact_attempts: supabase.raw('contact_attempts + 1')
          })
          .eq('id', shipment_id)
        break

      case 'reprogramar':
        // Marcar como reprogramado
        await supabase
          .from('shipments')
          .update({
            status: 'reprogramado',
            rescheduled_at: new Date().toISOString()
          })
          .eq('id', shipment_id)
        break

      case 'solicitar_devolucion':
        // Iniciar proceso de devolución
        await supabase
          .from('shipments')
          .update({
            status: 'devolucion_solicitada',
            return_requested_at: new Date().toISOString()
          })
          .eq('id', shipment_id)

        // Registrar en return_tracking
        await supabase
          .from('return_tracking')
          .insert({
            tracking_number: shipment_id,
            status: 'solicitado',
            reason: notes || 'Novedad en entrega',
            requested_at: new Date().toISOString()
          })
        break

      case 'cambiar_direccion':
        // Actualizar dirección
        if (new_address) {
          await supabase
            .from('shipments')
            .update({
              delivery_address: new_address,
              address_updated_at: new Date().toISOString()
            })
            .eq('id', shipment_id)
        }
        break

      case 'actualizar_telefono':
        // Actualizar teléfono
        if (new_phone) {
          await supabase
            .from('shipments')
            .update({
              customer_phone: new_phone,
              phone_updated_at: new Date().toISOString()
            })
            .eq('id', shipment_id)
        }
        break

      default:
        // Acción genérica - solo registrar
        break
    }

    // 3. Registrar en actividad/log
    await supabase
      .from('activity_log')
      .insert({
        action: `novedad_${action_type}`,
        entity_type: 'shipment',
        entity_id: shipment_id,
        description: notes || `Acción: ${action_type}`,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Acción registrada exitosamente',
      data: novedadData
    })

  } catch (error) {
    console.error('Error en /api/shipments/novedad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener historial de novedades de un envío
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shipment_id = searchParams.get('shipment_id')

    if (!shipment_id) {
      return NextResponse.json(
        { error: 'shipment_id es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('shipment_novedades')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener novedades:', error)
      return NextResponse.json(
        { error: 'Error al obtener historial' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error en GET /api/shipments/novedad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

