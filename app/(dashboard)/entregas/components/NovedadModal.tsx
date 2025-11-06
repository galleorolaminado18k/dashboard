﻿"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Package, DollarSign, AlertTriangle, CheckCircle2, X, Loader2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import MiPaquetePortalModal from "./MiPaquetePortalModal"

interface NovedadModalProps {
  open: boolean
  onClose: () => void
  envio: {
    envioId: string
    factura?: string
    cliente: string
    ciudad: string
    direccion?: string
    telefono?: string
    guia: string
    transportadora: string
    mipaqueteStatus?: string
    productos?: Array<{
      sku?: string
      descripcion: string
      cantidad: number
      precio: number
      total: number
    }>
    subtotal?: number
    envioMonto?: number
    total?: number
  }
}

export default function NovedadModal({ open, onClose, envio }: NovedadModalProps) {
  const [accionTomada, setAccionTomada] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Estados para modal del portal de MiPaquete
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')

  // Estados para diálogos de acciones REALES de MiPaquete
  const [showIndemnizacionDialog, setShowIndemnizacionDialog] = useState(false)
  const [showVolverOfrecerDialog, setShowVolverOfrecerDialog] = useState(false)
  const [showCambioDireccionDialog, setShowCambioDireccionDialog] = useState(false)
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false)
  const [showOtroDialog, setShowOtroDialog] = useState(false)

  // Estados de formularios según MiPaquete
  const [indemnizacionDesc, setIndemnizacionDesc] = useState('')
  const [volverOfrecerDesc, setVolverOfrecerDesc] = useState('')
  const [volverOfrecerDireccion, setVolverOfrecerDireccion] = useState(envio.direccion || '')

  // Cambio de dirección (campos requeridos por MiPaquete)
  const [nuevaCiudad, setNuevaCiudad] = useState(envio.ciudad || '')
  const [nuevaDireccion, setNuevaDireccion] = useState(envio.direccion || '')
  const [nombreDestinatario, setNombreDestinatario] = useState(envio.cliente || '')
  const [telefonoDestinatario, setTelefonoDestinatario] = useState(envio.telefono || '')

  // Devolución (campos requeridos por MiPaquete)
  const [nombreRemitente, setNombreRemitente] = useState('Comercializadora Gale18k')
  const [telefonoRemitente, setTelefonoRemitente] = useState('3016845026')
  const [ciudadRemitente, setCiudadRemitente] = useState('VILLA DEL ROSARIO-NORTE DE SANTANDER')
  const [direccionRemitente, setDireccionRemitente] = useState('Av 1 #9-53 Lomitas del trapiche')
  const [devolucionDesc, setDevolucionDesc] = useState('')

  // Otro tipo de solución
  const [otroDesc, setOtroDesc] = useState('')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const enviarSolucionMiPaquete = async (solutionType: string, data: any = {}) => {
    setLoading(true)
    try {
      console.log('🚀 Enviando solución a MiPaquete:', { solutionType, data })

      const response = await fetch('/api/mipaquete/resolver-novedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_number: envio.guia,
          solution_type: solutionType,
          shipment_id: envio.envioId,
          ...data
        })
      })

      const result = await response.json()
      console.log('📥 Respuesta de API:', result)

      if (result.success) {
        // Abrir portal de MiPaquete en modal interno (iframe)
        if (result.data?.portal_url) {
          setPortalUrl(result.data.portal_url)
          setShowPortalModal(true)
        }

        setAccionTomada(`✅ ${getSolutionLabel(solutionType)} - Portal abierto`)

        // Cerrar todos los diálogos
        setShowIndemnizacionDialog(false)
        setShowVolverOfrecerDialog(false)
        setShowCambioDireccionDialog(false)
        setShowDevolucionDialog(false)
        setShowOtroDialog(false)

        // NO cerrar el modal principal - dejar que el usuario vea el portal
        // El modal principal se cierra cuando el usuario cierre el portal modal
      } else {
        alert(`❌ Error: ${result.error}\n\nDetalles: ${JSON.stringify(result.details || {})}`)
      }
    } catch (error: any) {
      console.error('âŒ Error:', error)
      alert(`Error al procesar la acción: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getSolutionLabel = (solutionType: string): string => {
    const labels: Record<string, string> = {
      'indemnizacion': 'Indemnización solicitada',
      'volver_a_ofrecer': 'Volver a ofrecer programado',
      'cambio_direccion': 'Dirección actualizada',
      'devolucion': 'Devolución solicitada',
      'otro': 'solución registrada'
    }
    return labels[solutionType] || solutionType
  }

  // 1. Indemnización
  const handleIndemnizacion = () => {
    setShowIndemnizacionDialog(true)
  }

  const confirmIndemnizacion = () => {
    enviarSolucionMiPaquete('indemnizacion', {
      description: indemnizacionDesc || 'Solicitud de indemnización por novedad en entrega'
    })
  }

  // 2. Volver a ofrecer - Ahora abre directamente el portal de MiPaquete
  const handleVolverOfrecer = () => {
    // Navegar directamente al portal de MiPaquete con la guía del envío
    const portalPath = `/portal-mipaquete/${encodeURIComponent(envio.guia)}`
    window.location.href = portalPath
  }

  const confirmVolverOfrecer = () => {
    enviarSolucionMiPaquete('volver_a_ofrecer', {
      description: volverOfrecerDesc || 'Volver a ofrecer el Envío',
      new_address: volverOfrecerDireccion || undefined
    })
  }

  // 3. Cambio de dirección
  const handleCambioDireccion = () => {
    setShowCambioDireccionDialog(true)
  }

  const confirmCambioDireccion = () => {
    // Validar campos requeridos
    if (!nuevaCiudad.trim()) {
      alert('âŒ La ciudad es obligatoria')
      return
    }
    if (!nuevaDireccion.trim()) {
      alert('❌ La dirección es obligatoria')
      return
    }
    if (!nombreDestinatario.trim()) {
      alert('âŒ El nombre del destinatario es obligatorio')
      return
    }
    if (!telefonoDestinatario.trim()) {
      alert('âŒ El teléfono del destinatario es obligatorio')
      return
    }

    enviarSolucionMiPaquete('cambio_direccion', {
      new_city: nuevaCiudad,
      new_address: nuevaDireccion,
      recipient_name: nombreDestinatario,
      recipient_phone: telefonoDestinatario,
      description: 'Cambio de dirección de entrega solicitado por novedad'
    })
  }

  // 4. Devolución
  const handleDevolucion = () => {
    setShowDevolucionDialog(true)
  }

  const confirmDevolucion = () => {
    // Validar campos requeridos
    if (!nombreRemitente.trim()) {
      alert('âŒ El nombre del remitente es obligatorio')
      return
    }
    if (!telefonoRemitente.trim()) {
      alert('âŒ El teléfono del remitente es obligatorio')
      return
    }
    if (!ciudadRemitente.trim()) {
      alert('âŒ La ciudad del remitente es obligatoria')
      return
    }
    if (!direccionRemitente.trim()) {
      alert('❌ La dirección del remitente es obligatoria')
      return
    }

    enviarSolucionMiPaquete('devolucion', {
      sender_name: nombreRemitente,
      sender_phone: telefonoRemitente,
      sender_city: ciudadRemitente,
      sender_address: direccionRemitente,
      description: devolucionDesc || 'Solicitud de Devolución del pedido'
    })
  }

  // 5. Otro tipo de solución
  const handleOtro = () => {
    setShowOtroDialog(true)
  }

  const confirmOtro = () => {
    if (!otroDesc.trim() || otroDesc.length < 6) {
      alert('âŒ Debes ingresar una descripción de al menos 6 caracteres')
      return
    }

    enviarSolucionMiPaquete('otro', {
      description: otroDesc
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-neutral-50 to-white border-2 border-[#D8BD80]/20 shadow-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                Novedad en Envío
              </DialogTitle>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="px-3 py-1 bg-[#D8BD80]/10 border border-[#D8BD80]/30 rounded-full text-[#D8BD80] font-semibold">
                  Factura: {envio.factura || 'N/A'}
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-600 font-medium">{envio.envioId}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2.5 hover:bg-gradient-to-br hover:from-[#D8BD80]/10 hover:to-[#D8BD80]/5 transition-all duration-300 border border-transparent hover:border-[#D8BD80]/20"
            >
              <X className="w-6 h-6 text-neutral-400 hover:text-neutral-600" />
            </button>
          </div>
        </DialogHeader>

        {/* Estado de la Novedad - Luxury Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-2 border-red-200/50 p-6 mb-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-orange-400/10 rounded-full blur-3xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">Estado Actual</h3>
              <p className="text-base text-red-700 font-medium leading-relaxed">{envio.mipaqueteStatus || 'Novedad en entrega'}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-full text-red-700 font-semibold border border-red-300/30">
                  Guía: {envio.guia}
                </span>
                <span className="px-2.5 py-1 bg-white/70 backdrop-blur-sm rounded-full text-red-700 font-semibold border border-red-300/30">
                  {envio.transportadora}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Cliente - Luxury Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-neutral-50/30 to-white border-2 border-[#D8BD80]/20 p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D8BD80]/5 to-transparent rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#D8BD80] to-[#C5AC6E] rounded-xl shadow-md">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Información del Cliente
              </span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-100/50">
                <div className="min-w-[90px] text-sm font-medium text-neutral-500">Nombre:</div>
                <div className="font-semibold text-neutral-900">{envio.cliente}</div>
              </div>

              {envio.telefono && (
                <div className="flex items-start gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-100/50">
                  <div className="min-w-[90px] text-sm font-medium text-neutral-500">Teléfono:</div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-neutral-900">{envio.telefono}</span>
                    <a
                      href={`https://wa.me/57${envio.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-100/50">
                <div className="min-w-[90px] text-sm font-medium text-neutral-500">Ciudad:</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D8BD80]" />
                  <span className="font-semibold text-neutral-900">{envio.ciudad}</span>
                </div>
              </div>

              {envio.direccion && (
                <div className="flex items-start gap-4 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-neutral-100/50">
                  <div className="min-w-[90px] text-sm font-medium text-neutral-500">Dirección:</div>
                  <div className="font-medium text-neutral-700">{envio.direccion}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Pedido - Luxury Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-amber-50/10 to-white border-2 border-[#D8BD80]/20 p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#D8BD80]/8 to-transparent rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#D8BD80] to-[#C5AC6E] rounded-xl shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                Detalles del Pedido
              </span>
            </h3>

            {envio.productos && envio.productos.length > 0 ? (
              <>
                <div className="space-y-3 mb-5">
                  {envio.productos.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-neutral-100/80 hover:border-[#D8BD80]/30 transition-all duration-300">
                      <div className="flex-1">
                        <div className="font-semibold text-base text-neutral-900 mb-1">{prod.descripcion}</div>
                        <div className="flex items-center gap-3 text-xs text-neutral-600">
                          {prod.sku && (
                            <span className="px-2 py-0.5 bg-[#D8BD80]/10 border border-[#D8BD80]/30 rounded-md font-bold text-[#D8BD80]">
                              SKU: {prod.sku}
                            </span>
                          )}
                          <span className="font-medium">
                            Cantidad: {prod.cantidad} × {formatCurrency(prod.precio)}
                          </span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-neutral-900 ml-4">
                        {formatCurrency(prod.total)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-neutral-200/60 pt-5 space-y-3">
                  {envio.subtotal && (
                    <div className="flex justify-between items-center text-base px-2">
                      <span className="font-medium text-neutral-600">Subtotal:</span>
                      <span className="font-bold text-neutral-800">{formatCurrency(envio.subtotal)}</span>
                    </div>
                  )}
                  {envio.envioMonto && (
                    <div className="flex justify-between items-center text-base px-2">
                      <span className="font-medium text-neutral-600">Costo de Envío:</span>
                      <span className="font-bold text-neutral-800">{formatCurrency(envio.envioMonto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-bold pt-3 px-3 py-4 rounded-xl bg-gradient-to-r from-[#D8BD80]/10 via-amber-50/50 to-[#D8BD80]/10 border-2 border-[#D8BD80]/30 mt-4">
                    <span className="text-neutral-800">Total:</span>
                    <span className="text-2xl bg-gradient-to-r from-[#D8BD80] to-[#C5AC6E] bg-clip-text text-transparent">
                      {formatCurrency(envio.total || 0)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500 italic">No hay detalles de productos disponibles</p>
            )}
          </div>
        </div>

        {/* Resolver Novedad - Luxury Premium Button */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition duration-500 animate-pulse"></div>
          <button
            onClick={handleVolverOfrecer}
            disabled={loading}
            className="relative w-full bg-gradient-to-r from-red-500 via-red-600 to-orange-600 hover:from-red-600 hover:via-red-700 hover:to-orange-700 rounded-xl px-8 py-5 flex items-center justify-center gap-4 transition-all duration-300 shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-7 h-7 text-white animate-spin" />
                <span className="text-xl font-bold text-white">Abriendo Portal...</span>
              </>
            ) : (
              <>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <AlertTriangle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xl font-bold text-white tracking-wide">
                  Resolver Novedad
                </span>
                <ExternalLink className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-700 text-center">
            💡 Al hacer clic se abrirá el portal de MiPaquete para gestionar esta novedad directamente con la guía <strong>{envio.guia}</strong>
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cerrar
          </Button>
          {envio.telefono && (
            <Button
              onClick={() => window.open(`https://wa.me/57${envio.telefono?.replace(/\D/g, '') || ''}`, '_blank')}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contactar por WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>

      {/* ========== DIÁLOGOS REALES DE MIPAQUETE ========== */}

      {/* Diálogo 1: Indemnización */}
      {showIndemnizacionDialog && (
        <Dialog open={showIndemnizacionDialog} onOpenChange={setShowIndemnizacionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Solicitar indemnización
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  💰 Esta solicitud se enviará directamente a MiPaquete para iniciar el proceso de indemnización.
                </p>
              </div>
              <div>
                <Label>descripción (opcional)</Label>
                <Textarea
                  value={indemnizacionDesc}
                  onChange={(e) => setIndemnizacionDesc(e.target.value)}
                  placeholder="Ej: Producto dañado, paquete perdido, etc."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-neutral-500">
                <p><strong>Guía:</strong> {envio.guia}</p>
                <p><strong>Transportadora:</strong> {envio.transportadora}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowIndemnizacionDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmIndemnizacion}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Solicitar indemnización
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo 2: Volver a ofrecer */}
      {showVolverOfrecerDialog && (
        <Dialog open={showVolverOfrecerDialog} onOpenChange={setShowVolverOfrecerDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Volver a Ofrecer el Envío
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  📦 El Envío será reprogramado para un nuevo intento de entrega.
                </p>
              </div>
              <div>
                <Label>descripción (opcional)</Label>
                <Textarea
                  value={volverOfrecerDesc}
                  onChange={(e) => setVolverOfrecerDesc(e.target.value)}
                  placeholder="Ej: Cliente disponible después de las 2pm"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Soporte de dirección (opcional)</Label>
                <Input
                  value={volverOfrecerDireccion}
                  onChange={(e) => setVolverOfrecerDireccion(e.target.value)}
                  placeholder="Indicaciones adicionales sobre la dirección"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowVolverOfrecerDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmVolverOfrecer}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Volver a Ofrecer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo 3: Cambio de Dirección (CAMPOS REQUERIDOS POR MIPAQUETE) */}
      {showCambioDireccionDialog && (
        <Dialog open={showCambioDireccionDialog} onOpenChange={setShowCambioDireccionDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Cambio de Dirección
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  📍 Actualiza la dirección de entrega. Todos los campos son obligatorios.
                </p>
              </div>

              <div>
                <Label>Nueva Ciudad *</Label>
                <Input
                  value={nuevaCiudad}
                  onChange={(e) => setNuevaCiudad(e.target.value)}
                  placeholder="Ej: TURBACO-BOLÍVAR"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Nueva Dirección *</Label>
                <Textarea
                  value={nuevaDireccion}
                  onChange={(e) => setNuevaDireccion(e.target.value)}
                  placeholder="Ej: Bonanza vista manzana 9 lote 20"
                  rows={2}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Nombre del Destinatario *</Label>
                <Input
                  value={nombreDestinatario}
                  onChange={(e) => setNombreDestinatario(e.target.value)}
                  placeholder="Ej: Greycy Salamanca"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>teléfono del Destinatario *</Label>
                <Input
                  value={telefonoDestinatario}
                  onChange={(e) => setTelefonoDestinatario(e.target.value)}
                  placeholder="Ej: 3135948790"
                  className="mt-2"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCambioDireccionDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmCambioDireccion}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Actualizar Dirección
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo 4: Devolución (CAMPOS REQUERIDOS POR MIPAQUETE) */}
      {showDevolucionDialog && (
        <Dialog open={showDevolucionDialog} onOpenChange={setShowDevolucionDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Solicitar Devolución
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ El pedido será devuelto a la dirección del remitente.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-neutral-700">Datos del Remitente:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Nombre:</strong> {nombreRemitente}</p>
                  <p><strong>teléfono:</strong> {telefonoRemitente}</p>
                  <p><strong>Ciudad:</strong> {ciudadRemitente}</p>
                  <p><strong>Dirección:</strong> {direccionRemitente}</p>
                </div>
              </div>

              <div>
                <Label>Nombre del Remitente *</Label>
                <Input
                  value={nombreRemitente}
                  onChange={(e) => setNombreRemitente(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>teléfono del Remitente *</Label>
                <Input
                  value={telefonoRemitente}
                  onChange={(e) => setTelefonoRemitente(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Ciudad del Remitente *</Label>
                <Input
                  value={ciudadRemitente}
                  onChange={(e) => setCiudadRemitente(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Dirección del Remitente *</Label>
                <Textarea
                  value={direccionRemitente}
                  onChange={(e) => setDireccionRemitente(e.target.value)}
                  rows={2}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>descripción (opcional)</Label>
                <Textarea
                  value={devolucionDesc}
                  onChange={(e) => setDevolucionDesc(e.target.value)}
                  placeholder="Motivo de la Devolución..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDevolucionDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDevolucion}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Solicitar Devolución
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo 5: Otro tipo de solución */}
      {showOtroDialog && (
        <Dialog open={showOtroDialog} onOpenChange={setShowOtroDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Otro Tipo de solución
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Describe la solución específica que necesitas para esta novedad.
                </p>
              </div>
              <div>
                <Label>Descripción de la solución * (mínimo 6 caracteres)</Label>
                <Textarea
                  value={otroDesc}
                  onChange={(e) => setOtroDesc(e.target.value)}
                  placeholder="Describe detalladamente la solución que necesitas..."
                  rows={5}
                  className="mt-2"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {otroDesc.length}/200 caracteres
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowOtroDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmOtro}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Enviar solución
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========== FIN DIÁLOGOS REALES ========== */}

      {/* ========== MODAL PORTAL MIPAQUETE ========== */}
      <MiPaquetePortalModal
        open={showPortalModal}
        onClose={() => {
          setShowPortalModal(false)
          // Cuando cierra el portal, cerrar también el modal principal y recargar
          setTimeout(() => {
            onClose()
            window.location.reload()
          }, 500)
        }}
        portalUrl={portalUrl}
        trackingNumber={envio.guia}
      />
    </Dialog>
  )
}


