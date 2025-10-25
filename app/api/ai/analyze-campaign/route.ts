import { NextRequest, NextResponse } from 'next/server'

const GROK_API_KEY = 'xai-7d9ef5c7-deca-4fcb-b06c-353f98ff9f0a'
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { campaign } = await request.json()

    const prompt = `Eres una experta en marketing digital, trafficker y community manager con un IQ de 145. Analiza la siguiente campaña publicitaria de Meta Ads y proporciona recomendaciones específicas y accionables para mejorar el rendimiento:

📊 DATOS DE LA CAMPAÑA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nombre: ${campaign.name}
• Gasto Total: $${campaign.spend.toLocaleString('es-CO')} COP
• Presupuesto: ${campaign.budget ? `$${campaign.budget.toLocaleString('es-CO')} COP` : 'No definido'}
• Conversiones: ${campaign.conversions}
• CPA (Costo por Conversión): ${campaign.cpa ? `$${campaign.cpa.toLocaleString('es-CO')} COP` : 'N/A'}
• Ventas: ${campaign.sales}
• Ingresos: $${campaign.revenue.toLocaleString('es-CO')} COP
• ROAS: ${campaign.roas.toFixed(2)}x
• CVR (Tasa de Conversión): ${(campaign.cvr * 100).toFixed(2)}%

${campaign.cpa && campaign.cpa > 50000 ? '⚠️ ALERTA CRÍTICA: El CPA está significativamente alto. Se requiere optimización urgente.' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Como experta con 15 años de experiencia en Meta Ads, proporciona un análisis DETALLADO y estructurado. IMPORTANTE: Cada sección debe tener MÍNIMO 2 párrafos de 6 oraciones cada uno. Sé específica, usa ejemplos concretos y explica el razonamiento detrás de cada recomendación.

## 1. 🎯 DIAGNÓSTICO PRINCIPAL
Proporciona un análisis profundo del problema más crítico. Explica cómo identificaste el problema, qué métricas lo evidencian, y cuál es su impacto real en el negocio. Mínimo 2 párrafos de 6 oraciones cada uno.

## 2. 🔍 CAUSAS PROBABLES
Identifica y EXPLICA EN DETALLE 3-4 causas raíz del bajo rendimiento. Para cada causa, describe por qué está afectando la campaña, cómo se manifiesta en las métricas, y qué evidencias lo sustentan. Desarrolla cada causa con profundidad, usando mínimo 6 oraciones por causa.

## 3. ⚡ ACCIONES INMEDIATAS (Implementar HOY)
Lista 5 acciones específicas y priorizadas. Para CADA acción, proporciona:
- Descripción detallada de qué hacer exactamente
- Por qué es importante implementarla HOY
- Cómo ejecutarla paso a paso
- Qué impacto esperado tendrá
- Cómo medir si está funcionando
Mínimo 6 oraciones por acción.

## 4. 📈 OPTIMIZACIONES DE MEDIANO PLAZO (2-4 semanas)
Describe estrategias sostenibles con gran nivel de detalle. Explica la teoría detrás de cada estrategia, cómo implementarla gradualmente, qué recursos se necesitan, y cómo hacer seguimiento del progreso. Mínimo 2 párrafos de 6 oraciones cada uno por estrategia.

## 5. 📊 MÉTRICAS A VIGILAR DIARIAMENTE
Para cada KPI que menciones, explica:
- Por qué es crítico monitorearlo
- Qué valores son aceptables vs alarmantes
- Cómo interpretar sus cambios
- Qué acciones tomar según su comportamiento
Desarrolla con mínimo 2 párrafos de 6 oraciones.

## 6. 💡 RECOMENDACIÓN CLAVE
Proporciona un consejo final extenso y profundo basado en tu experiencia. Explica casos de éxito similares, errores comunes a evitar, y cómo esta recomendación puede transformar los resultados. Mínimo 2 párrafos de 6 oraciones cada uno.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECORDATORIO CRÍTICO: 
- Cada sección DEBE tener contenido EXTENSO y DETALLADO
- MÍNIMO 2 párrafos de 6 oraciones en cada punto principal
- Usa ejemplos específicos y casos prácticos
- Explica el PORQUÉ detrás de cada recomendación
- Sé conversacional pero profesional
- Usa emojis para mejorar la legibilidad
- Máximo 4000 tokens (usa todo el espacio disponible para dar valor)`

    console.log('Llamando a Grok API...')

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
            content: 'Eres una experta en marketing digital con 15 años de experiencia, especializada en Meta Ads, Google Ads y optimización de campañas publicitarias. Tienes un IQ de 145, eres analítica, directa y tus recomendaciones siempre generan resultados medibles. Hablas con autoridad pero de forma accesible.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        stream: false
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Grok API Error Response:', errorData)
      throw new Error(`Grok API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    console.log('Grok API Response:', JSON.stringify(data, null, 2))

    const analysis = data.choices?.[0]?.message?.content || 'No se pudo generar el análisis. Intenta nuevamente.'

    return NextResponse.json({
      analysis,
      success: true
    })
  } catch (error) {
    console.error('Error in AI analysis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    return NextResponse.json(
      {
        error: 'Error al analizar la campaña con IA',
        details: errorMessage,
        success: false
      },
      { status: 500 }
    )
  }
}

