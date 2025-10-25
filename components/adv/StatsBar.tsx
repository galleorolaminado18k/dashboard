"use client"

import React from "react"
import { fmtMoney, fmtNum } from "@/lib/format"

type StatItem = {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
}

type Props = {
  title?: string
  items: StatItem[]
  showChartButton?: boolean
  onChartClick?: () => void
}

/**
 * StatsBar - Componente que replica la barra completa de estadísticas
 * Muestra: Entrega, Presupuesto, Conversiones, Ventas, ROAS, CVR + botón Gráfico
 * Todos los valores monetarios se formatean en Pesos Colombianos (COP)
 */
export default function StatsBar({ title, items, showChartButton = true, onChartClick }: Props) {
  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 mb-6 overflow-hidden">
      {/* Header con título y botón Gráfico */}
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
        <div className="flex items-center gap-3">
          {title && <h3 className="text-base font-semibold text-neutral-800">{title}</h3>}
        </div>
        <div className="flex gap-2 items-center">
          {showChartButton && (
            <button
              onClick={onChartClick}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
              aria-label="Ver gráfico"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Gráfico
            </button>
          )}
        </div>
      </div>

      {/* Grid de estadísticas */}
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="min-w-0">
              <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                {item.label}
              </div>
              <div className="text-lg font-bold text-neutral-900 mb-1 truncate">
                {item.value}
              </div>
              {item.sub && (
                <div className="text-xs text-neutral-600">
                  {item.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

