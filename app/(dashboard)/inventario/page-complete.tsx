"use client"
import { useState } from "react"
import useSWR from "swr"
import { Package, Plus, Search, X, Save, TrendingUp, ArrowUpDown } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default function InventarioPage() {
  const [search, setSearch] = useState("")
  const [showProductModal, setShowProductModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'Joyería',
    cost: 0,
    price_retail: 0,
    price_wholesale: 0,
    stock: 0,
    stock_warranty: 0,
    min_stock: 0,
    max_stock: 0,
    status: 'active'
  })

  const [movementForm, setMovementForm] = useState({
    movement_type: 'entrada',
    warehouse_type: 'cantidad',
    quantity: 1,
    notes: ''
  })

  const { data, error, isLoading, mutate } = useSWR('/api/inventory', fetcher, {
    refreshInterval: 30000
  })

  const products = data?.products || []

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  // KPIs calculados
  const totalValue = products.reduce((sum: number, p: any) => sum + ((p.price_retail || 0) * (p.stock || 0)), 0)
  const totalUnits = products.reduce((sum: number, p: any) => sum + (p.stock || 0) + (p.stock_warranty || 0), 0)
  const avgCost = products.length > 0 ? products.reduce((sum: number, p: any) => sum + (p.cost || 0), 0) / products.length : 0
  const lowStock = products.filter((p: any) => (p.stock || 0) <= (p.min_stock || 0)).length

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/inventory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      })

      const result = await response.json()

      if (result.ok) {
        setShowProductModal(false)
        resetProductForm()
        mutate()
        alert('✅ Producto creado exitosamente')
      } else {
        alert('❌ Error: ' + result.error)
      }
    } catch (error: any) {
      alert('❌ Error al crear producto: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setSaving(true)

    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: selectedProduct.id,
          ...movementForm
        })
      })

      const result = await response.json()

      if (result.ok) {
        setShowMovementModal(false)
        setSelectedProduct(null)
        resetMovementForm()
        mutate()
        alert('✅ Movimiento registrado exitosamente')
      } else {
        alert('❌ Error: ' + result.error)
      }
    } catch (error: any) {
      alert('❌ Error al registrar movimiento: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const resetProductForm = () => {
    setProductForm({
      sku: '',
      name: '',
      description: '',
      category: 'Joyería',
      cost: 0,
      price_retail: 0,
      price_wholesale: 0,
      stock: 0,
      stock_warranty: 0,
      min_stock: 0,
      max_stock: 0,
      status: 'active'
    })
  }

  const resetMovementForm = () => {
    setMovementForm({
      movement_type: 'entrada',
      warehouse_type: 'cantidad',
      quantity: 1,
      notes: ''
    })
  }

  const openMovementModal = (product: any) => {
    setSelectedProduct(product)
    setShowMovementModal(true)
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Control de existencias desde Supabase</p>
        </div>
        <button
          onClick={() => setShowProductModal(true)}
          className="h-10 px-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg flex items-center gap-2 hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-400 p-5 rounded-xl shadow-sm">
          <div className="text-sm text-amber-700 font-medium mb-1">Valor en bodega</div>
          <div className="text-2xl font-bold text-amber-900">{formatCurrency(totalValue)}</div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 border-l-4 border-violet-400 p-5 rounded-xl shadow-sm">
          <div className="text-sm text-violet-700 font-medium mb-1">Unidades</div>
          <div className="text-2xl font-bold text-violet-900">{totalUnits}</div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border-l-4 border-rose-400 p-5 rounded-xl shadow-sm">
          <div className="text-sm text-rose-700 font-medium mb-1">Stock bajo</div>
          <div className="text-2xl font-bold text-rose-900">{lowStock}</div>
          <div className="text-xs text-rose-600">productos en alerta</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-emerald-400 p-5 rounded-xl shadow-sm">
          <div className="text-sm text-emerald-700 font-medium mb-1">Costo promedio</div>
          <div className="text-2xl font-bold text-emerald-900">{formatCurrency(avgCost)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredProducts.length} de {products.length} productos
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Detal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Mayor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Costo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Utilidad Detal</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Utilidad Mayor</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Garantías</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <div className="text-lg font-medium text-gray-700">No hay productos en el inventario</div>
                    <div className="text-sm text-gray-500 mt-1">Haz clic en "Nuevo producto" para agregar uno</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => {
                  const stockPercent = product.max_stock > 0
                    ? ((product.stock || 0) / product.max_stock) * 100
                    : 0
                  const isLowStock = (product.stock || 0) <= (product.min_stock || 0)
                  const totalValue = (product.price_retail || 0) * (product.stock || 0)
                  const profitRetail = (product.profit_retail || 0)
                  const profitWholesale = (product.profit_wholesale || 0)
                  const marginRetail = (product.margin_retail_pct || 0)
                  const marginWholesale = (product.margin_wholesale_pct || 0)

                  return (
                    <tr key={product.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm font-medium text-gray-900">{product.sku}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{product.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                          {product.category || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(product.price_retail || 0)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(product.price_wholesale || 0)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">
                        {formatCurrency(product.cost || 0)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-medium text-emerald-700">
                            {formatCurrency(profitRetail)}
                          </span>
                          <span className="text-xs text-emerald-600">
                            {marginRetail.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-medium text-blue-700">
                            {formatCurrency(profitWholesale)}
                          </span>
                          <span className="text-xs text-blue-600">
                            {marginWholesale.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-lg font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock || 0}
                          </span>
                          {product.max_stock > 0 && (
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isLowStock ? 'bg-rose-400' : stockPercent > 50 ? 'bg-emerald-400' : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(stockPercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-lg font-semibold text-violet-700">
                          {product.stock_warranty || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-700">
                        {formatCurrency(totalValue)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => openMovementModal(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          Movimiento
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Última actualización: {new Date().toLocaleString('es-CO')} •
        Datos sincronizados con Supabase
      </div>

      {/* Modal Nuevo Producto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Producto</h2>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Información Básica</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      type="text"
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value.toUpperCase()})}
                      placeholder="ORO-001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option>Joyería</option>
                      <option>Accesorios</option>
                      <option>Relojes</option>
                      <option>Otros</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="Anillo de Oro 18K"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Descripción detallada del producto..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Precios y Costos */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Precios y Utilidades
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={productForm.cost}
                      onChange={(e) => setProductForm({...productForm, cost: Number(e.target.value)})}
                      placeholder="800000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Detal *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={productForm.price_retail}
                      onChange={(e) => setProductForm({...productForm, price_retail: Number(e.target.value)})}
                      placeholder="1250000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {productForm.price_retail > 0 && productForm.cost > 0 && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Ganancia: {formatCurrency(productForm.price_retail - productForm.cost)}
                        ({(((productForm.price_retail - productForm.cost) / productForm.price_retail) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mayor *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={productForm.price_wholesale}
                      onChange={(e) => setProductForm({...productForm, price_wholesale: Number(e.target.value)})}
                      placeholder="1062500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {productForm.price_wholesale > 0 && productForm.cost > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Ganancia: {formatCurrency(productForm.price_wholesale - productForm.cost)}
                        ({(((productForm.price_wholesale - productForm.cost) / productForm.price_wholesale) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Inventario</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Inicial *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                      placeholder="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Garantías Iniciales</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock_warranty}
                      onChange={(e) => setProductForm({...productForm, stock_warranty: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.min_stock}
                      onChange={(e) => setProductForm({...productForm, min_stock: Number(e.target.value)})}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Máximo</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.max_stock}
                      onChange={(e) => setProductForm({...productForm, max_stock: Number(e.target.value)})}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg hover:from-amber-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Movimiento — {selectedProduct.sku}</h2>
                <p className="text-sm text-gray-600">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="p-2 hover:bg-white rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento *</label>
                  <select
                    value={movementForm.movement_type}
                    onChange={(e) => setMovementForm({...movementForm, movement_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="garantia">Garantía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {movementForm.movement_type === 'garantia' ? 'Mover a Garantía' : 'Almacén'}
                  </label>
                  <select
                    value={movementForm.warehouse_type}
                    onChange={(e) => setMovementForm({...movementForm, warehouse_type: e.target.value})}
                    disabled={movementForm.movement_type === 'garantia'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  >
                    <option value="cantidad">Cantidad</option>
                    <option value="garantia">Garantías</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({...movementForm, quantity: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({...movementForm, notes: e.target.value})}
                  placeholder="Detalles del movimiento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Info del Producto */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Actual (Cantidad):</span>
                  <span className="font-semibold">{selectedProduct.stock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Garantías:</span>
                  <span className="font-semibold text-violet-700">{selectedProduct.stock_warranty || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      Registrar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

