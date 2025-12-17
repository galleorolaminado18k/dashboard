import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// Endpoint para recibir mensajes entrantes de WhatsApp y actualizar el número real en la base de datos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // El número real de WhatsApp debe llegar en body.from
    const numeroReal = body.from // Ejemplo: '573194141483'
    const nombre = body.name || 'Desconocido' // Si WhatsApp envía el nombre, úsalo

    if (!numeroReal) {
      return NextResponse.json({ ok: false, error: 'No se recibió el número de WhatsApp' }, { status: 400 })
    }

    const supabase = createClient()

    // Actualiza el número en la conversación si existe, o crea una nueva si no existe
    await supabase
      .from('crm_conversations')
      .upsert([
        {
          phone: numeroReal,
          client_name: nombre,
          canal: 'whatsapp',
          status: 'por-contestar',
          // Puedes agregar más campos si quieres
        }
      ], { onConflict: ['phone'] })

    // Aquí puedes guardar el mensaje recibido si lo deseas
    // await supabase.from('crm_messages').insert({ ... })

    return NextResponse.json({ ok: true, message: 'Número actualizado correctamente' })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
