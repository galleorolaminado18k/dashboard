export const dynamic = 'force-dynamic'

import PublicidadClient from './_client/PublicidadFixed'
import { headers } from 'next/headers'

async function getMonthlySpendServer() {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const base = `${proto}://${host}`

    const res = await fetch(`${base}/api/adv/monthly-spend`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.error('monthly-spend error', res.status, await res.text().catch(() => ''))
      return { thisMonth: 0, lastMonth: 0 }
    }

    const json = await res.json().catch(() => ({ data: { thisMonth: 0, lastMonth: 0 } }))
    return { thisMonth: Number(json?.data?.thisMonth ?? 0), lastMonth: Number(json?.data?.lastMonth ?? 0) }
  } catch (e) {
    console.error('getMonthlySpendServer error', e)
    return { thisMonth: 0, lastMonth: 0 }
  }
}

export default async function Page() {
  const monthly = await getMonthlySpendServer()
  // Pasamos el objeto que espera el cliente (initialMonthly)
  return <PublicidadClient initialMonthly={monthly} />
}
