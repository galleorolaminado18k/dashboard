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
 * StatsBar - Componente que muestra estadísticas agregadas en formato tabla
 * Muestra una única fila con totales: Entrega, Presupuesto, Gastado, Conversiones, Ventas, Ingresos, ROAS, CVR
 */
export default function StatsBar({ title, items, showChartButton = true, onChartClick }: Props) {
  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 mb-6 overflow-hidden">
      {/* Header con título */}
      {title && (
        <div className="px-6 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        </div>
      )}

      {/* Tabla de estadísticas - formato similar a tabla de anuncios */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50/50 border-b border-neutral-200">
            <tr>
              {items.map((item, idx) => (
                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-neutral-50/50">
              {items.map((item, idx) => (
                <td key={idx} className="px-4 py-4 border-b border-neutral-100">
                  <div className="text-sm font-semibold text-neutral-900">
                    {item.value}
                  </div>
                  {item.sub && (
                    <div className="text-xs text-neutral-500 mt-1">
                      {item.sub}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

