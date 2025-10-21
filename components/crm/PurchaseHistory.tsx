'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Purchase } from '@/lib/types'
import { ChevronDown, ChevronUp, ShoppingBag, Package, Truck } from 'lucide-react'

interface PurchaseHistoryProps {
  clientId: string
  className?: string
}

export default function PurchaseHistory({ clientId, className = '' }: PurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true) // Expandido por defecto
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (clientId) loadPurchases()
  }, [clientId])

  async function loadPurchases() {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  // Formatear precio colombiano
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Calcular total de todas las compras
  const totalCompras = purchases.reduce((sum, p) => sum + p.total, 0)

  if (loading) {
    return (
      <div className={`rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,.06)] ${className}`}>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <ShoppingBag className="h-4 w-4" />
            <span>Cargando historial...</span>
          </div>
        </div>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className={`rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,.06)] ${className}`}>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <ShoppingBag className="h-4 w-4" />
            <span>Sin compras registradas</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,.06)] ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#D8BD80]" />
          <h3 className="font-semibold text-sm">Historial de Compras</h3>
          <span className="text-xs text-neutral-500">
            ({purchases.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#D8BD80]">
            {formatPrice(totalCompras)}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Lista de compras */}
      {isExpanded && (
        <div className="border-t border-neutral-100">
          <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-4 hover:bg-neutral-50/50 transition-colors">
                {/* Productos */}
                <div className="space-y-2 mb-3">
                  {purchase.productos.map((producto, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Package className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-neutral-900">
                            {producto.nombre}
                          </p>
                          {producto.cantidad > 1 && (
                            <p className="text-xs text-neutral-500">
                              Cantidad: {producto.cantidad}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap text-neutral-900">
                        {formatPrice(producto.precio * producto.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer de la compra */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>{formatDate(purchase.created_at)}</span>
                    {purchase.codigo_guia && (
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        <span>{purchase.codigo_guia}</span>
                      </div>
                    )}
                    {purchase.entregado && (
                      <span className="text-green-600 font-medium">✓ Entregado</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-neutral-900">
                    {formatPrice(purchase.total)}
                  </span>
                </div>

                {/* Método de pago */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-[#D8BD80]/10 text-[#D8BD80] capitalize font-medium">
                    {purchase.metodo_pago}
                  </span>
                  {purchase.ciudad && (
                    <span className="text-xs text-neutral-500">
                      📍 {purchase.ciudad}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
