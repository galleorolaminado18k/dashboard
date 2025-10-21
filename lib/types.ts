// lib/types.ts
export type AccountType = "Detal" | "Mayor"

export type MetaCampaign = {
  id: string
  name: string
  accountType: AccountType
  dailyBudget: number
  spendTotal: number
  status: "Activa" | "Pausada"
  deliveryLabel: "Activa" | "Pausada"
  negativesPct?: number
  lastUpdated: string
}

export type CRMConversation = {
  id: string
  campaignId: string
  startedAt: string
  customerPhone: string
  status: "Abierta" | "Pedido Completo" | "Cerrada"
}

export type OrderItem = {
  sku: string
  title: string
  unitPrice: number
  qty: number
  returnedQty?: number
  discountPerUnit?: number
}

export type Order = {
  id: string
  conversationId?: string
  utmCampaignId?: string
  customerPhone: string
  createdAt: string
  items: OrderItem[]
  shippingCost: number
  otherFees?: number
  currency: "COP" | string
}

export type CampaignRow = {
  id: string
  name: string
  status: "Activa" | "Pausada"
  deliveryLabel: "Activa" | "Pausada"
  accountType: AccountType
  meta: {
    dailyBudget: number
    spendTotal: number
  }
  crm: {
    conversations: number
    completedOrders: number
  }
  sales: {
    revenue: number
  }
  negativesPct?: number
  lastUpdated: string
}

// ============================================
// TIPOS PARA HISTORIAL DE COMPRAS (IQ 145)
// ============================================

export type ConversationStatus =
  | 'por-contestar'
  | 'pendiente-datos'
  | 'por-confirmar'
  | 'pendiente-guia'
  | 'pedido-completo'
  | 'devolucion' // 🔴 Estado rojo - Solo desde pedido-completo

export type PaymentMethod =
  | 'transferencia'
  | 'nequi'
  | 'daviplata'
  | 'bancolombia'
  | 'contraentrega'
  | 'efectivo'
  | 'anticipado'

// Producto individual en una compra
export interface ProductoPurchase {
  nombre: string
  precio: number
  cantidad: number
  devuelto?: boolean // 🔴 true si fue devuelto
}

// Historial de compras
export interface Purchase {
  id: string
  conversation_id?: string | null
  client_id: string
  productos: ProductoPurchase[]
  subtotal: number
  envio: number
  descuento: number
  total: number
  metodo_pago: PaymentMethod
  direccion_envio?: string | null
  ciudad?: string | null
  codigo_guia?: string | null
  entregado: boolean
  fecha_entrega?: string | null
  notas?: string | null
  created_at: string
  updated_at: string
}

// Resumen de compras por cliente (para vista agregada)
export interface PurchaseSummary {
  client_id: string
  client_name: string
  email: string
  total_compras: number
  monto_total: number
  ultima_compra: string
  historial: Purchase[]
}
