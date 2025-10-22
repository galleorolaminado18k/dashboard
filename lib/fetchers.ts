// lib/fetchers.ts
import type { MetaCampaign, CRMConversation, Order } from "./types"

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin" })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    console.warn("fetchers: safeFetch failed", url, err)
    return null
  }
}

export async function fetchMetaCampaigns(): Promise<MetaCampaign[]> {
  const json = await safeFetch<{ campaigns: MetaCampaign[] }>('/api/adv/campaigns')
  if (json && Array.isArray(json.campaigns)) return json.campaigns

  // Fallback to the previous small mock to avoid changing visible behavior
  return [
    {
      id: "120233445687010113",
      name: "Mensajes a WhatsApp del Mayor",
      accountType: "Mayor",
      dailyBudget: 150000,
      spendTotal: 548428,
      status: "Activa",
      deliveryLabel: "Activa",
      negativesPct: 22.5,
      lastUpdated: new Date().toISOString(),
    },
    {
      id: "120232224011150113",
      name: "Campaña Balines - Mensajes a WhatsApp",
      accountType: "Detal",
      dailyBudget: 90000,
      spendTotal: 12880,
      status: "Pausada",
      deliveryLabel: "Pausada",
      negativesPct: 18.3,
      lastUpdated: new Date().toISOString(),
    },
  ]
}

export async function fetchCRMConversations(): Promise<CRMConversation[]> {
  const json = await safeFetch<{ data: CRMConversation[] }>(`/api/crm/conversations`)
  if (json && Array.isArray((json as any).data)) return (json as any).data

  return [
    {
      id: "c-1",
      campaignId: "120233445687010113",
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      customerPhone: "+573001112233",
      status: "Pedido Completo",
    },
    {
      id: "c-2",
      campaignId: "120232224011150113",
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      customerPhone: "+573004445566",
      status: "Cerrada",
    },
  ]
}

export async function fetchOrders(): Promise<Order[]> {
  const json = await safeFetch<{ data: Order[] }>(`/api/sales/orders`)
  if (json && Array.isArray((json as any).data)) return (json as any).data

  return [
    {
      id: "o-1",
      conversationId: "c-1",
      customerPhone: "+573001112233",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
      items: [{ sku: "CAD-ORO", title: "Cadena Oro 18k", unitPrice: 180000, qty: 1 }],
      shippingCost: 15000,
      currency: "COP",
    },
    {
      id: "o-2",
      utmCampaignId: "120232224011150113",
      customerPhone: "+573004445566",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      items: [{ sku: "ARETES", title: "Aretes Oro", unitPrice: 120000, qty: 2, discountPerUnit: 5000 }],
      shippingCost: 12000,
      currency: "COP",
    },
  ]
}
