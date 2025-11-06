import { NextResponse } from 'next/server'

/**
 * API para resolver novedades directamente con MiPaquete
 * Integración con las 5 opciones reales del sistema de MiPaquete
 */

const MIPAQUETE_BASE_URL = 'https://api.mipaquete.com/v2'
const APIKEY = process.env.MIPAQUETE_API_KEY!
const SESSION_TRACKER = process.env.MIPAQUETE_SESSION_TRACKER!

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
      sender_address
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

    // Preparar datos para MiPaquete
    let mipaqueteData: any = {
      tracking_number
    }

    switch (solution_type) {
      case 'indemnizacion':
        mipaqueteData.solution = 'indemnizacion'
        mipaqueteData.description = description || 'Solicitud de indemnización'
        break

      case 'volver_a_ofrecer':
        mipaqueteData.solution = 'volver_a_ofrecer'
        mipaqueteData.description = description || 'Volver a ofrecer'
        if (new_address) mipaqueteData.support_address = new_address
        break

      case 'cambio_direccion':
        if (!new_city || !new_address || !recipient_name || !recipient_phone) {
          return NextResponse.json(
            { error: 'Campos requeridos: new_city, new_address, recipient_name, recipient_phone' },
            { status: 400 }
          )
        }
        mipaqueteData.solution = 'cambio_direccion'
        mipaqueteData.new_city = new_city
        mipaqueteData.new_address = new_address
        mipaqueteData.recipient_name = recipient_name
        mipaqueteData.recipient_phone = recipient_phone
        mipaqueteData.description = description || 'Cambio de dirección'
        break

      case 'devolucion':
        if (!sender_name || !sender_phone || !sender_city || !sender_address) {
          return NextResponse.json(
            { error: 'Campos requeridos: sender_name, sender_phone, sender_city, sender_address' },
            { status: 400 }
          )
        }
        mipaqueteData.solution = 'devolucion'
        mipaqueteData.sender_name = sender_name
        mipaqueteData.sender_phone = sender_phone
        mipaqueteData.sender_city = sender_city
        mipaqueteData.sender_address = sender_address
        mipaqueteData.description = description || 'Devolución'
        break

      case 'otro':
        if (!description || description.length < 6) {
          return NextResponse.json(
            { error: 'Descripción mínima de 6 caracteres requerida' },
            { status: 400 }
          )
        }
        mipaqueteData.solution = 'otro'
        mipaqueteData.description = description
        break

      default:
        return NextResponse.json(
          { error: 'Solución no soportada' },
          { status: 400 }
        )
    }

    // Enviar a MiPaquete
    console.log('📤 Enviando a MiPaquete:', mipaqueteData)

    const mipaqueteResponse = await fetch(`${MIPAQUETE_BASE_URL}/novedades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': APIKEY,
        'session-tracker': SESSION_TRACKER
      },
      body: JSON.stringify(mipaqueteData)
    })

    const mipaqueteResult = await mipaqueteResponse.json()

    console.log('📥 Respuesta MiPaquete:', {
      status: mipaqueteResponse.status,
      data: mipaqueteResult
    })

    if (!mipaqueteResponse.ok) {
      return NextResponse.json(
        {
          error: 'Error en MiPaquete',
          details: mipaqueteResult,
          status: mipaqueteResponse.status
        },
        { status: mipaqueteResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Solución enviada a MiPaquete exitosamente',
      data: {
        tracking_number,
        solution_type,
        mipaquete_response: mipaqueteResult,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Error interno', details: error.message },
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
        { error: 'tracking_number requerido' },
        { status: 400 }
      )
    }

    const trackingResponse = await fetch(
      `${MIPAQUETE_BASE_URL}/tracking?tracking_number=${tracking_number}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': APIKEY,
          'session-tracker': SESSION_TRACKER
        }
      }
    )

    if (!trackingResponse.ok) {
      return NextResponse.json(
        { error: 'Error al consultar tracking' },
        { status: trackingResponse.status }
      )
    }

    const trackingData = await trackingResponse.json()

    return NextResponse.json({
      success: true,
      data: trackingData
    })

  } catch (error: any) {
    console.error('❌ Error GET:', error)
    return NextResponse.json(
      { error: 'Error interno', details: error.message },
      { status: 500 }
    )
  }
}

