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

    // --- Optional automation: mark products as returned in purchases ---
    // If purchases table exists and there are purchases linked to this conversation,
    // fetch them and call the RPC mark_product_as_returned for each product name found.
    (async () => {
      try {
        const purchasesUrl = `${supabaseUrl}/rest/v1/purchases?conversation_id=eq.${conversationId}&select=id,productos`
        const pRes = await fetch(purchasesUrl, {
          method: 'GET',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`
          }
        })

        if (pRes.ok) {
          const purchases = await pRes.json()
          for (const purchase of purchases) {
            let productos = purchase.productos
            // producto may come as JSON string or already parsed
            if (typeof productos === 'string') {
              try { productos = JSON.parse(productos) } catch (e) { productos = [] }
            }

            if (Array.isArray(productos)) {
              for (const item of productos) {
                const nombre = item?.nombre || item?.name || item?.title
                if (!nombre) continue

                try {
                  // Call RPC function created in the DB. Parameter names match the function signature.
                  const rpcUrl = `${supabaseUrl}/rpc/mark_product_as_returned`
                  await fetch(rpcUrl, {
                    method: 'POST',
                    headers: {
                      apikey: serviceKey,
                      Authorization: `Bearer ${serviceKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ p_purchase_id: purchase.id, p_product_name: String(nombre) })
                  })
                } catch (err) {
                  // non-blocking: just log
                  // eslint-disable-next-line no-console
                  console.error('mark_product_as_returned failed for', purchase.id, nombre, String(err))
                }
              }
            }
          }
        }
      } catch (err) {
        // non-blocking
        // eslint-disable-next-line no-console
        console.error('Error fetching purchases for devolucion automation:', String(err))
      }
    })()

    // --- Optional automation: add Chatwoot label 'devolucion' to conversation/thread ---
    // This is performed only if the request includes `chatwootConversationId` and the server
    // environment provides CHATWOOT_API_TOKEN and CHATWOOT_ACCOUNT_ID.
    (async () => {
      try {
        const chatwootConversationId = body.chatwootConversationId || body.chatwoot_id || body.chatwootConversation
        const chatwootToken = process.env.CHATWOOT_API_TOKEN
        const chatwootAccount = process.env.CHATWOOT_ACCOUNT_ID
        const chatwootBase = process.env.CHATWOOT_BASE_URL || 'https://app.chatwoot.com'

        if (!chatwootConversationId || !chatwootToken || !chatwootAccount) return

        // 1) find or create label 'devolucion'
        const labelsUrl = `${chatwootBase}/api/v1/accounts/${chatwootAccount}/labels`
        const labelsRes = await fetch(labelsUrl, { headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken } })
        let labelId = null
        if (labelsRes.ok) {
          const labels = await labelsRes.json()
          const found = labels.find(l => (l.title || l.name) === 'devolucion')
          if (found) labelId = found.id
        }

        if (!labelId) {
          // create it (best-effort)
          try {
            const createRes = await fetch(labelsUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken },
              body: JSON.stringify({ title: 'devolucion', description: 'Estado: devolución', color: '#ef4444' })
            })
            if (createRes.ok) {
              const created = await createRes.json()
              labelId = created.id
            }
          } catch (e) {
            // ignore
            // eslint-disable-next-line no-console
            console.error('Failed creating Chatwoot label devolucion', String(e))
          }
        }

        if (labelId) {
          // add label to conversation (best-effort). Chatwoot API expects POST to /conversations/:id/labels
          const addLabelUrl = `${chatwootBase}/api/v1/accounts/${chatwootAccount}/conversations/${chatwootConversationId}/labels`
          try {
            await fetch(addLabelUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', api_access_token: chatwootToken },
              body: JSON.stringify({ label_ids: [labelId] })
            })
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed adding Chatwoot label to conversation', chatwootConversationId, String(e))
          }
        }
      } catch (err) {
        // non-blocking
        // eslint-disable-next-line no-console
        console.error('Chatwoot automation error:', String(err))
      }
    })()

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
