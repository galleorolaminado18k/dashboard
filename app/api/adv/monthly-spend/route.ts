export const runtime = 'nodejs'
import { NextResponse } from 'next/server'

const GV = process.env.META_GRAPH_VERSION ?? 'v24.0'
const TOKEN = process.env.META_SYSTEM_USER_TOKEN!
const DEF_ACT = process.env.META_DEFAULT_AD_ACCOUNT!

function actList(): string[] {
  const raw = (process.env.META_AD_ACCOUNT_IDS ?? '').trim()
  if (!raw) return [DEF_ACT]
  const arr = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return arr.length ? arr : [DEF_ACT]
}

function monthRange() {
  const now = new Date()
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const since = first.toISOString().slice(0, 10)
  const until = today.toISOString().slice(0, 10)
  return { since, until }
}

async function http(path: string, params: Record<string, any>) {
  const usp = new URLSearchParams({ access_token: TOKEN })
  for (const [k, v] of Object.entries(params)) if (v != null) usp.append(k, String(v))
  const url = `https://graph.facebook.com/${GV}/${path}?${usp}`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  const txt = await res.text()
  if (!res.ok) throw new Error(`Graph ${res.status}: ${txt}`)
  return JSON.parse(txt)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const debug = url.searchParams.get('debug') === '1'

  try {
    const { since, until } = monthRange()
    let total = 0
    const rows: any[] = []

    for (const ACT of actList()) {
      const r = await http(`${ACT}/insights`, {
        level: 'account',
        fields: 'spend',
        time_range: JSON.stringify({ since, until }),
        time_increment: 1,
        limit: 500,
        use_account_attribution_setting: true,
      })

      const arr = Array.isArray(r?.data) ? r.data : []
      const sumAct = arr.reduce((acc: number, row: any) => acc + Number(row?.spend ?? 0), 0)
      total += sumAct
      rows.push({ account: ACT, days: arr.length, total: sumAct })
    }

    if (debug) {
      return NextResponse.json({ ok: true, data: { thisMonth: total, rows } })
    }
    return NextResponse.json({ ok: true, data: { thisMonth: total } })
  } catch (e: any) {
    console.error('MONTHLY_SPEND_ERROR', e?.message)
    return NextResponse.json({ ok: false, error: e?.message ?? 'unknown', data: { thisMonth: 0 } }, { status: 500 })
  }
}
