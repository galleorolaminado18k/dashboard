import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { conversationId, razon } = body

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase URL or service role key not configured on server' }, { status: 500 })
  }

  const url = `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ status: 'devolucion', devolucion_razon: razon || 'Marcada por facturación' })
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Supabase REST error: ${res.status} ${text}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
