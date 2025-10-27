/**
 * Combina datos de Meta Ads API con datos del CRM y Ventas de Supabase
 * para mostrar métricas reales completas en el dashboard de publicidad
 */

import { createClient } from '@/lib/supabase/client'
import { getRealAdsets } from './adv-server'

/**
 * Obtiene conversaciones del CRM para una campaña específica
 * Busca por campaign_id en la tabla conversations
 */
async function getConversationsByCampaign(campaignId: string) {
  const supabase = createClient()

  // Obtener conversaciones que tengan el campaign_id
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[getConversationsByCampaign] Error:', error)
    return []
  }

  return conversations || []
}

/**
 * Obtiene conversaciones con pedido completo (ventas) para una campaña
 */
async function getSalesByCampaign(campaignId: string) {
  const supabase = createClient()

  // Obtener conversaciones con estado 'pedido-completo'
  const { data: completedOrders, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pedido-completo')

  if (convError) {
    console.error('[getSalesByCampaign] Error obteniendo conversaciones:', convError)
    return { count: 0, revenue: 0 }
  }

  // Obtener ventas asociadas a esta campaña
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('total_amount, revenue_no_shipping')
    .eq('campaign_id', campaignId)
    .eq('is_return', false) // Excluir devoluciones

  if (salesError) {
    console.error('[getSalesByCampaign] Error obteniendo ventas:', salesError)
    return { count: completedOrders?.length || 0, revenue: 0 }
  }

  // Calcular ingresos totales (sin incluir envío)
  const totalRevenue = sales?.reduce((sum, sale) => {
    return sum + Number(sale.revenue_no_shipping || sale.total_amount || 0)
  }, 0) || 0

  return {
    count: completedOrders?.length || 0,
    revenue: totalRevenue
  }
}

/**
 * Combina datos de Meta Ads con datos del CRM y Ventas
 * para obtener métricas completas de cada adset
 */
export async function getAdsetsWithCRMData(campaignId: string) {
  try {
    // 1. Obtener adsets de Meta API
    const adsets = await getRealAdsets(campaignId)

    // 2. Para cada adset, obtener datos del CRM y Ventas
    const adsetsWithCRM = await Promise.all(
      adsets.map(async (adset) => {
        // Obtener conversaciones del CRM
        const conversations = await getConversationsByCampaign(adset.id)
        const conversationsCount = conversations.length

        // Obtener ventas (conversaciones con pedido completo)
        const { count: salesCount, revenue } = await getSalesByCampaign(adset.id)

        // Calcular métricas
        const spend = Number(adset.spend || 0)
        const cpa = conversationsCount > 0 ? spend / conversationsCount : 0
        const roas = spend > 0 ? revenue / spend : 0
        const cvr = conversationsCount > 0 ? (salesCount / conversationsCount) * 100 : 0

        return {
          ...adset,
          // Datos del CRM y Ventas
          conversions: conversationsCount,  // Total de conversaciones
          sales: salesCount,                 // Conversaciones con pedido completo
          revenue: revenue,                  // Ingresos totales sin envío
          // Métricas calculadas
          cpa: cpa,                          // Costo por conversación
          roas: roas,                        // Retorno de inversión
          cvr: cvr                           // Tasa de conversión (ventas / conversaciones)
        }
      })
    )

    return adsetsWithCRM
  } catch (error) {
    console.error('[getAdsetsWithCRMData] Error:', error)
    return []
  }
}

/**
 * Combina datos de anuncios de Meta API con datos del CRM y Ventas
 */
export async function getAdsWithCRMData(entityId: string) {
  try {
    const { getRealAds } = await import('./adv-server')

    // 1. Obtener anuncios de Meta API
    const ads = await getRealAds(entityId)

    // 2. Para cada anuncio, obtener datos del CRM y Ventas
    const adsWithCRM = await Promise.all(
      ads.map(async (ad) => {
        // Obtener conversaciones del CRM para este anuncio
        const conversations = await getConversationsByCampaign(ad.id)
        const conversationsCount = conversations.length

        // Obtener ventas
        const { count: salesCount, revenue } = await getSalesByCampaign(ad.id)

        // Calcular métricas
        const spend = Number(ad.spend || 0)
        const cpa = conversationsCount > 0 ? spend / conversationsCount : 0
        const roas = spend > 0 ? revenue / spend : 0
        const cvr = conversationsCount > 0 ? (salesCount / conversationsCount) * 100 : 0

        return {
          ...ad,
          conversions: conversationsCount,
          sales: salesCount,
          revenue: revenue,
          cpa: cpa,
          roas: roas,
          cvr: cvr
        }
      })
    )

    return adsWithCRM
  } catch (error) {
    console.error('[getAdsWithCRMData] Error:', error)
    return []
  }
}

