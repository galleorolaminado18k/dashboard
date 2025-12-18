/**
 * API Route: Sync WhatsApp Chats
 * Sincroniza los chats existentes de WhatsApp con el CRM
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { formatPhone } from '@/lib/crm-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// URL del Gateway de WhatsApp
const GATEWAY_URL = process.env.BAILEYS_GATEWAY_URL || 'http://31.220.58.83:3010'
/**
 * POST /api/crm/sync
 * Sincroniza los chats de WhatsApp con el CRM
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Intentar obtener chats del Gateway
    let chats: any[] = []
    
    try {
      // Primero verificamos si el gateway tiene endpoint de chats
      const response = await fetch(`${GATEWAY_URL}/chats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      
      if (response.ok) {
        const data = await response.json()
        chats = data.chats || data || []
      }
    } catch (e) {
      console.log('Gateway no tiene endpoint /chats, continuando...')
    }

    // Si no hay chats del gateway, crear algunos de prueba para verificar
    if (chats.length === 0) {
      console.log('Creando conversaciones de prueba...')
      
      // Obtener la línea activa (wa_number)
      const { data: waAccount } = await supabase
        .from('crm_whatsapp_accounts')
        .select('wa_number')
        .eq('key', 'active')
        .single()
      
      const activeWaNumber = waAccount?.wa_number || '0000000000'

      const testConversations = [
        {
          phone: '573001234567',
          remote_jid: '573001234567@s.whatsapp.net',
          wa_number: activeWaNumber,
          client_name: 'Cliente de Prueba 1',
          last_message: 'Hola, quiero información sobre productos',
          status: 'por-contestar',
          canal: 'whatsapp',
          client_type: 'Nuevo',
          interest: 'Consulta',
          unread: 1,
        },
        {
          phone: '573009876543',
          remote_jid: '573009876543@s.whatsapp.net',
          wa_number: activeWaNumber,
          client_name: 'Cliente de Prueba 2',
          last_message: '¿Cuánto cuesta el envío?',
          status: 'por-contestar',
          canal: 'whatsapp',
          client_type: 'Nuevo',
          interest: 'Envío',
          unread: 1,
        },
      ]

      for (const conv of testConversations) {
        const { error } = await supabase
          .from('crm_conversations')
          .upsert(conv, { onConflict: 'wa_number,remote_jid' })
        
        if (error) {
          console.error('Error insertando conversación:', error)
        }
      }

      return NextResponse.json({
        ok: true,
        message: 'Conversaciones de prueba creadas',
        count: testConversations.length,
      })
    }

    // Obtener la línea activa (wa_number)
    const { data: waAccount } = await supabase
      .from('crm_whatsapp_accounts')
      .select('wa_number')
      .eq('key', 'active')
      .single()
    
    const activeWaNumber = waAccount?.wa_number || '0000000000'

    // Si hay chats del gateway, sincronizarlos
    let synced = 0
    for (const chat of chats) {
      if (chat.id?.includes('@g.us')) continue // Ignorar grupos
      
      const phone = formatPhone(chat.id || '')
      if (!phone) continue

      const conversation = {
        phone,
        remote_jid: chat.id,
        wa_number: activeWaNumber,
        client_name: chat.name || chat.pushName || `Cliente ${phone.slice(-4)}`,
        last_message: chat.lastMessage?.body || '',
        status: 'por-contestar',
        canal: 'whatsapp',
        client_type: 'Nuevo',
        unread: chat.unreadCount || 0,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('crm_conversations')
        .upsert(conversation, { onConflict: 'wa_number,remote_jid' })

      if (!error) synced++
    }

    return NextResponse.json({
      ok: true,
      message: `Sincronizados ${synced} chats`,
      count: synced,
    })
  } catch (error: any) {
    console.error('Error syncing WhatsApp:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/crm/sync
 * Verifica el estado de la sincronización
 */
export async function GET() {
  try {
    const supabase = createClient()
    
    const { count, error } = await supabase
      .from('crm_conversations')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    return NextResponse.json({
      ok: true,
      conversationsCount: count || 0,
      gatewayUrl: GATEWAY_URL,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}


