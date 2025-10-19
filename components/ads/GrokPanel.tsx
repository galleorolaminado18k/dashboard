"use client"

import * as React from "react"

type InsightInput = {
  campaignName: string
  negativePct: number
  positivePct: number
  roas: number
  spend: number
  cpa: number
  ctr: number
}

function craftPrompt(i: InsightInput) {
  return `Actúa como un experto en Marketing Digital, Traffiker y Community Manager (CI 145).
Analiza y entrega un plan accionable. Datos:
- Campaña: ${i.campaignName}
- ROAS: ${i.roas.toFixed(2)}
- % Negativo: ${i.negativePct}%
- % Positivo: ${i.positivePct}%
- Inversión: $${i.spend.toLocaleString()}
- CPA: $${i.cpa.toFixed(2)}
- CTR: ${(i.ctr * 100).toFixed(2)}%

Reglas:
1) Si % Negativo > 25% → plan correctivo estratégico (hooks, piezas, segmentación, pujas, calendario, budget split, test A/B).
2) Si % Positivo > 50% → checklist para aumentar ROAS (lookalikes, creatividades top, ofertas, automatizaciones, escalado).
3) Español. Ultra específico, bullets + microplan 7 días.
Incluye inspiración de Facebook Ads Library (oro laminado).`
}

async function getAiAdvice(i: InsightInput): Promise<string> {
  const res = await fetch(`/api/ads/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: craftPrompt(i) }),
  })
  const j = await res.json()
  return j.text || ""
}

export function GrokPanel({ input }: { input: InsightInput }) {
  const [text, setText] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)

  async function run() {
    setLoading(true)
    try {
      setText(await getAiAdvice(input))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-600">IA estratégica (Grok · x.ai)</div>
        <button onClick={run} className="rounded-full bg-black text-white px-4 py-2 text-sm hover:opacity-90">
          Generar plan
        </button>
      </div>
      {loading ? (
        <div className="text-neutral-500 text-sm">Analizando datos…</div>
      ) : text ? (
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text }} />
      ) : (
        <div className="text-neutral-500 text-sm">
          Presiona <b>Generar plan</b> para ver recomendaciones basadas en tus métricas.
        </div>
      )}
      <div className="mt-4 text-[11px] text-neutral-500">
        Inspírate en{" "}
        <a
          className="underline"
          target="_blank"
          href="https://web.facebook.com/ads/library/?active_status=active&ad_type=all&country=CO&is_targeted_country=false&media_type=all&q=oro%20laminado&search_type=keyword_unordered"
          rel="noreferrer"
        >
          Facebook Ads Library (oro laminado)
        </a>
        .
      </div>
    </div>
  )
}
