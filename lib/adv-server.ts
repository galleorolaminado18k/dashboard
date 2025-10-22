/**
 * Server-side helper to fetch advertising data from external provider (Meta)
 * Uses server-only env variables: USE_REAL_ADS, META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
 * This file runs only on the server and falls back to throwing when not configured.
 */

type Campaign = {
  id: string
  name: string
  status: string
  daily_budget?: number
  spend_total?: number
}

const META_GRAPH_URL = "https://graph.facebook.com/v16.0"

async function fetchMetaCampaignsRaw(accountId: string, token: string) {
  const url = `${META_GRAPH_URL}/${accountId}/campaigns?fields=id,name,status,effective_status,daily_budget&limit=50&access_token=${encodeURIComponent(
    token,
  )}`
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Meta API error: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getRealCampaigns(): Promise<Campaign[]> {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")
  const token = process.env.META_ACCESS_TOKEN || process.env.NEXT_PUBLIC_META_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID || process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID
  if (!token || !accountId) throw new Error("Missing Meta credentials in env")

  const data = await fetchMetaCampaignsRaw(accountId, token)
  const rows = (data?.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.effective_status || c.status || "unknown",
    daily_budget: c.daily_budget ? Number(c.daily_budget) : undefined,
    spend_total: c.spend_total ? Number(c.spend_total) : undefined,
  }))
  return rows
}

export async function getRealSummary(): Promise<any> {
  // Minimal summary: try to fetch campaigns and derive spend/conv placeholders.
  const campaigns = await getRealCampaigns()
  const spend = campaigns.reduce((s, c) => s + (c.spend_total || 0), 0)
  return { spend, conv: 0, sales: 0, roas: 0, ctr: 0, deltaSpend: "+0%", revenue: 0, cpa: 0, convRate: 0, impr: 0 }
}

async function fetchMetaAdsetsRaw(campaignId: string, token: string) {
  const url = `${META_GRAPH_URL}/${campaignId}/adsets?fields=id,name,impressions,spend&limit=50&access_token=${encodeURIComponent(
    token,
  )}`
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Meta adsets API error: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getRealAdsets(campaignId: string) {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")
  const token = process.env.META_ACCESS_TOKEN || process.env.NEXT_PUBLIC_META_ACCESS_TOKEN
  if (!token) throw new Error("Missing Meta credentials in env")

  const data = await fetchMetaAdsetsRaw(campaignId, token)
  const rows = (data?.data || []).map((a: any) => ({ id: a.id, name: a.name, impressions: a.impressions || 0, spend: a.spend || 0, conversions: 0 }))
  return rows
}

async function fetchMetaInsightsRaw(campaignId: string, token: string) {
  // Use insights edge; fields can be expanded as needed
  const url = `${META_GRAPH_URL}/${campaignId}/insights?fields=spend,impressions,reach,ctr,conversion_rate,actions&access_token=${encodeURIComponent(
    token,
  )}`
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Meta insights API error: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getRealInsights(campaignId: string) {
  const useReal = process.env.USE_REAL_ADS === "true" || process.env.NEXT_PUBLIC_USE_REAL_ADS === "true"
  if (!useReal) throw new Error("USE_REAL_ADS disabled")
  const token = process.env.META_ACCESS_TOKEN || process.env.NEXT_PUBLIC_META_ACCESS_TOKEN
  if (!token) throw new Error("Missing Meta credentials in env")

  const data = await fetchMetaInsightsRaw(campaignId, token)
  const first = (data?.data || [])[0] || null
  if (!first) return null
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

export default { getRealCampaigns, getRealSummary }
