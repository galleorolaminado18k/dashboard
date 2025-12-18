/**
 * CRM Service - Gestión de conversaciones WhatsApp
 * Integra los chats de WhatsApp con el sistema CRM
 */

import { createClient } from '@/lib/supabase/client'

// Estados del CRM
export const CRM_ESTADOS = {
  POR_CONTESTAR: 'por-contestar',
  PENDIENTE_DATOS: 'pendiente-datos',
  POR_CONFIRMAR: 'por-confirmar',
  PENDIENTE_GUIA: 'pendiente-guia',
  PEDIDO_COMPLETO: 'pedido-completo',
  DEVOLUCION: 'devolucion',
} as const

// Canales de comunicación
export const CRM_CANALES = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  MESSENGER: 'messenger',
  WEB: 'web',
  TELEFONO: 'telefono',
} as const

// Tipos
export interface CRMConversation {
  id?: string
  phone: string
  phone_norm?: string
  client_jid?: string
  client_jid_alt?: string
  remote_jid?: string
  wa_number?: string
  client_name: string
  last_message: string
  timestamp: string
  unread: number
  status: string
  canal: string
  avatar?: string
  client_type: 'Nuevo' | 'Recurrente'
  interest?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
}

export interface CRMMessage {
  id?: string
  conversation_id: string
  wa_number?: string
  sender: 'client' | 'agent'
  content: string
  type: 'text' | 'image' | 'audio' | 'video' | 'document'
  direction?: 'inbound' | 'outbound'
  timestamp: string
  read: boolean
  metadata?: Record<string, any>
  created_at?: string
}

/**
 * Detectar interés basado en el mensaje
 */
export function detectInterest(message: string): string | null {
  const lowerMessage = message.toLowerCase()

  // Palabras clave para detectar interés
  const interests: Record<string, string[]> = {
    'Balinería': ['balinería', 'balineria', 'balín', 'balin', 'rodamiento'],
    'Joyería': ['joyería', 'joyeria', 'joyas', 'collar', 'anillo', 'pulsera', 'arete'],
    'Envío': ['envío', 'envio', 'despacho', 'entrega', 'guía', 'guia'],
    'Precio': ['precio', 'costo', 'valor', 'cuánto', 'cuanto'],
    'Devolución': ['devolución', 'devolucion', 'cambio', 'garantía', 'garantia'],
  }

  for (const [interest, keywords] of Object.entries(interests)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return interest
    }
  }

  return null
}

/**
 * Determinar estado inicial basado en el mensaje
 */
export function determineInitialStatus(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Palabras que indican que necesita datos
  if (lowerMessage.includes('dirección') || lowerMessage.includes('direccion') ||
      lowerMessage.includes('dato') || lowerMessage.includes('información')) {
    return CRM_ESTADOS.PENDIENTE_DATOS
  }

  // Palabras que indican confirmación
  if (lowerMessage.includes('confirmo') || lowerMessage.includes('acepto') ||
      lowerMessage.includes('listo')) {
    return CRM_ESTADOS.POR_CONFIRMAR
  }

  // Palabras que indican devolución
  if (lowerMessage.includes('devolución') || lowerMessage.includes('devolucion') ||
      lowerMessage.includes('cambio') || lowerMessage.includes('problema')) {
    return CRM_ESTADOS.DEVOLUCION
  }

  // Por defecto, necesita respuesta
  return CRM_ESTADOS.POR_CONTESTAR
}

/**
 * Formatear y normalizar número de teléfono a formato colombiano 57XXXXXXXXXX
 * O mantener formato internacional si ya viene con código de país.
 */
export function formatPhone(phone: string): string {
  if (!phone) return ''

  // 1. Manejar formatos especiales de WhatsApp
  if (phone.includes('@broadcast') || phone.includes('@g.us')) {
    return '' // Ignorar grupos y estados
  }

  // 2. Remover @c.us, @s.whatsapp.net, etc.
  let cleaned = phone.split('@')[0]

  // 3. Remover caracteres no numéricos
  cleaned = cleaned.replace(/\D/g, '')

  // 4. Si no tiene dígitos, es inválido
  if (!cleaned) return ''

  // 5. Normalización específica para Colombia
  // Si tiene 10 dígitos y empieza con 3, anteponer 57
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    return `57${cleaned}`
  }

  // Evitar duplicación 5757XXXXXXXXXX
  if (cleaned.startsWith('5757') && cleaned.length >= 12) {
    return cleaned.slice(2)
  }

  // 6. Validaciones de longitud estándar E.164 (aprox 10-15+ dígitos)
  if (cleaned.length >= 10 && cleaned.length <= 16) {
    return cleaned
  }

  // Si es muy corto o muy largo y no pudimos normalizarlo, es inválido
  return ''
}

/**
 * Obtener o crear conversación
 */
export async function getOrCreateConversation(
  phone: string,
  clientName: string,
  initialMessage: string,
  remote_jid?: string,
  wa_number?: string,
  client_jid?: string,
  client_jid_alt?: string
): Promise<CRMConversation> {
  const supabase = createClient()
  const formattedPhone = formatPhone(phone)

  // 1. Intentar por client_jid + wa_number (LA NUEVA VERDAD)
  if (client_jid && wa_number) {
    const { data: existing } = await supabase
      .from('crm_conversations')
      .select('*')
      .eq('client_jid', client_jid)
      .eq('wa_number', wa_number)
      .maybeSingle()

    if (existing) {
      const { data: updated } = await supabase
        .from('crm_conversations')
        .update({
          client_name: clientName || existing.client_name,
          last_message: initialMessage,
          timestamp: new Date().toISOString(),
          unread: (existing.unread || 0) + 1,
          status: CRM_ESTADOS.POR_CONTESTAR,
          updated_at: new Date().toISOString(),
          phone: formattedPhone || existing.phone,
          phone_norm: formattedPhone || existing.phone_norm,
          client_jid_alt: client_jid_alt || existing.client_jid_alt,
          remote_jid: remote_jid || existing.remote_jid,
        })
        .eq('id', existing.id)
        .select()
        .single()
      return updated || existing
    }
  }

  // 2. Intentar por remote_jid + wa_number (fallback anterior)
  if (remote_jid && wa_number) {
    const { data: existing } = await supabase
      .from('crm_conversations')
      .select('*')
      .eq('remote_jid', remote_jid)
      .eq('wa_number', wa_number)
      .maybeSingle()

    if (existing) {
      const { data: updated } = await supabase
        .from('crm_conversations')
        .update({
          client_name: clientName || existing.client_name,
          last_message: initialMessage,
          timestamp: new Date().toISOString(),
          unread: (existing.unread || 0) + 1,
          status: CRM_ESTADOS.POR_CONTESTAR,
          updated_at: new Date().toISOString(),
          phone: formattedPhone || existing.phone,
          client_jid: client_jid || existing.client_jid,
          client_jid_alt: client_jid_alt || existing.client_jid_alt,
        })
        .eq('id', existing.id)
        .select()
        .single()
      return updated || existing
    }
  }

  // 3. Fallback a búsqueda por teléfono (legacy o canales sin JID)
  const { data: existing } = await supabase
    .from('crm_conversations')
    .select('*')
    .eq('phone', formattedPhone)
    .maybeSingle()

  if (existing) {
    const { data: updated } = await supabase
      .from('crm_conversations')
      .update({
        client_name: clientName || existing.client_name,
        last_message: initialMessage,
        timestamp: new Date().toISOString(),
        unread: (existing.unread || 0) + 1,
        status: CRM_ESTADOS.POR_CONTESTAR,
        updated_at: new Date().toISOString(),
        remote_jid: remote_jid || existing.remote_jid,
        wa_number: wa_number || existing.wa_number,
        client_jid: client_jid || existing.client_jid,
        client_jid_alt: client_jid_alt || existing.client_jid_alt,
      })
      .eq('id', existing.id)
      .select()
      .single()
    return updated || existing
  }

  // 4. Crear nueva conversación
  const newConversation: any = {
    phone: formattedPhone,
    client_jid: client_jid,
    client_jid_alt: client_jid_alt,
    remote_jid: remote_jid,
    wa_number: wa_number,
    client_name: clientName || `Cliente ${formattedPhone.slice(-4)}`,
    last_message: initialMessage,
    timestamp: new Date().toISOString(),
    unread: 1,
    status: determineInitialStatus(initialMessage),
    canal: CRM_CANALES.WHATSAPP,
    client_type: 'Nuevo',
    interest: detectInterest(initialMessage) || undefined,
  }

  const { data: created, error } = await supabase
    .from('crm_conversations')
    .insert(newConversation)
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw error
  }

  return created
}

/**
 * Guardar mensaje en el CRM
 */
export async function saveMessage(
  conversationId: string,
  sender: 'client' | 'agent',
  content: string,
  type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text',
  metadata?: Record<string, any>,
  wa_number?: string
): Promise<CRMMessage> {
  const supabase = createClient()

  const message: CRMMessage = {
    conversation_id: conversationId,
    sender,
    content,
    type,
    direction: sender === 'client' ? 'inbound' : 'outbound',
    timestamp: new Date().toISOString(),
    read: sender === 'agent',
    metadata,
    wa_number,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('crm_messages')
    .insert(message)
    .select()
    .single()

  if (error) {
    console.error('Error saving message:', error)
    throw error
  }

  return data
}

/**
 * Actualizar estado de conversación
 */
export async function updateConversationStatus(
  conversationId: string,
  status: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('crm_conversations')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Error updating conversation status:', error)
    throw error
  }
}

/**
 * Marcar conversación como leída
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
  const supabase = createClient()

  // Actualizar conversación
  await supabase
    .from('crm_conversations')
    .update({
      unread: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // Marcar mensajes como leídos
  await supabase
    .from('crm_messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('sender', 'client')
}

/**
 * Obtener conversaciones con filtros
 */
export async function getConversations(filters?: {
  status?: string
  canal?: string
  search?: string
  limit?: number
}): Promise<CRMConversation[]> {
  const supabase = createClient()

  let query = supabase
    .from('crm_conversations')
    .select('*')
    .order('timestamp', { ascending: false })

  if (filters?.status && filters.status !== 'todas') {
    query = query.eq('status', filters.status)
  }

  if (filters?.canal) {
    query = query.eq('canal', filters.canal)
  }

  if (filters?.search) {
    query = query.or(`client_name.ilike.%${filters.search}%,last_message.ilike.%${filters.search}%`)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

/**
 * Obtener mensajes de una conversación
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<CRMMessage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

/**
 * Obtener estadísticas del CRM
 */
export async function getCRMStats(): Promise<Record<string, number>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('crm_conversations')
    .select('status')

  if (error) {
    console.error('Error fetching CRM stats:', error)
    return {}
  }

  const stats: Record<string, number> = {
    todas: data.length,
    'por-contestar': 0,
    'pendiente-datos': 0,
    'por-confirmar': 0,
    'pendiente-guia': 0,
    'pedido-completo': 0,
    'devolucion': 0,
  }

  for (const conv of data) {
    if (stats[conv.status] !== undefined) {
      stats[conv.status]++
    }
  }

  return stats
}

