"use client"
import { useState } from "react"
import useSWR from "swr"
import { Package, Plus, Search } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default function InventarioSupabasePage() {
  const [search, setSearch] = useState("")
  const { data, error, isLoading } = useSWR('/api/inventory', fetcher, {
    refreshInterval: 30000 // Refrescar cada 30 segundos
  })

  const products = data?.products || []

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  // KPIs calculados
  const totalValue = products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0)
  const totalUnits = products.reduce((sum: number, p: any) => sum + p.stock, 0)
  const avgCost = products.length > 0 ? products.reduce((sum: number, p: any) => sum + p.cost, 0) / products.length : 0
  const lowStock = products.filter((p: any) => p.stock <= (p.min_stock || 0)).length

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error al cargar el inventario: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Control de existencias desde Supabase</p>
        </div>
        <button className="h-10 px-4 bg-primary text-primary-foreground rounded-md flex items-center gap-2 hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="text-sm text-yellow-700 font-medium">Valor en bodega</div>
          <div className="text-2xl font-bold text-yellow-900">{formatCurrency(totalValue)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 p-4 rounded-lg">
          <div className="text-sm text-purple-700 font-medium">Unidades</div>
          <div className="text-2xl font-bold text-purple-900">{totalUnits}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="text-sm text-orange-700 font-medium">Stock bajo</div>
          <div className="text-2xl font-bold text-orange-900">{lowStock}</div>
          <div className="text-xs text-orange-600">productos en alerta</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="text-sm text-green-700 font-medium">Costo promedio</div>
          <div className="text-2xl font-bold text-green-900">{formatCurrency(avgCost)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Categoría</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Precio</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Costo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <div>No hay productos en el inventario</div>
                    <div className="text-sm">Ejecuta el script 037 en Supabase para crear productos de ejemplo</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => {
                  const stockPercent = product.max_stock > 0
                    ? (product.stock / product.max_stock) * 100
                    : 0
                  const isLowStock = product.stock <= (product.min_stock || 0)
                  const totalValue = product.price * product.stock

                  return (
                    <tr key={product.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{product.sku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-muted-foreground">{product.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                          {product.category || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {formatCurrency(product.cost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                            {product.stock}
                          </span>
                          {product.max_stock > 0 && (
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isLowStock ? 'bg-red-500' : stockPercent > 50 ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(stockPercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          product.status === 'active' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-gray-50 text-gray-700'
                        }`}>
                          {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">
                        {formatCurrency(totalValue)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-muted-foreground text-center">
        Última actualización: {new Date().toLocaleString('es-CO')} •
        Datos sincronizados con Supabase
      </div>
    </div>
  )
}

