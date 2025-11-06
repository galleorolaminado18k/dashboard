import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API para resolver novedades - VERSIÓN REALISTA
 *
 * IMPORTANTE: MiPaquete NO tiene API pública para resolver novedades.
 * Esta API:
 * 1. Registra la acción localmente en nuestra DB
 * 2. Proporciona la URL del portal de MiPaquete
 * 3. Abre automáticamente el portal para que el usuario complete la acción
 */

const MIPAQUETE_PORTAL_URL = 'https://centrodenovedades.mipaquete.com/novedades'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      tracking_number,
      solution_type,
      description,
      new_address,
      new_city,
      recipient_name,
      recipient_phone,
      sender_name,
      sender_phone,
      sender_city,
      sender_address,
      shipment_id
    } = body

    // Validar datos requeridos
    if (!tracking_number || !solution_type) {
      return NextResponse.json(
        { error: 'tracking_number y solution_type son requeridos' },
        { status: 400 }
      )
    }

    // Validar solution_type
    const validSolutionTypes = [
      'indemnizacion',
      'volver_a_ofrecer',
      'cambio_direccion',
      'devolucion',
      'otro'
    ]

    if (!validSolutionTypes.includes(solution_type)) {
      return NextResponse.json(
        { error: 'solution_type inválido' },
        { status: 400 }
      )
    }

    // Preparar datos para registro local
    const actionData: any = {
      tracking_number,
      solution_type,
      description: description || getSolutionDescription(solution_type),
      status: 'pending',
      created_at: new Date().toISOString()
    }

    // Agregar campos específicos según el tipo
    switch (solution_type) {
      case 'cambio_direccion':
        if (!new_city || !new_address || !recipient_name || !recipient_phone) {
          return NextResponse.json(
            { error: 'Campos requeridos: new_city, new_address, recipient_name, recipient_phone' },
            { status: 400 }
          )
        }
        actionData.new_city = new_city
        actionData.new_address = new_address
        actionData.recipient_name = recipient_name
        actionData.recipient_phone = recipient_phone
        break

      case 'devolucion':
        if (!sender_name || !sender_phone || !sender_city || !sender_address) {
          return NextResponse.json(
            { error: 'Campos requeridos: sender_name, sender_phone, sender_city, sender_address' },
            { status: 400 }
          )
        }
        actionData.sender_name = sender_name
        actionData.sender_phone = sender_phone
        actionData.sender_city = sender_city
        actionData.sender_address = sender_address
        break

      case 'otro':
        if (!description || description.length < 6) {
          return NextResponse.json(
            { error: 'Descripción mínima de 6 caracteres requerida' },
            { status: 400 }
          )
        }
        break
    }

    // Registrar en base de datos local
    console.log('📝 Registrando acción localmente:', actionData)

    const supabase = await createClient()

    if (shipment_id) {
      // Registrar en shipment_novedades
      const { error: dbError } = await supabase
        .from('shipment_novedades')
        .insert({
          shipment_id,
          action_type: solution_type,
          description: actionData.description,
          data: actionData,
          status: 'pending'
        })

      if (dbError) {
        console.error('⚠️ Error al registrar en DB:', dbError)
        // No falla la request si falla el registro en DB
      }
    }

    // Construir URL del portal de MiPaquete con la guía pre-cargada
    const portalUrl = `${MIPAQUETE_PORTAL_URL}?guia=${encodeURIComponent(tracking_number)}`

    // Mapear tipo de solución a label en español
    const solutionLabels: Record<string, string> = {
      'indemnizacion': 'Indemnización',
      'volver_a_ofrecer': 'Volver a ofrecer',
      'cambio_direccion': 'Cambio de dirección',
      'devolucion': 'Devolución',
      'otro': 'Otro tipo de solución'
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${solutionLabels[solution_type]} registrada - Abriendo portal de MiPaquete`,
      data: {
        tracking_number,
        solution_type,
        solution_label: solutionLabels[solution_type],
        description: actionData.description,
        portal_url: portalUrl,
        instructions: [
          '1. Se abrirá el portal de MiPaquete automáticamente',
          `2. La guía ${tracking_number} ya está pre-cargada`,
          `3. Selecciona la solución: ${solutionLabels[solution_type]}`,
          '4. Completa los datos y confirma la acción'
        ],
        registered_locally: !!shipment_id,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error en resolver-novedad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tracking_number = searchParams.get('tracking_number')

    if (!tracking_number) {
      return NextResponse.json(
        { error: 'tracking_number requerido en query params' },
        { status: 400 }
      )
    }

    const portalUrl = `${MIPAQUETE_PORTAL_URL}?guia=${encodeURIComponent(tracking_number)}`

    return NextResponse.json({
      success: true,
      data: {
        tracking_number,
        portal_url: portalUrl,
        message: 'URL del portal de MiPaquete para gestionar novedades'
      }
    })

  } catch (error: any) {
    console.error('❌ Error en GET resolver-novedad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Obtiene la descripción por defecto según el tipo de solución
 */
function getSolutionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'indemnizacion': 'Solicitud de indemnización por novedad en entrega',
    'volver_a_ofrecer': 'Volver a ofrecer el envío al destinatario',
    'cambio_direccion': 'Actualización de dirección de entrega',
    'devolucion': 'Solicitud de devolución del pedido al remitente',
    'otro': 'Resolución personalizada de novedad'
  }
  return descriptions[type] || 'Resolución de novedad'
}

