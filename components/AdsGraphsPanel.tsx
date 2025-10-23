"use client"
import { useEffect, useMemo } from "react"
import { fmtMoney, fmtNum } from '@/lib/format'
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
ChartJS.register(ArcElement, Tooltip, Legend)

type GraphCampaign = {
  name: string
  spend: number
  conversations: number
  sales: number
  revenue: number
  negativesPct: number
}

export default function AdsGraphsPanel({
  rows,
  onOpenAI,
}: {
  rows: GraphCampaign[]
  onOpenAI: (autoKickoffPrompt: string) => void
}) {
  const agg = useMemo(() => {
    const spend = rows.reduce((a, b) => a + b.spend, 0)
    const conv = rows.reduce((a, b) => a + b.conversations, 0)
    const sales = rows.reduce((a, b) => a + b.sales, 0)
    const revenue = rows.reduce((a, b) => a + b.revenue, 0)
    const roas = spend > 0 ? revenue / spend : 0
    const cvr = conv > 0 ? sales / conv : 0
    const negAvg = rows.length ? rows.reduce((a, b) => a + b.negativesPct, 0) / rows.length : 0
    return { spend, conv, sales, revenue, roas, cvr, negAvg }
  }, [rows])

  const data = useMemo(
    () => ({
      labels: rows.map((r) => r.name),
      datasets: [{ data: rows.map((r) => r.spend), borderWidth: 0 }],
    }),
    [rows],
  )

  const negativeAlert = agg.negAvg > 25

  const kickoff = useMemo(() => {
    const lines = rows
      .slice(0, 5)
      .map(
        (r) =>
          `• ${r.name} — Gasto $${r.spend.toLocaleString()}, Conv ${r.conversations}, Ventas ${r.sales}, Ingresos $${r.revenue.toLocaleString()}, Negativo ${r.negativesPct.toFixed(
            1,
          )}%`,
      )
      .join("\n")

    return `Diagnóstico y plan experto (CI 145):
${lines}

Totales mes: Gasto $${agg.spend.toLocaleString()}, Ingresos $${agg.revenue.toLocaleString()}, ROAS ${agg.roas.toFixed(
      2,
    )}x, CVR ${(agg.cvr * 100).toFixed(2)}%, Negativo prom. ${agg.negAvg.toFixed(1)}%.

Reglas:
- Si Negativo > 25%: definir campaña nueva de rescate (segmentaciones, creatividades, copy, budget split, test A/B y calendario) y preguntar 3-5 datos críticos del negocio para personalizar.
- Si desempeño es positivo: 7 quick wins para subir ROAS y CVR (audiencias, creatividades, pujas, horarios, funnel). Responde en bullets accionables.`
  }, [rows, agg])

  useEffect(() => {
    if (negativeAlert) onOpenAI(kickoff)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negativeAlert])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="col-span-1 rounded-2xl border bg-white p-4">
        <div className="mb-3 text-base font-semibold">Distribución de gasto</div>
        <Pie data={data} />
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-600">
          <div>Gasto Total</div>
          <div className="text-right">{fmtMoney(agg.spend)}</div>
          <div>Ingresos (sin envío)</div>
          <div className="text-right">{fmtMoney(agg.revenue)}</div>
          <div>ROAS</div>
          <div className="text-right">{(agg.roas ?? 0).toFixed(2)}x</div>
          <div>CVR</div>
          <div className="text-right">{(((agg.cvr ?? 0) * 100).toFixed(2))}%</div>
          <div>Negativo Prom.</div>
          <div className="text-right">{(agg.negAvg ?? 0).toFixed(1)}%</div>
        </div>
      </div>

      <div className="col-span-2 rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold">Estrategia sugerida (IA)</div>
          <button className="rounded-full border px-3 py-1 text-xs hover:shadow-sm" onClick={() => onOpenAI(kickoff)}>
            Hablar con IA
          </button>
        </div>

        {negativeAlert && (
          <button
            onClick={() => onOpenAI(kickoff)}
            className="mb-3 w-full animate-pulse rounded-xl bg-red-600/90 p-2 text-center text-white"
          >
            URGENTE: HABLAR CON EL EXPERTO EN IA
          </button>
        )}

        <p className="text-sm text-neutral-700">
          La IA analizará tus campañas y propondrá acciones inmediatas para mejorar ROAS y CVR. Los ingresos reflejan
          únicamente el valor de los productos, <b>excluyendo envío</b>.
        </p>
      </div>
    </div>
  )
}
