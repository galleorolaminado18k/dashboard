/**
 * Marketing API (Meta) – server helpers
 * Requisitos:
 *  - USE_REAL_ADS=true (o NEXT_PUBLIC_USE_REAL_ADS=true)
 *  - META_SYSTEM_USER_TOKEN
 *  - META_DEFAULT_AD_ACCOUNT (act_XXXX) y/o META_AD_ACCOUNT_IDS
 *  - META_GRAPH_VERSION (p.ej. v24.0)
 */

type Campaign = {
  id: string
  name: string
  status: "active" | "paused"
  spend_total?: number
}

const GV = process.env.META_GRAPH_VERSION || "v24.0"
const GRAPH = `https://graph.facebook.com/${GV}`
const TOKEN = process.env.META_SYSTEM_USER_TOKEN || process.env.META_ACCESS_TOKEN || ""

/** Selecciona una ad account válida */
function getAct(): string {
  const def = process.env.META_DEFAULT_AD_ACCOUNT
  if (def && /^act_\d+$/.test(def)) return def
  const list = (process.env.META_AD_ACCOUNT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^act_\d+$/.test(s))
  if (list.length) return list[0]
  throw new Error("No META_DEFAULT_AD_ACCOUNT / META_AD_ACCOUNT_IDS configurado")
}

async function http(path: string, params: Record<string, any> = {}) {
  if (!TOKEN) throw new Error("Falta META_SYSTEM_USER_TOKEN")
  const usp = new URLSearchParams({ access_token: TOKEN })
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.append(k, String(v))
  }
  const url = `${GRAPH}/${path}?${usp.toString()}`
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Graph error ${res.status}: ${text}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    return text as any
  }
}

/** ---------------  PUBLIC API  --------------- **/

/** Campañas reales (activas/pausadas) + gasto (insights level=campaign) */
export async function getRealCampaigns(): Promise<Campaign[]> {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")
  const act = getAct()

  // 1) Listado de campañas
  const fields = [
    "id",
    "name",
    "effective_status",
    "status",
    "updated_time",
    "start_time",
    "stop_time",
  ].join(",")
  const campaignsRes = await http(`${act}/campaigns`, {
    fields,
    effective_status: "['ACTIVE','PAUSED']",
    limit: "200",
  })
  const rows: any[] = campaignsRes?.data || []

  // 2) Gasto por campaña (últimos 30 días)
  const insightsRes = await http(`${act}/insights`, {
    level: "campaign",
    fields: "campaign_id,spend,ctr,actions",
    date_preset: "last_30d",
    limit: "5000",
  })
  const byIdSpend = new Map<string, number>()
  for (const r of insightsRes?.data || []) {
    const s = Number(r.spend || 0)
    const id = r.campaign_id as string
    byIdSpend.set(id, (byIdSpend.get(id) || 0) + s)
  }

  // 3) Normaliza shape
  const campaigns: Campaign[] = rows.map((c) => {
    const status = c.effective_status === "ACTIVE" || c.status === "ACTIVE" ? "active" : "paused"
    return {
      id: String(c.id),
      name: String(c.name || ""),
      status,
      spend_total: byIdSpend.get(String(c.id)) || 0,
    }
  })

  return campaigns
}

/** Ad sets reales de una campaña con insights (gasto, impresiones, CTR) */
export async function getRealAdsets(campaignId: string) {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")

  // 1) Obtener listado de adsets
  const fields = [
    "id",
    "name",
    "effective_status",
    "status",
    "daily_budget",
    "lifetime_budget",
    "start_time",
    "end_time",
    "updated_time",
  ].join(",")
  const res = await http(`${campaignId}/adsets`, {
    fields,
    limit: "200",
  })

  const adsets = res?.data || []

  // 2) Obtener insights de los adsets (gasto, impresiones, CTR)
  const insightsRes = await http(`${campaignId}/insights`, {
    level: "adset",
    fields: "adset_id,adset_name,spend,impressions,ctr",
    date_preset: "last_30d",
    limit: "5000",
  })

  const insightsByAdsetId = new Map<string, any>()
  for (const insight of (insightsRes?.data || [])) {
    insightsByAdsetId.set(String(insight.adset_id), insight)
  }

  // 3) Combinar datos de adsets con sus insights
  const result = adsets.map((a: any) => {
    const insight = insightsByAdsetId.get(String(a.id)) || {}
    return {
      id: String(a.id),
      name: String(a.name || ""),
      status: a.effective_status === "ACTIVE" || a.status === "ACTIVE" ? "active" : "paused",
      daily_budget: Number(a.daily_budget || 0),
      lifetime_budget: Number(a.lifetime_budget || 0),
      spend: Number(insight.spend || 0),
      impressions: Number(insight.impressions || 0),
      ctr: Number(insight.ctr || 0),
    }
  })

  return result
}

/** Insights resumidos de una campaña (gasto, ctr, roas aprox si envías revenue) */
export async function getRealInsights(campaignId: string) {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")
  const res = await http(`${campaignId}/insights`, {
    fields: "spend,ctr,actions",
    date_preset: "last_30d",
    limit: "1",
  })
  const first = (res?.data || [])[0] || {}
  return {
    roas: 0,
    spend: Number(first.spend || 0),
    revenue: 0,
    cpa: 0,
    ctr: Number(first.ctr || 0),
    positivePct: 0,
    negativePct: 0,
  }
}

/** Anuncios reales de una campaña o adset con insights (gasto, impresiones, CTR, clicks) */
export async function getRealAds(entityId: string) {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")

  // 1) Obtener listado de anuncios
  const fields = [
    "id",
    "name",
    "effective_status",
    "status",
    "creative",
    "updated_time",
  ].join(",")
  const res = await http(`${entityId}/ads`, {
    fields,
    limit: "200",
  })

  const ads = res?.data || []

  // 2) Obtener insights de los anuncios (gasto, impresiones, CTR, clicks)
  const insightsRes = await http(`${entityId}/insights`, {
    level: "ad",
    fields: "ad_id,ad_name,spend,impressions,ctr,clicks",
    date_preset: "last_30d",
    limit: "5000",
  })

  const insightsByAdId = new Map<string, any>()
  for (const insight of (insightsRes?.data || [])) {
    insightsByAdId.set(String(insight.ad_id), insight)
  }

  // 3) Combinar datos de anuncios con sus insights
  const result = ads.map((a: any) => {
    const insight = insightsByAdId.get(String(a.id)) || {}
    return {
      id: String(a.id),
      name: String(a.name || ""),
      status: a.effective_status === "ACTIVE" || a.status === "ACTIVE" ? "active" : "paused",
      spend: Number(insight.spend || 0),
      impressions: Number(insight.impressions || 0),
      ctr: Number(insight.ctr || 0),
      clicks: Number(insight.clicks || 0),
    }
  })

  return result
}

/** Obtiene TODAS las cuentas publicitarias configuradas */
function getAllAdAccounts(): string[] {
  const def = process.env.META_DEFAULT_AD_ACCOUNT
  const list = (process.env.META_AD_ACCOUNT_IDS || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => /^act_\d+$/.test(s))

  const accounts: string[] = []
  if (def && /^act_\d+$/.test(def)) accounts.push(def)

  for (const acc of list) {
    if (!accounts.includes(acc)) accounts.push(acc)
  }

  if (accounts.length === 0) {
    throw new Error("No META_DEFAULT_AD_ACCOUNT / META_AD_ACCOUNT_IDS configurado")
  }

  return accounts
}

/** KPI de cabecera - Suma TODAS las cuentas publicitarias, SOLO campañas activas del mes actual (día 1 hasta hoy) */
export async function getRealSummary() {
  // Obtener TODAS las cuentas publicitarias configuradas
  const allAccounts = getAllAdAccounts()

  // Calcular el rango del mes actual: desde el día 1 hasta hoy
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Formatear fechas en formato YYYY-MM-DD para la API de Meta
  const since = firstDayOfMonth.toISOString().split('T')[0]
  const until = today.toISOString().split('T')[0]

  console.log(`[getRealSummary] Mes actual: ${since} hasta ${until}`)
  console.log(`[getRealSummary] Procesando ${allAccounts.length} cuenta(s) publicitaria(s)`)

  // Variables para acumular el total de TODAS las cuentas
  let totalSpend = 0
  let totalImpressions = 0
  let totalCtr = 0
  let totalCampaignCount = 0

  // Iterar sobre cada cuenta publicitaria
  for (const accountId of allAccounts) {
    console.log(`\n[getRealSummary] Procesando cuenta: ${accountId}`)

    try {
      // Obtener insights a nivel de campaña con el rango del mes actual
      const res = await http(`${accountId}/insights`, {
        level: "campaign",
        fields: "campaign_id,campaign_name,spend,impressions,ctr,actions",
        time_range: JSON.stringify({ since, until }),
        limit: "5000", // Suficiente para obtener todas las campañas
      })

      const campaignInsights = res?.data || []
      let accountSpend = 0
      let accountCampaignCount = 0

      // Sumar campañas de esta cuenta
      for (const insight of campaignInsights) {
        const spend = Number(insight.spend || 0)
        const impressions = Number(insight.impressions || 0)
        const ctr = Number(insight.ctr || 0)

        accountSpend += spend
        totalSpend += spend
        totalImpressions += impressions
        totalCtr += ctr
        totalCampaignCount++
        accountCampaignCount++

        console.log(`    ✓ ${insight.campaign_name || insight.campaign_id}: $${spend.toFixed(2)}`)
      }

      console.log(`  [${accountId}] ${accountCampaignCount} campañas = $${accountSpend.toFixed(2)}`)

    } catch (error) {
      console.error(`  ✗ Error procesando cuenta ${accountId}:`, error)
      // Continuar con la siguiente cuenta aunque falle una
    }
  }

  // CTR promedio de todas las campañas de todas las cuentas
  const avgCtr = totalCampaignCount > 0 ? totalCtr / totalCampaignCount : 0

  console.log(`\n[getRealSummary] ════════════════════════════════════════`)
  console.log(`[getRealSummary] TOTAL: ${totalCampaignCount} campañas activas`)
  console.log(`[getRealSummary] GASTO TOTAL DEL MES: $${totalSpend.toFixed(2)}`)
  console.log(`[getRealSummary] ════════════════════════════════════════\n`)

  return {
    totalSpend,
    totalCtr: avgCtr,
    totalImpressions,
    campaignCount: totalCampaignCount,
  }
}

export default { getRealCampaigns, getRealAdsets, getRealInsights, getRealSummary, getRealAds }
