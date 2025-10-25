"use client"

import { X, TrendingUp, TrendingDown, DollarSign, Target, Users, Zap, Loader2, BarChart3, Sparkles, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Campaign {
  id: string
  name: string
  accountType: string
  status: "active" | "paused"
  delivery: "Activa" | "Pausada"
  budget?: number
  spend: number
  conv: number
  cpa?: number
  sales: number
  revenue: number
  roas: number
  cvr: number
}

interface CampaignAnalyticsModalProps {
  campaign: Campaign
  onClose: () => void
}

export function CampaignAnalyticsModal({ campaign, onClose }: CampaignAnalyticsModalProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Determinar si el CPA es alto (lógica mejorada)
  const isHighCPA = () => {
    if (!campaign.cpa) return false

    // Si no hay conversiones, es problemático
    if (campaign.conv === 0) return true

    // CPA alto si es mayor a $50,000 o si el CVR es menor a 0.8%
    return campaign.cpa > 50000 || campaign.cvr < 0.008
  }

  useEffect(() => {
    if (isHighCPA()) {
      fetchAIAnalysis()
    }
  }, [campaign])

  const fetchAIAnalysis = async () => {
    setIsLoading(true)
    setError('')

    console.log('🚀 Iniciando análisis de IA para:', campaign.name)
    console.log('📊 Datos enviados:', {
      name: campaign.name,
      spend: campaign.spend,
      conversions: campaign.conv,
      cpa: campaign.cpa,
      sales: campaign.sales,
      revenue: campaign.revenue,
      roas: campaign.roas,
      cvr: campaign.cvr,
      budget: campaign.budget
    })

    try {
      const response = await fetch('/api/ai/analyze-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign: {
            name: campaign.name,
            spend: campaign.spend,
            conversions: campaign.conv,
            cpa: campaign.cpa,
            sales: campaign.sales,
            revenue: campaign.revenue,
            roas: campaign.roas,
            cvr: campaign.cvr,
            budget: campaign.budget
          }
        }),
      })

      console.log('📡 Respuesta recibida, status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Error en respuesta:', errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Datos parseados:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.analysis) {
        console.log('📝 Análisis recibido, longitud:', data.analysis.length)
        setAiAnalysis(data.analysis)
      } else {
        throw new Error('No se recibió análisis en la respuesta')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo obtener el análisis de IA'
      console.error('💥 Error completo:', err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Datos del gráfico con tema luxury
  const chartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        label: 'Gasto',
        data: [campaign.spend * 0.2, campaign.spend * 0.3, campaign.spend * 0.25, campaign.spend * 0.25],
        borderColor: '#C1A36A',
        backgroundColor: 'rgba(193, 163, 106, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Ingresos',
        data: [campaign.revenue * 0.15, campaign.revenue * 0.35, campaign.revenue * 0.3, campaign.revenue * 0.2],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E5E5',
          font: {
            size: 13,
            family: "'Inter', sans-serif",
            weight: '500' as const,
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: '#C1A36A',
        borderWidth: 1,
        displayColors: true,
        boxPadding: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#A3A3A3',
          font: {
            size: 11,
          },
          padding: 8,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#A3A3A3',
          font: {
            size: 11,
          },
          padding: 8,
        },
      },
    },
  }

  const metrics = [
    {
      label: 'Gasto Total',
      value: `$${campaign.spend.toLocaleString('es-CO')}`,
      icon: DollarSign,
      color: 'text-[#C1A36A]',
      bg: 'bg-[#C1A36A]/10',
    },
    {
      label: 'Conversiones',
      value: campaign.conv.toString(),
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'CPA',
      value: campaign.cpa ? `$${campaign.cpa.toLocaleString('es-CO')}` : '—',
      icon: campaign.cpa && campaign.cpa > 50000 ? TrendingDown : TrendingUp,
      color: campaign.cpa && campaign.cpa > 50000 ? 'text-rose-400' : 'text-emerald-400',
      bg: campaign.cpa && campaign.cpa > 50000 ? 'bg-rose-400/10' : 'bg-emerald-400/10',
    },
    {
      label: 'ROAS',
      value: `${campaign.roas.toFixed(2)}x`,
      icon: campaign.roas >= 1 ? TrendingUp : TrendingDown,
      color: campaign.roas >= 1 ? 'text-teal-400' : 'text-rose-400',
      bg: campaign.roas >= 1 ? 'bg-teal-400/10' : 'bg-rose-400/10',
    },
    {
      label: 'Ventas',
      value: campaign.sales.toString(),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'CVR',
      value: `${(campaign.cvr * 100).toFixed(2)}%`,
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-[#C1A36A]/20">
        {/* Header Luxury */}
        <div className="px-8 py-6 border-b border-[#C1A36A]/20 bg-gradient-to-r from-neutral-800/50 to-neutral-900/50 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-[#C1A36A] to-[#8B7355] rounded-2xl shadow-lg shadow-[#C1A36A]/20">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{campaign.name}</h2>
                  <p className="text-sm text-neutral-400 mt-1.5 font-medium">
                    ID: {campaign.id} · <span className="text-[#C1A36A]">{campaign.accountType}</span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-110 group"
            >
              <X className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-900/50">
          {/* Status Alert at Top */}
          {!isHighCPA() ? (
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-900/20 to-neutral-800/50 px-5 py-3 mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400">Campaña Optimizada</h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Tu campaña está funcionando dentro de los parámetros esperados. El CPA está en un rango aceptable.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-neutral-800/50 px-5 py-3 mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-400">Alerta: CPA Alto Detectado</h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    La IA está analizando la campaña para proporcionarte recomendaciones específicas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KPIs Grid - Luxury Design - Más compacto */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className="group relative p-3 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-white/5 hover:border-[#C1A36A]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#C1A36A]/10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                      {metric.label}
                    </p>
                    <p className={`text-lg font-bold ${metric.color} tracking-tight`}>
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-1.5 rounded-lg ${metric.bg} group-hover:scale-110 transition-transform`}>
                    <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#C1A36A]/0 to-[#C1A36A]/0 group-hover:from-[#C1A36A]/5 group-hover:to-transparent rounded-xl transition-all pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Chart Section - Luxury */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-[#C1A36A] to-[#8B7355] rounded-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Rendimiento de la Campaña</h3>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-white/5 shadow-xl" style={{ height: '280px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* AI Analysis Section - Luxury & Professional */}
          {isHighCPA() && (
            <div className="rounded-2xl border-2 border-[#C1A36A]/30 bg-gradient-to-br from-amber-900/20 via-neutral-800/50 to-neutral-900/50 p-6 shadow-2xl shadow-[#C1A36A]/10 backdrop-blur">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C1A36A] to-[#8B7355] rounded-xl blur-lg opacity-50" />
                  <div className="relative p-2.5 bg-gradient-to-br from-[#C1A36A] to-[#8B7355] rounded-xl">
                    {/* Logo de Grok IA */}
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8"/>
                      <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                      <path d="M12 12V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      Análisis Inteligente con IA
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#C1A36A]/20 rounded-full border border-[#C1A36A]/30">
                      <svg className="w-3 h-3 text-[#C1A36A]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.8"/>
                        <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z"/>
                      </svg>
                      <span className="text-[10px] font-semibold text-[#C1A36A]">
                        Grok IA
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400">Experta en Marketing Digital · IQ 145 · Análisis Detallado</p>
                </div>
              </div>

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-[#C1A36A] animate-spin" />
                    <div className="absolute inset-0 bg-[#C1A36A] blur-xl opacity-30 animate-pulse" />
                  </div>
                  <span className="mt-3 text-neutral-300 font-medium text-sm">Analizando campaña con IA avanzada...</span>
                  <span className="text-xs text-neutral-500 mt-1">Esto puede tomar unos segundos</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-900/20 border border-rose-500/30 rounded-lg text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Error al obtener análisis</p>
                    <p className="text-xs text-rose-400">{error}</p>
                  </div>
                </div>
              )}

              {aiAnalysis && !isLoading && (
                <div className="bg-neutral-900/50 rounded-lg p-5 border border-white/5">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-neutral-200 leading-relaxed whitespace-pre-wrap font-light text-sm">
                      {aiAnalysis}
                    </div>
                  </div>
                </div>
              )}

              {!isLoading && !aiAnalysis && !error && (
                <div className="text-center py-5 text-neutral-400 flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando análisis...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

