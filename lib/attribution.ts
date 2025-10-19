// lib/attribution.ts
import type { CRMConversation, Order } from "./types"

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "")
}

/**
 * Atribución inteligente orden→conversación→campaña
 * Prioridades:
 * 1) order.conversationId directo
 * 2) order.utmCampaignId directo
 * 3) Match por teléfono + ventana temporal (14 días) + "último toque"
 */
export function attributeOrderToConversation(
  order: Order,
  conversations: CRMConversation[],
  windowDays = 14,
): { conversation?: CRMConversation; reason: string } {
  // 1) Link directo por conversationId
  if (order.conversationId) {
    const c = conversations.find((x) => x.id === order.conversationId)
    if (c) return { conversation: c, reason: "by-conversationId" }
  }

  // 2) Fallback por utmCampaignId
  if (order.utmCampaignId) {
    const cs = conversations.filter((x) => x.campaignId === order.utmCampaignId)
    if (cs.length) {
      const target = new Date(order.createdAt).getTime()
      const prior = cs
        .filter((x) => new Date(x.startedAt).getTime() <= target)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
      if (prior) return { conversation: prior, reason: "by-utmCampaignId" }
      const closest = cs.sort(
        (a, b) =>
          Math.abs(new Date(a.startedAt).getTime() - target) - Math.abs(new Date(b.startedAt).getTime() - target),
      )[0]
      if (closest) return { conversation: closest, reason: "by-utmCampaignId-closest" }
    }
  }

  // 3) Match por teléfono + ventana temporal + "último toque"
  const phone = normalizePhone(order.customerPhone)
  const target = new Date(order.createdAt).getTime()
  const windowMs = windowDays * 24 * 60 * 60 * 1000

  const candidates = conversations
    .filter((c) => normalizePhone(c.customerPhone) === phone)
    .filter((c) => Math.abs(new Date(c.startedAt).getTime() - target) <= windowMs)

  if (candidates.length) {
    const prior = candidates
      .filter((x) => new Date(x.startedAt).getTime() <= target)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
    if (prior) return { conversation: prior, reason: "by-phone-last-touch" }

    const closest = candidates.sort(
      (a, b) => Math.abs(new Date(a.startedAt).getTime() - target) - Math.abs(new Date(b.startedAt).getTime() - target),
    )[0]
    if (closest) return { conversation: closest, reason: "by-phone-closest" }
  }

  return { conversation: undefined, reason: "unattributed" }
}
