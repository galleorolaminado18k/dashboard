// lib/revenue.ts
import type { Order } from "./types"

/**
 * Calcula ingresos netos de una orden:
 *  - Suma ítems (precio * qty)
 *  - Resta retornos parciales (si existen)
 *  - Resta descuentos por ítem (si existen)
 *  - EXCLUYE SIEMPRE shippingCost
 */
export function computeOrderNetRevenue(order: Order): number {
  let itemsGross = 0
  for (const it of order.items) {
    const qtyNet = Math.max(0, it.qty - (it.returnedQty || 0))
    const priceNet = it.unitPrice - (it.discountPerUnit || 0)
    itemsGross += priceNet * qtyNet
  }
  if (itemsGross < 0) itemsGross = 0
  return itemsGross
}
