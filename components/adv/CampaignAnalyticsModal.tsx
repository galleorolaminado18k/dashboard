"use client"

import { X, TrendingUp, TrendingDown, DollarSign, Target, Users, Zap, Loader2, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

  useEffect(() => {
    // Analizar solo si el CPA es alto o hay problemas
    const shouldAnalyze = campaign.cpa && campaign.cpa > 50000 // CPA mayor a $50,000

    if (shouldAnalyze) {
      fetchAIAnalysis()
    }
  }, [campaign])

  const fetchAIAnalysis = async () => {
    setIsLoading(true)
    setError('')

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

      if (!response.ok) throw new Error('Error al obtener análisis')

      const data = await response.json()
      setAiAnalysis(data.analysis)
    } catch (err) {
      setError('No se pudo obtener el análisis de IA')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Datos simulados para el gráfico (en producción vendrían de tu API)
  const chartData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        label: 'Gasto',
        data: [campaign.spend * 0.2, campaign.spend * 0.3, campaign.spend * 0.25, campaign.spend * 0.25],
        borderColor: 'rgb(216, 189, 128)',
        backgroundColor: 'rgba(216, 189, 128, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Ingresos',
        data: [campaign.revenue * 0.15, campaign.revenue * 0.35, campaign.revenue * 0.3, campaign.revenue * 0.2],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
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
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  const metrics = [
    {
      label: 'Gasto Total',
      value: `$${campaign.spend.toLocaleString('es-CO')}`,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Conversiones',
      value: campaign.conv.toString(),
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'CPA',
      value: campaign.cpa ? `$${campaign.cpa.toLocaleString('es-CO')}` : '—',
      icon: campaign.cpa && campaign.cpa > 50000 ? TrendingDown : TrendingUp,
      color: campaign.cpa && campaign.cpa > 50000 ? 'text-rose-600' : 'text-emerald-600',
      bg: campaign.cpa && campaign.cpa > 50000 ? 'bg-rose-50' : 'bg-emerald-50',
    },
    {
      label: 'ROAS',
      value: `${campaign.roas.toFixed(2)}x`,
      icon: campaign.roas >= 1 ? TrendingUp : TrendingDown,
      color: campaign.roas >= 1 ? 'text-teal-600' : 'text-rose-600',
      bg: campaign.roas >= 1 ? 'bg-teal-50' : 'bg-rose-50',
    },
    {
      label: 'Ventas',
      value: campaign.sales.toString(),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'CVR',
      value: `${(campaign.cvr * 100).toFixed(2)}%`,
      icon: Zap,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#D8BD80] to-[#C5A968] rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900">{campaign.name}</h2>
                  <p className="text-sm text-neutral-500 mt-1">ID: {campaign.id} • {campaign.accountType}</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${metric.bg}`}>
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">{metric.label}</p>
                    <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D8BD80]" />
              Rendimiento de la Campaña
            </h3>
            <div className="p-6 rounded-xl border border-neutral-200 bg-white shadow-sm" style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* AI Analysis */}
          {(campaign.cpa && campaign.cpa > 50000) && (
            <div className="rounded-xl border-2 border-[#D8BD80]/20 bg-gradient-to-br from-amber-50/50 to-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-[#D8BD80] to-[#C5A968] rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Análisis Inteligente de IA - Experto en Marketing
                </h3>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#D8BD80] animate-spin" />
                  <span className="ml-3 text-neutral-600">Analizando campaña con IA...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  {error}
                </div>
              )}

              {aiAnalysis && !isLoading && (
                <div className="prose prose-sm max-w-none">
                  <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                </div>
              )}

              {!isLoading && !aiAnalysis && !error && (
                <div className="text-center py-4 text-neutral-500">
                  El CPA está alto. Analizando con IA...
                </div>
              )}
            </div>
          )}

          {campaign.cpa && campaign.cpa <= 50000 && (
            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">Campaña Optimizada</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Tu campaña está funcionando bien. El CPA está dentro de rangos aceptables.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

