import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { formatPhone } from '@/lib/crm-service'

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

    const numeroNormalizado = formatPhone(body.from);
    if (!numeroNormalizado) {
      console.error('Número de WhatsApp inválido recibido:', body.from)
      return NextResponse.json({ ok: false, error: 'Número de WhatsApp inválido recibido', numeroRecibido: body.from }, { status: 400 });
    }

    const supabase = createClient()

    // Obtener la línea activa (wa_number)
    const { data: waAccount } = await supabase
      .from('crm_whatsapp_accounts')
      .select('wa_number')
      .eq('key', 'active')
      .single()
    
    const activeWaNumber = waAccount?.wa_number || '0000000000'
    const remoteJid = body.remoteJid || (numeroNormalizado + '@s.whatsapp.net');

    // Actualiza el número en la conversación si existe, o crea una nueva si no existe
    const { error: upsertError } = await supabase
      .from('crm_conversations')
      .upsert([
        {
          phone: numeroNormalizado,
          remote_jid: remoteJid,
          wa_number: activeWaNumber,
          client_name: nombre,
          canal: 'whatsapp',
          status: 'por-contestar',
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'wa_number,remote_jid' })

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
