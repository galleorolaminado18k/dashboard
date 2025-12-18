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

    // Normalizar para mostrar (opcional)
    const phoneDisplay = numeroReal.split('@')[0].replace(/\D/g, '')

    const clientJid = body.remoteJid || (numeroReal.includes('@') ? numeroReal : numeroReal + '@s.whatsapp.net');
    const clientJidAlt = body.remoteJidAlt || null;

    const supabase = createClient()

    // Obtener la línea activa (wa_number)
    const { data: waAccount } = await supabase
      .from('crm_whatsapp_accounts')
      .select('wa_number')
      .eq('key', 'active')
      .single()
    
    const activeWaNumber = waAccount?.wa_number || '0000000000'
    const remoteJid = body.remoteJid || clientJid;

    // Actualiza el número en la conversación si existe, o crea una nueva si no existe
    const { error: upsertError } = await supabase
      .from('crm_conversations')
      .upsert([
        {
          phone: phoneDisplay,
          remote_jid: remoteJid,
          client_jid: clientJid,
          client_jid_alt: clientJidAlt,
          wa_number: activeWaNumber,
          client_name: nombre,
          canal: 'whatsapp',
          status: 'por-contestar',
          updated_at: new Date().toISOString(),
        }
      ], { onConflict: 'wa_number,client_jid' })

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
