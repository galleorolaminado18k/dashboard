import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyDf9n-nERTfTC3G4WRf7msqQP1gjZkZST0"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

export async function POST(request: NextRequest) {
  try {
    const { month, year, kpis, salesData, expensesData } = await request.json()

    const MONTHS = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    const prompt = `Eres un analista financiero experto. Analiza los siguientes datos financieros de ${MONTHS[month]} ${year} y proporciona insights accionables en español:

**KPIs:**
- Ventas totales: $${kpis.totalSales?.toLocaleString()}
- Gastos totales: $${kpis.totalExpenses?.toLocaleString()}
- Utilidad neta: $${kpis.netProfit?.toLocaleString()}
- Margen: ${kpis.margin}%
- Tickets: ${kpis.tickets}
- Promedio por venta: $${kpis.avgSale?.toLocaleString()}

**Variaciones vs mes anterior:**
- Ventas: ${kpis.salesDelta}%
- Gastos: ${kpis.expensesDelta}%
- Utilidad: ${kpis.profitDelta}%
- Margen: ${kpis.marginDelta}%

**Distribución de ventas por método de pago:**
${kpis.paymentMethods?.map((m: any) => `- ${m.name}: ${m.value}%`).join("\n")}

**Distribución de gastos por categoría:**
${kpis.expenseCategories?.map((c: any) => `- ${c.name}: ${c.value}%`).join("\n")}

Proporciona un análisis estructurado en formato JSON con las siguientes claves:
{
  "summary": "Resumen breve de cómo fue el mes (2-3 oraciones)",
  "variations": "Análisis de las variaciones clave vs mes anterior (2-3 oraciones)",
  "alerts": "Alertas sobre costos o gastos preocupantes (2-3 oraciones)",
  "recommendations": "Recomendaciones accionables para mejorar (2-3 oraciones)",
  "projection": "Proyección para el próximo mes basada en tendencias (2-3 oraciones)",
  "sentiment": "good, neutral, o risk"
}

Sé conciso, específico y enfócate en insights accionables.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    let insights
    try {
      // Intentar extraer JSON de la respuesta (puede venir con markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        // Si no hay JSON, crear estructura por defecto
        insights = {
          summary: aiResponse.substring(0, 200),
          variations: "No se pudo analizar las variaciones.",
          alerts: "No se detectaron alertas.",
          recommendations: "Continúa monitoreando tus métricas.",
          projection: "Se espera un comportamiento similar al mes actual.",
          sentiment: "neutral",
        }
      }
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", parseError)
      insights = {
        summary: "El análisis está en proceso. Por favor, intenta nuevamente.",
        variations: "No disponible",
        alerts: "No disponible",
        recommendations: "No disponible",
        projection: "No disponible",
        sentiment: "neutral",
      }
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("[v0] Error fetching AI insights:", error)
    return NextResponse.json(
      {
        summary: "Error al obtener insights de IA. Por favor, intenta nuevamente.",
        variations: "No disponible",
        alerts: "No disponible",
        recommendations: "No disponible",
        projection: "No disponible",
        sentiment: "neutral",
      },
      { status: 500 },
    )
  }
}
