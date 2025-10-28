"use client"
import { useState } from "react"
import useSWR from "swr"
import { Package, Plus, Search, X, Save, TrendingUp, ArrowUpDown, Info } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Función para obtener abreviatura de categoría
function getCategoryAbbr(category: string): string {
  const abbrs: Record<string, string> = {
    'CADENAS': 'CAD',
    'ARETES': 'ARE',
    'DIJES': 'DIJ',
    'PULSERAS': 'PUL',
    'TOBILLERAS': 'TOB',
    'MANILLAS': 'MAN',
    'BALINES': 'BAL',
    'ANILLOS': 'ANI',
    'CANDONGAS': 'CAN',
    'HERRAJES': 'HER'
  }
  return abbrs[category] || category.substring(0, 3).toUpperCase()
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
    category: 'CADENAS',
    cost: 0,
    price_retail: 0,
    price_wholesale: 0,
    stock: 0,
    stock_warranty: 0,
    min_stock: 0,
    max_stock: 0,
    status: 'active',
    // Campos de medidas según categoría
    tamano: '', // Para CADENAS, PULSERAS, TOBILLERAS
    grosor: '', // Para CADENAS, PULSERAS, TOBILLERAS
    medida_mm: '' // Para ARETES, DIJES, MANILLAS, BALINES, ANILLOS, CANDONGAS, HERRAJES
  })

  const [movementForm, setMovementForm] = useState({
    movement_type: 'entrada',
    warehouse_type: 'cantidad',
    quantity: 1,
    notes: '',
    special_exit_type: '', // Para salidas especiales: bono, obsequios, canje, puntos, otros
    special_discount_qty: 1, // Para ajuste especial: cantidad del 1 al 15
    special_action: 'descontar' // Para ajuste especial: descontar o agregar
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

    // Validar campos de medidas según categoría
    if (['CADENAS', 'PULSERAS', 'TOBILLERAS'].includes(productForm.category)) {
      if (!productForm.tamano.trim()) {
        alert('⚠️ El campo Tamaño es obligatorio para ' + productForm.category)
        return
      }
      if (!productForm.grosor.trim()) {
        alert('⚠️ El campo Grosor es obligatorio para ' + productForm.category)
        return
      }
    }

    if (['ARETES', 'DIJES', 'MANILLAS', 'BALINES', 'ANILLOS', 'CANDONGAS', 'HERRAJES'].includes(productForm.category)) {
      if (!productForm.medida_mm.trim()) {
        alert('⚠️ El campo Medida (MM) es obligatorio para ' + productForm.category)
        return
      }
    }

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

    // Validaciones específicas
    if (movementForm.movement_type === 'ajuste' && !movementForm.notes.trim()) {
      alert('⚠️ La descripción es obligatoria para Ajuste por Conteo de Inventario')
      return
    }

    if (movementForm.movement_type === 'ajuste_especial') {
      if (!movementForm.notes.trim()) {
        alert('⚠️ La descripción es obligatoria para Ajuste Especial')
        return
      }
    }

    if (movementForm.movement_type === 'salida') {
      if (!movementForm.special_exit_type) {
        alert('⚠️ Debes seleccionar el tipo de Salida Especial')
        return
      }
      if (!movementForm.notes.trim()) {
        alert('⚠️ La descripción es obligatoria para Salidas Especiales')
        return
      }
    }

    setSaving(true)

    try {
      // Calcular la cantidad a enviar según el tipo de movimiento
      let quantityToSend = movementForm.quantity
      const currentStock = movementForm.warehouse_type === 'garantia'
        ? (selectedProduct.stock_warranty || 0)
        : (selectedProduct.stock || 0)

      // Para ajuste especial: calcular el nuevo stock absoluto
      if (movementForm.movement_type === 'ajuste_especial') {
        const changeQty = movementForm.special_discount_qty || 1
        if (movementForm.special_action === 'agregar') {
          quantityToSend = currentStock + changeQty
        } else {
          quantityToSend = Math.max(0, currentStock - changeQty)
        }
      }

      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: selectedProduct.id,
          movement_type: movementForm.movement_type,
          warehouse_type: movementForm.warehouse_type,
          quantity: quantityToSend,
          notes: movementForm.notes,
          special_exit_type: movementForm.special_exit_type,
          special_action: movementForm.special_action
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
  } {
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
      category: 'CADENAS',
      cost: 0,
      price_retail: 0,
      price_wholesale: 0,
      stock: 0,
      stock_warranty: 0,
      min_stock: 0,
      max_stock: 0,
      status: 'active',
      tamano: '',
      grosor: '',
      medida_mm: ''
    })
  }

  const resetMovementForm = () => {
    setMovementForm({
      movement_type: 'entrada',
      warehouse_type: 'cantidad',
      quantity: 1,
      notes: '',
      special_exit_type: '',
      special_discount_qty: 1,
      special_action: 'descontar'
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
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {/* SKU */}
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1">
                    SKU
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Código Único del Producto
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Nombre */}
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1">
                    Nombre
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Nombre del Producto
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Categoría */}
                <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1">
                    Cat.
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Categoría
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Cantidad */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Cant.
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Cantidad en Stock
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Garantías */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Gar.
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Garantías
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Costo */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Costo
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Costo del Producto
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Precio Detal */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    P. Detal
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Precio al Detal
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Utilidad Detal */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Util. Detal
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Utilidad al Detal
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Precio Mayor */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    P. Mayor
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Precio al por Mayor
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Utilidad Mayor */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Util. Mayor
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Utilidad al por Mayor
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Estado */}
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-center">
                    Estado
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Estado del Producto
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Costo Total */}
                <th className="px-2 py-2 text-right text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-end">
                    Costo Total
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Costo Total de Inventario
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute right-3 -top-1"></div>
                    </div>
                  </div>
                </th>

                {/* Acciones */}
                <th className="px-2 py-2 text-center text-[10px] font-semibold text-gray-700 uppercase group relative">
                  <div className="inline-flex items-center gap-1 justify-center">
                    Acc.
                    <Info className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white text-[9px] px-2 py-1 rounded shadow-lg">
                        Acciones
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -top-1"></div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
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
                      {/* SKU */}
                      <td className="px-2 py-2">
                        <div className="font-mono text-[11px] font-medium text-gray-900">{product.sku}</div>
                      </td>

                      {/* Nombre */}
                      <td className="px-2 py-2">
                        <div className="font-medium text-[11px] text-gray-900 max-w-[120px] truncate">{product.name}</div>
                        <div className="text-[9px] text-sky-600 mt-0.5 font-medium">{product.category || 'Sin categoría'}</div>
                        {product.description && (
                          <div className="text-[9px] text-gray-500 mt-0.5 max-w-[120px] truncate">{product.description}</div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-sky-100 text-sky-700">
                          {getCategoryAbbr(product.category || 'N/A')}
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="px-2 py-2 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`text-[11px] font-semibold ${
                            (product.stock || 0) >= 1 && (product.stock || 0) <= 5 ? 'text-red-600' :
                            (product.stock || 0) >= 6 && (product.stock || 0) <= 10 ? 'text-orange-600' :
                            (product.stock || 0) >= 11 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {product.stock || 0}
                          </span>
                          <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                (product.stock || 0) >= 1 && (product.stock || 0) <= 5 ? 'bg-red-500' :
                                (product.stock || 0) >= 6 && (product.stock || 0) <= 10 ? 'bg-orange-500' :
                                (product.stock || 0) >= 11 ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${product.max_stock > 0 ? Math.min(stockPercent, 100) : 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Garantía */}
                      <td className="px-2 py-2 text-right">
                        <span className="text-[11px] font-semibold text-violet-700">
                          {product.stock_warranty || 0}
                        </span>
                      </td>

                      {/* Costo */}
                      <td className="px-2 py-2 text-right text-[11px] text-gray-600">
                        {formatCurrency(product.cost || 0)}
                      </td>

                      {/* Precio Detal */}
                      <td className="px-2 py-2 text-right font-semibold text-[11px] text-gray-900">
                        {formatCurrency(product.price_retail || 0)}
                      </td>

                      {/* Utilidad Detal */}
                      <td className="px-2 py-2 text-right">
                        <div className="flex flex-col items-end gap-0">
                          <span className="text-[10px] font-medium text-emerald-700">
                            {formatCurrency(profitRetail)}
                          </span>
                          <span className="text-[9px] text-emerald-600">
                            {marginRetail.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Precio Mayor */}
                      <td className="px-2 py-2 text-right font-semibold text-[11px] text-gray-900">
                        {formatCurrency(product.price_wholesale || 0)}
                      </td>

                      {/* Utilidad Mayor */}
                      <td className="px-2 py-2 text-right">
                        <div className="flex flex-col items-end gap-0">
                          <span className="text-[10px] font-medium text-blue-700">
                            {formatCurrency(profitWholesale)}
                          </span>
                          <span className="text-[9px] text-blue-600">
                            {marginWholesale.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          product.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status === 'active' ? 'Act.' : 'Inac.'}
                        </span>
                      </td>

                      {/* Costo Total */}
                      <td className="px-2 py-2 text-right font-bold text-[11px] text-emerald-700">
                        {formatCurrency(totalValue)}
                      </td>

                      {/* Acciones */}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => openMovementModal(product)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          Mov.
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value, tamano: '', grosor: '', medida_mm: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="CADENAS">CADENAS</option>
                      <option value="ARETES">ARETES</option>
                      <option value="DIJES">DIJES</option>
                      <option value="PULSERAS">PULSERAS</option>
                      <option value="TOBILLERAS">TOBILLERAS</option>
                      <option value="MANILLAS">MANILLAS</option>
                      <option value="BALINES">BALINES</option>
                      <option value="ANILLOS">ANILLOS</option>
                      <option value="CANDONGAS">CANDONGAS</option>
                      <option value="HERRAJES">HERRAJES</option>
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

                {/* Campos de medidas según categoría */}
                {['CADENAS', 'PULSERAS', 'TOBILLERAS'].includes(productForm.category) && (
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Tamaño *</label>
                      <input
                        type="text"
                        required
                        value={productForm.tamano}
                        onChange={(e) => setProductForm({...productForm, tamano: e.target.value})}
                        placeholder="Ej: 45cm, 18 pulgadas"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Grosor *</label>
                      <input
                        type="text"
                        required
                        value={productForm.grosor}
                        onChange={(e) => setProductForm({...productForm, grosor: e.target.value})}
                        placeholder="Ej: 2mm, 3mm"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {['ARETES', 'DIJES', 'MANILLAS', 'BALINES', 'ANILLOS', 'CANDONGAS', 'HERRAJES'].includes(productForm.category) && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <label className="block text-sm font-medium text-purple-900 mb-1">Medida (MM) *</label>
                    <input
                      type="text"
                      required
                      value={productForm.medida_mm}
                      onChange={(e) => setProductForm({...productForm, medida_mm: e.target.value})}
                      placeholder="Ej: 5mm, 8mm, 10x15mm"
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
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
                    onChange={(e) => setMovementForm({...movementForm, movement_type: e.target.value, special_exit_type: '', special_discount_qty: 1, special_action: 'descontar'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="entrada">Entrada (agregar a cantidad)</option>
                    <option value="salida">Salidas Especiales (descontar de cantidad)</option>
                    <option value="ajuste">Ajuste por Conteo de Inventario</option>
                    <option value="ajuste_especial">Ajuste Especial (rápido)</option>
                    <option value="transferencia">Transferencia por Garantía (cantidad → garantía)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {movementForm.movement_type === 'transferencia' ? 'Mover a Garantía' : 'Almacén'}
                  </label>
                  <select
                    value={movementForm.warehouse_type}
                    onChange={(e) => setMovementForm({...movementForm, warehouse_type: e.target.value})}
                    disabled={movementForm.movement_type === 'transferencia'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  >
                    <option value="cantidad">Cantidad</option>
                    <option value="garantia">Garantías</option>
                  </select>
                </div>
              </div>

              {/* Campo de Tipo de Salida Especial */}
              {movementForm.movement_type === 'salida' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Salida Especial *</label>
                  <select
                    value={movementForm.special_exit_type}
                    onChange={(e) => setMovementForm({...movementForm, special_exit_type: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">-- Seleccionar tipo --</option>
                    <option value="bono">Bono</option>
                    <option value="obsequios">Obsequios</option>
                    <option value="canje">Canje</option>
                    <option value="puntos_acumulados">Puntos Acumulados</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              )}

              {/* Campos para Ajuste Especial: Acción + Cantidad */}
              {movementForm.movement_type === 'ajuste_especial' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Selector 1: Acción (Descontar o Agregar) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción *</label>
                    <select
                      value={movementForm.special_action || 'descontar'}
                      onChange={(e) => setMovementForm({...movementForm, special_action: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="descontar">Descontar</option>
                      <option value="agregar">Agregar</option>
                    </select>
                  </div>

                  {/* Selector 2: Cantidad (1-15) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                    <select
                      value={movementForm.special_discount_qty || 1}
                      onChange={(e) => setMovementForm({...movementForm, special_discount_qty: Number(e.target.value)})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {Array.from({length: 15}, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Preview del resultado */}
              {movementForm.movement_type === 'ajuste_especial' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">
                      {movementForm.special_action === 'descontar' ? '➖ Se descontará' : '➕ Se agregará'}
                    </span>
                    {' '}{movementForm.special_discount_qty || 1} unidad(es) del stock actual
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Stock {movementForm.warehouse_type === 'garantia' ? 'Garantía' : 'Cantidad'}: {
                      movementForm.warehouse_type === 'garantia'
                        ? (selectedProduct?.stock_warranty || 0)
                        : (selectedProduct?.stock || 0)
                    } → {
                      (() => {
                        const current = movementForm.warehouse_type === 'garantia'
                          ? (selectedProduct?.stock_warranty || 0)
                          : (selectedProduct?.stock || 0)
                        const change = movementForm.special_discount_qty || 1
                        return movementForm.special_action === 'descontar'
                          ? Math.max(0, current - change)
                          : current + change
                      })()
                    }
                  </p>
                </div>
              )}

              {/* Campo de Cantidad - ocultar si es ajuste especial */}
              {movementForm.movement_type !== 'ajuste_especial' && (
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
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas {(movementForm.movement_type === 'ajuste' || movementForm.movement_type === 'ajuste_especial' || movementForm.movement_type === 'salida') && '*'}
                </label>
                <textarea
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm({...movementForm, notes: e.target.value})}
                  placeholder={
                    movementForm.movement_type === 'ajuste'
                      ? 'Descripción del conteo de inventario (obligatorio)...'
                      : movementForm.movement_type === 'ajuste_especial'
                      ? 'Descripción del ajuste especial (obligatorio)...'
                      : movementForm.movement_type === 'salida'
                      ? 'Descripción de la salida especial (obligatorio)...'
                      : 'Detalles del movimiento...'
                  }
                  required={movementForm.movement_type === 'ajuste' || movementForm.movement_type === 'ajuste_especial' || movementForm.movement_type === 'salida'}
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

            {/* Acciones de Producto */}
            <div className="border-t border-gray-200 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Acciones del Producto</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProduct) return
                    if (!confirm(`¿Desactivar el producto "${selectedProduct.name}"?\n\nEl producto no se eliminará, solo se marcará como inactivo.`)) return

                    try {
                      const response = await fetch('/api/inventory/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: selectedProduct.id,
                          status: 'inactive'
                        })
                      })

                      const result = await response.json()
                      if (result.ok) {
                        alert('✅ Producto desactivado exitosamente')
                        setShowMovementModal(false)
                        mutate('/api/inventory')
                      } else {
                        alert('❌ Error al desactivar: ' + result.error)
                      }
                    } catch (error) {
                      alert('❌ Error al desactivar el producto')
                    }
                  }}
                  className="px-3 py-2 bg-orange-50 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Desactivar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedProduct) return
                    if (!confirm(`⚠️ ELIMINAR PERMANENTEMENTE "${selectedProduct.name}"?\n\n¡Esta acción NO se puede deshacer!\n\n¿Estás seguro?`)) return
                    if (!confirm(`CONFIRMAR ELIMINACIÓN:\nEscribe "ELIMINAR" para confirmar (última oportunidad)`)) return

                    try {
                      const response = await fetch('/api/inventory/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedProduct.id })
                      })

                      const result = await response.json()
                      if (result.ok) {
                        alert('✅ Producto eliminado exitosamente')
                        setShowMovementModal(false)
                        mutate('/api/inventory')
                      } else {
                        alert('❌ Error al eliminar: ' + result.error)
                      }
                    } catch (error) {
                      alert('❌ Error al eliminar el producto')
                    }
                  }}
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
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

