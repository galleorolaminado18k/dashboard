import 'server-only'
import { headers } from 'next/headers'

function getBaseUrl() {
  // 1) En Vercel preview/prod:
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercel) return `https://${vercel}`

  // 2) Si definiste tu dominio público fijo:
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL

  // 3) Dev local:
  const h = headers()
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
