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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-radial from-[#0B0B0C] via-[#0F0F10] to-[#111214] border-2 border-[#D4AF37]/30 shadow-[0_0_48px_rgba(212,175,55,0.2)]">
        <DialogHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Header Chip "Novedad en Envío" con círculo dorado */}
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-md opacity-40"></div>
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F5E6B3] flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
                    <AlertTriangle className="w-6 h-6 text-[#0B0B0C]" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-[28px] font-bold tracking-tight leading-tight text-[#F7F7F8]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Novedad en Envío
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/6 backdrop-blur-md border border-[#D4AF37]/30 text-xs font-medium text-[#D4AF37]">
                      Factura: {envio.factura || 'N/A'}
                    </span>
                    <span className="text-xs text-[#B8BDC7]">• {envio.envioId}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group rounded-full p-2.5 bg-white/6 backdrop-blur-md border border-[#2A2B2E] hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C]"
            >
              <X className="w-5 h-5 text-[#B8BDC7] group-hover:text-[#F7F7F8] transition-colors" />
            </button>
          </div>
        </DialogHeader>

        {/* Estado Actual - Card con borde oro y glow */}
        <div className="group relative mb-6">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37]/20 to-[#D4AF37]/30 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
          <div className="relative bg-white/6 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-6 hover:translate-y-[-1px] hover:shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all duration-300">
            <h3 className="text-base font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
              Estado Actual
            </h3>
            <p className="text-[#F7F7F8] text-sm leading-6 mb-3">{envio.mipaqueteStatus || 'Novedad en entrega'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/4 border border-[#FFFFFF14] text-xs text-[#B8BDC7]" title="Número de guía">
                Guía: {envio.guia}
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/4 border border-[#FFFFFF14] text-xs text-[#B8BDC7]" title="Transportadora">
                {envio.transportadora}
              </span>
            </div>
          </div>
        </div>

        {/* Información del Cliente - Glassmorphism Card */}
        <div className="group relative mb-6">
          <div className="relative bg-white/6 backdrop-blur-md border border-[#2A2B2E] rounded-2xl p-6 hover:translate-y-[-1px] hover:shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all duration-300">
            <h3 className="text-lg font-semibold text-[#F7F7F8] mb-5 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#D4AF37]" />
              Información del Cliente
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="min-w-[90px] text-xs font-medium text-[#B8BDC7]">Nombre:</div>
                <div className="text-sm font-semibold text-[#F7F7F8] leading-6">{envio.cliente}</div>
              </div>

              <div className="h-px bg-[#FFFFFF14]"></div>

              {envio.telefono && (
                <>
                  <div className="flex items-start gap-4">
                    <div className="min-w-[90px] text-xs font-medium text-[#B8BDC7]">Teléfono:</div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#F7F7F8]">{envio.telefono}</span>
                      <a
                        href={`https://wa.me/57${envio.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#12B886] hover:bg-[#0F9D72] text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="h-px bg-[#FFFFFF14]"></div>
                </>
              )}

              <div className="flex items-start gap-4">
                <div className="min-w-[90px] text-xs font-medium text-[#B8BDC7]">Ciudad:</div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-[#F7F7F8]">{envio.ciudad}</span>
                </div>
              </div>

              {envio.direccion && (
                <>
                  <div className="h-px bg-[#FFFFFF14]"></div>
                  <div className="flex items-start gap-4">
                    <div className="min-w-[90px] text-xs font-medium text-[#B8BDC7]">Dirección:</div>
                    <div className="text-sm text-[#F7F7F8] leading-6">{envio.direccion}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Pedido - Glassmorphism Card */}
        <div className="group relative mb-6">
          <div className="relative bg-white/6 backdrop-blur-md border border-[#2A2B2E] rounded-2xl p-6 hover:translate-y-[-1px] hover:shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all duration-300">
            <h3 className="text-lg font-semibold text-[#F7F7F8] mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              Detalles del Pedido
            </h3>

            {envio.productos && envio.productos.length > 0 ? (
              <>
                <div className="space-y-3 mb-5">
                  {envio.productos.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-[#FFFFFF14] hover:bg-white/6 hover:border-[#D4AF37]/20 transition-all duration-300">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#F7F7F8] mb-2 leading-6">{prod.descripcion}</div>
                        <div className="flex items-center gap-3 text-xs">
                          {prod.sku && (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 font-bold text-[#D4AF37]" title="SKU del producto">
                              SKU: {prod.sku}
                            </span>
                          )}
                          <span className="text-[#B8BDC7]">
                            Cantidad: {prod.cantidad} × {formatCurrency(prod.precio)}
                          </span>
                        </div>
                      </div>
                      <div className="text-base font-bold text-[#F7F7F8] ml-4">
                        {formatCurrency(prod.total)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-[#FFFFFF14] mb-5"></div>

                <div className="space-y-3">
                  {envio.subtotal && (
                    <div className="flex justify-between items-center text-sm px-2" title="Subtotal sin envío">
                      <span className="text-[#B8BDC7] font-medium">Subtotal:</span>
                      <span className="font-bold text-[#F7F7F8]">{formatCurrency(envio.subtotal)}</span>
                    </div>
                  )}
                  {envio.envioMonto && (
                    <div className="flex justify-between items-center text-sm px-2" title="Costo de envío">
                      <span className="text-[#B8BDC7] font-medium">Costo de Envío:</span>
                      <span className="font-bold text-[#F7F7F8]">{formatCurrency(envio.envioMonto)}</span>
                    </div>
                  )}

                  <div className="h-px bg-[#FFFFFF14]"></div>

                  <div className="flex justify-between items-center px-3 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-[#D4AF37]/10 border border-[#D4AF37]/30">
                    <span className="text-base font-bold text-[#F7F7F8]" style={{ fontFamily: "'Playfair Display', serif" }}>Total:</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F5E6B3]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {formatCurrency(envio.total || 0)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#B8BDC7] italic">No hay detalles de productos disponibles</p>
            )}
          </div>
        </div>

        {/* Botón Resolver Novedad - Luxury Danger Button */}
        <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#D4AF37]/40 via-[#D4AF37]/20 to-[#D4AF37]/40 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <button
            onClick={handleVolverOfrecer}
            disabled={loading}
            className="relative w-full bg-[#7A1F2B] hover:bg-[#8B2332] border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 rounded-xl px-8 py-5 flex items-center justify-center gap-4 transition-all duration-300 shadow-[0_8px_32px_rgba(122,31,43,0.4)] hover:shadow-[0_12px_48px_rgba(212,175,55,0.3)] hover:-translate-y-[2px] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C] min-h-[56px] group"
            style={{ transform: 'perspective(1000px) rotateX(0deg)' }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'perspective(1000px) rotateX(2deg)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg)'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 text-[#F7F7F8] animate-spin" />
                <span className="text-lg font-bold text-[#F7F7F8]">Abriendo Portal...</span>
              </>
            ) : (
              <>
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg group-hover:bg-white/15 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-[#F7F7F8] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-lg font-bold text-[#F7F7F8] tracking-wide">
                  Resolver Novedad
                </span>
                <ExternalLink className="w-5 h-5 text-[#F7F7F8] group-hover:translate-x-1 transition-transform" />
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


