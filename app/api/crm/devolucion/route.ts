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

    // If caller passes wait:false we keep previous non-blocking behavior
    const wait = body.wait === false ? false : true

    // Prepare summary containers
    const summary: any = { ok: true, purchases: [], rpc: [], chatwoot: null, errors: [] }

    // Fetch purchases associated with conversation
    try {
      const purchasesUrl = `${supabaseUrl}/rest/v1/purchases?conversation_id=eq.${conversationId}&select=id,productos`
      const pRes = await fetch(purchasesUrl, { method: 'GET', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } })
      if (pRes.ok) {
        const purchases = await pRes.json()
        summary.purchases = purchases

        // For each purchase and product call RPC (either awaited or fired-and-forgotten)
        for (const purchase of purchases) {
          let productos = purchase.productos
          if (typeof productos === 'string') {
            try { productos = JSON.parse(productos) } catch (e) { productos = [] }
          }
          if (!Array.isArray(productos)) productos = []

          for (const item of productos) {
            const nombre = item?.nombre || item?.name || item?.title
            if (!nombre) continue

            const rpcCall = async () => {
              const rpcUrl = `${supabaseUrl}/rpc/mark_product_as_returned`
              const r = await fetch(rpcUrl, {
                method: 'POST',
                headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_purchase_id: purchase.id, p_product_name: String(nombre) })
              })
              return r
            }

            if (wait) {
              try {
                const r = await rpcCall()
                summary.rpc.push({ purchase: purchase.id, product: nombre, ok: r.ok, status: r.status })
              } catch (err) {
                summary.errors.push(String(err))
                summary.rpc.push({ purchase: purchase.id, product: nombre, ok: false, error: String(err) })
              }
            } else {
              // fire-and-forget
              rpcCall().catch(e => console.error('RPC fire-and-forget error', e))
            }
          }
        }
      }
    } catch (err) {
      summary.errors.push(`fetch purchases error: ${String(err)}`)
    }

    // Chatwoot automation (optional)
    try {
      const chatwootConversationId = body.chatwootConversationId || body.chatwoot_id || body.chatwootConversation
      const chatwootToken = process.env.CHATWOOT_API_TOKEN
      const chatwootAccount = process.env.CHATWOOT_ACCOUNT_ID
      const chatwootBase = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com'

      if (chatwootConversationId && chatwootToken && chatwootAccount) {
        // Find or create label
        const labelsUrl = `${chatwootBase}/api/v1/accounts/${chatwootAccount}/labels`
        const labelsRes = await fetch(labelsUrl, { headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken } })
        let labelId = null
        if (labelsRes.ok) {
          const labels = await labelsRes.json()
          const found = labels.find((l: any) => (l.title || l.name) === 'devolucion')
          if (found) labelId = found.id
        }
        if (!labelId) {
          try {
            const createRes = await fetch(labelsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken }, body: JSON.stringify({ title: 'devolucion', description: 'Estado: devolución', color: '#ef4444' }) })
            if (createRes.ok) {
              const created = await createRes.json()
              labelId = created.id
            }
          } catch (e) {
            summary.errors.push(`chatwoot create label error: ${String(e)}`)
          }
        }

        if (labelId) {
          const addLabelUrl = `${chatwootBase}/api/v1/accounts/${chatwootAccount}/conversations/${chatwootConversationId}/labels`
          if (wait) {
            try {
              const addRes = await fetch(addLabelUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken }, body: JSON.stringify({ label_ids: [labelId] }) })
              summary.chatwoot = { ok: addRes.ok, status: addRes.status }
            } catch (e) {
              summary.errors.push(`chatwoot add label error: ${String(e)}`)
            }
          } else {
            fetch(addLabelUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken }, body: JSON.stringify({ label_ids: [labelId] }) }).catch(e => console.error('Chatwoot fire-and-forget error', e))
          }
        }
      }
    } catch (err) {
      summary.errors.push(`chatwoot error: ${String(err)}`)
    }

    return NextResponse.json(summary)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
