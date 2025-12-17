import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

// Endpoint para recibir mensajes entrantes de WhatsApp y actualizar el número real en la base de datos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Log para depuración
    console.log('Webhook recibido:', JSON.stringify(body, null, 2));
    // El número real de WhatsApp debe llegar en body.from
    const numeroReal = body.from // Ejemplo: '573194141483'
    const nombre = body.name || 'Desconocido' // Si WhatsApp envía el nombre, úsalo

    if (!numeroReal) {
      console.error('No se recibió el número de WhatsApp en el webhook:', body)
      return NextResponse.json({ ok: false, error: 'No se recibió el número de WhatsApp' }, { status: 400 })
    }

    // Normaliza y valida el número recibido
    function normalizarNumero(raw: string): string | null {
      if (!raw) return null;
      let cleaned = raw.replace(/[^\d]/g, '');
      // Si empieza por 57 y tiene 12 dígitos, es válido para Colombia
      if (cleaned.startsWith('57') && cleaned.length === 12) return cleaned;
      // Si tiene 10 dígitos y empieza por 3, anteponer 57
      if (cleaned.length === 10 && cleaned.startsWith('3')) return '57' + cleaned;
      // Si tiene entre 8 y 15 dígitos, devolver tal cual (internacional)
      if (cleaned.length >= 8 && cleaned.length <= 15) return cleaned;
      return null;
    }

    const numeroNormalizado = normalizarNumero(body.from);
    if (!numeroNormalizado) {
      console.error('Número de WhatsApp inválido recibido:', body.from)
      return NextResponse.json({ ok: false, error: 'Número de WhatsApp inválido recibido', numeroRecibido: body.from }, { status: 400 });
    }

    const supabase = createClient()

    // Actualiza el número en la conversación si existe, o crea una nueva si no existe
    const { error: upsertError } = await supabase
      .from('crm_conversations')
      .upsert([
        {
          phone: numeroNormalizado,
          client_name: nombre,
          canal: 'whatsapp',
          status: 'por-contestar',
        }
      ], { onConflict: 'phone' })

    if (upsertError) {
      console.error('Error actualizando conversación:', upsertError)
      return NextResponse.json({ ok: false, error: 'Error actualizando conversación', detalle: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Número actualizado correctamente', numero: numeroNormalizado })
  } catch (error) {
    console.error('Error en webhook WhatsApp:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
