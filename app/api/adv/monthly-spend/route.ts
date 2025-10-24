import { NextResponse } from 'next/server'

const GV = process.env.META_GRAPH_VERSION ?? 'v24.0'
const TOKEN = process.env.META_SYSTEM_USER_TOKEN!
const ACT = process.env.META_DEFAULT_AD_ACCOUNT!

async function http(path: string, params: Record<string, any> = {}) {
  const usp = new URLSearchParams({ access_token: TOKEN })
  for (const [k, v] of Object.entries(params)) if (v != null) usp.append(k, String(v))
  const url = `https://graph.facebook.com/${GV}/${path}?${usp}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Graph ${res.status}: ${text}`)
  return JSON.parse(text)
}

export async function GET() {
  try {
    const r = await http(`${ACT}/insights`, {
      level: 'account',
      fields: 'spend',
      date_preset: 'this_month',
      limit: 1,
    })

    const spend = Number((r?.data?.[0]?.spend) ?? 0)

    let prev = 0
    try {
      const rp = await http(`${ACT}/insights`, {
        level: 'account',
        fields: 'spend',
        date_preset: 'last_month',
        limit: 1,
      })
      prev = Number((rp?.data?.[0]?.spend) ?? 0)
    } catch {
      /* ignore */
    }

    return NextResponse.json({ ok: true, data: { thisMonth: spend, lastMonth: prev } })
  } catch (e: any) {
    console.error('MONTHLY_SPEND_ERROR', e?.message)
    return NextResponse.json({ ok: false, data: { thisMonth: 0, lastMonth: 0 } })
  }
}
