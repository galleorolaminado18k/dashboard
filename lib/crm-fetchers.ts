// =====================================================
// CRM Data Fetchers - Supabase Integration
// =====================================================
// Funciones para interactuar con las tablas del CRM en Supabase

import { createClient } from '@/lib/supabase/client'

// Tipos TypeScript para el CRM
export type ClientType = 'Nuevo' | 'Recurrente'
export type ConversationStatus = 'por-contestar' | 'pendiente-datos' | 'por-confirmar' | 'pendiente-guia' | 'pedido-completo'
export type Canal = 'whatsapp' | 'instagram' | 'messenger' | 'web' | 'telefono'
export type MessageSender = 'client' | 'agent'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  avatar_url?: string
  client_type: ClientType
  interest?: string
  address?: string
  city?: string
  department?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  client_id: string
  status: ConversationStatus
  canal: Canal
  last_message?: string
  last_message_at: string
  unread_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  client?: Client // Relación con cliente
}

export interface Message {
  id: string
  conversation_id: string
  sender: MessageSender
  content: string
  is_read: boolean
  created_at: string
}

// =====================================================
// CLIENTES
// =====================================================

/**
 * Obtener todos los clientes
 */
export async function fetchClients(): Promise<Client[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data || []
}

/**
 * Obtener un cliente por ID
 */
export async function fetchClientById(id: string): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data
}

/**
 * Crear un nuevo cliente
 */
export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    return null
  }

  return data
}

/**
 * Actualizar un cliente
 */
export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    return null
  }

  return data
}

/**
 * Eliminar un cliente
 */
export async function deleteClient(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    return false
  }

  return true
}

// =====================================================
// CONVERSACIONES
// =====================================================

/**
 * Obtener todas las conversaciones con información del cliente
 */
export async function fetchConversations(status?: ConversationStatus): Promise<Conversation[]> {
  const supabase = createClient()
  let query = supabase
    .from('conversations')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false })

  if (status && status !== 'todas') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

/**
 * Obtener una conversación por ID
 */
export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  return data
}

/**
 * Crear una nueva conversación
 */
export async function createConversation(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'client'>): Promise<Conversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert([conversation])
    .select(`
      *,
      client:clients(*)
    `)
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return data
}

/**
 * Actualizar una conversación
 */
export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      client:clients(*)
    `)
    .single()

  if (error) {
    console.error('Error updating conversation:', error)
    return null
  }

  return data
}

/**
 * Marcar mensajes como leídos (resetear contador)
 */
export async function markConversationAsRead(conversationId: string): Promise<boolean> {
  const supabase = createClient()
  
  // Marcar mensajes como leídos
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('sender', 'client')

  // Resetear contador
  const { error } = await supabase
    .from('conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId)

  if (error) {
    console.error('Error marking conversation as read:', error)
    return false
  }

  return true
}

// =====================================================
// MENSAJES
// =====================================================

/**
 * Obtener mensajes de una conversación
 */
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

/**
 * Enviar un nuevo mensaje
 */
export async function sendMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  return data
}

/**
 * Buscar clientes por nombre, email o teléfono
 */
export async function searchClients(query: string): Promise<Client[]> {
  if (!query.trim()) {
    return fetchClients()
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching clients:', error)
    return []
  }

  return data || []
}

/**
 * Obtener estadísticas del CRM
 */
export async function fetchCRMStats() {
  const supabase = createClient()
  
  // Total de conversaciones por estado
  const { data: conversationsByStatus } = await supabase
    .from('conversations')
    .select('status')
    .eq('is_active', true)

  const stats = {
    total: conversationsByStatus?.length || 0,
    porContestar: conversationsByStatus?.filter(c => c.status === 'por-contestar').length || 0,
    pendienteDatos: conversationsByStatus?.filter(c => c.status === 'pendiente-datos').length || 0,
    porConfirmar: conversationsByStatus?.filter(c => c.status === 'por-confirmar').length || 0,
    pendienteGuia: conversationsByStatus?.filter(c => c.status === 'pendiente-guia').length || 0,
    pedidoCompleto: conversationsByStatus?.filter(c => c.status === 'pedido-completo').length || 0,
  }

  return stats
}
