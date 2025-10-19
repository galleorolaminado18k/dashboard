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
