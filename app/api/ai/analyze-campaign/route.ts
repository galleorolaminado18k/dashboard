import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = '7d9ef5c7-deca-4fcb-b06c-353f98ff9f0a'
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { campaign } = await request.json()

    const prompt = `Eres una experta en marketing digital, trafficker y community manager con un IQ de 145. Analiza la siguiente campaña publicitaria y proporciona recomendaciones específicas y accionables para mejorar el rendimiento:

📊 DATOS DE LA CAMPAÑA:
- Nombre: ${campaign.name}
- Gasto Total: $${campaign.spend.toLocaleString('es-CO')}
- Presupuesto: ${campaign.budget ? `$${campaign.budget.toLocaleString('es-CO')}` : 'No definido'}
- Conversiones: ${campaign.conversions}
- CPA (Costo por Conversión): $${campaign.cpa ? campaign.cpa.toLocaleString('es-CO') : 'N/A'}
- Ventas: ${campaign.sales}
- Ingresos: $${campaign.revenue.toLocaleString('es-CO')}
- ROAS: ${campaign.roas.toFixed(2)}x
- CVR (Tasa de Conversión): ${(campaign.cvr * 100).toFixed(2)}%

🎯 ANÁLISIS REQUERIDO:
${campaign.cpa && campaign.cpa > 50000 ? '⚠️ ALERTA: El CPA está muy alto. Necesitamos optimizar urgentemente.' : ''}

Proporciona un análisis detallado que incluya:

1. **Diagnóstico Principal**: ¿Cuál es el problema más crítico?
2. **Causas Probables**: ¿Por qué está pasando esto?
3. **Acciones Inmediatas**: 3-5 acciones específicas que se deben implementar HOY
4. **Optimizaciones de Mediano Plazo**: Estrategias para las próximas 2-4 semanas
5. **Métricas a Vigilar**: ¿Qué KPIs debemos monitorear diariamente?

Sé específico, práctico y directo. Usa emojis para hacer el análisis más visual. Máximo 4000 tokens.`

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'Eres una experta en marketing digital con 15 años de experiencia, especializada en Meta Ads, Google Ads y optimización de campañas. Tienes un IQ de 145 y eres conocida por tu capacidad analítica y recomendaciones precisas que generan resultados medibles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Grok API Error:', errorData)
      throw new Error(`Grok API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content || 'No se pudo generar el análisis'

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'Error al analizar la campaña' },
      { status: 500 }
    )
  }
}

