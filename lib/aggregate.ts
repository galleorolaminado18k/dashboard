// lib/aggregate.ts
import type { CampaignRow, CRMConversation, MetaCampaign, Order } from "./types"
import { computeOrderNetRevenue } from "./revenue"
import { attributeOrderToConversation } from "./attribution"

/**
 * Agregación por campaña con ingresos sin envío
 */
export function aggregateCampaigns(
  meta: MetaCampaign[],
  conversations: CRMConversation[],
  orders: Order[],
): CampaignRow[] {
  const convoById = new Map(conversations.map((c) => [c.id, c]))
  const campaignConvos = new Map<string, CRMConversation[]>()
  for (const c of conversations) {
    const arr = campaignConvos.get(c.campaignId) || []
    arr.push(c)
    campaignConvos.set(c.campaignId, arr)
  }

  const orderToCampaign = new Map<string, string>()
  for (const o of orders) {
    const { conversation } = attributeOrderToConversation(o, conversations)
    if (conversation) {
      orderToCampaign.set(o.id, conversation.campaignId)
    }
  }

  const revenueByCampaign = new Map<string, number>()
  for (const o of orders) {
    const campId = orderToCampaign.get(o.id)
    if (!campId) continue
    const net = computeOrderNetRevenue(o)
    revenueByCampaign.set(campId, (revenueByCampaign.get(campId) || 0) + net)
  }

  const rows: CampaignRow[] = meta.map((m) => {
    const convos = campaignConvos.get(m.id) || []
    const convCount = convos.length
    const ventas = convos.filter((c) => c.status === "Pedido Completo").length
    const revenue = revenueByCampaign.get(m.id) || 0

    return {
      id: m.id,
      name: m.name,
      status: m.status,
      deliveryLabel: m.deliveryLabel,
      accountType: m.accountType,
      negativesPct: m.negativesPct,
      lastUpdated: m.lastUpdated,
      meta: {
        dailyBudget: m.dailyBudget,
        spendTotal: m.spendTotal,
      },
      crm: {
        conversations: convCount,
        completedOrders: ventas,
      },
      sales: {
        revenue,
      },
    }
  })

  return rows
}
