import 'server-only'
import { headers } from 'next/headers'

async function getBaseUrl() {
  // 1) Prefer explicit base URL (recommended for preview/prod)
  const explicit = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.startsWith('http') ? explicit : `https://${explicit}`

  // 2) Vercel provides VERCEL_URL (no protocol) or NEXT_PUBLIC_VERCEL_URL
  const vercel = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`

  // 3) Dev local:
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

export async function getMonthlySpend() {
  const base = getBaseUrl()
  const res = await fetch(`${base}/api/adv/monthly-spend`, {
    cache: 'no-store',
    // desactiva ISR para evitar parpadeos:
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`monthly-spend failed: ${res.status} ${text}`)
  }

  const json = await res.json().catch(() => ({ data: { thisMonth: 0, lastMonth: 0 } }))
  return {
    thisMonth: Number(json?.data?.thisMonth ?? 0),
    lastMonth: Number(json?.data?.lastMonth ?? 0),
  }
}
