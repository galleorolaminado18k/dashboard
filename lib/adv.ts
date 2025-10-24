import { headers } from 'next/headers'

export async function fetchMonthlySpend(): Promise<number> {
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const base = `${proto}://${host}`

  try {
    const r = await fetch(`${base}/api/adv/monthly-spend`, { cache: 'no-store', next: { revalidate: 0 } })
    if (!r.ok) return 0
    const j = await r.json().catch(() => ({ data: { thisMonth: 0 } }))
    return Number(j?.data?.thisMonth ?? 0)
  } catch (e) {
    console.error('fetchMonthlySpend error', e)
    return 0
  }
}
