?"use client"

import { Button } from "@/components/ui/button"
import { Phone, MapPin, Package, DollarSign, AlertTriangle, CheckCircle2, X, Loader2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
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

  // Bloqueo de scroll cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [open])

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
      console.log('?? Enviando solución a MiPaquete:', { solutionType, data })

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
      console.log('?? Respuesta de API:', result)

      if (result.success) {
        // Abrir portal de MiPaquete en modal interno (iframe)
        if (result.data?.portal_url) {
          setPortalUrl(result.data.portal_url)
          setShowPortalModal(true)
        }

        setAccionTomada(`? ${getSolutionLabel(solutionType)} - Portal abierto`)

        // Cerrar todos los diálogos
        setShowIndemnizacionDialog(false)
        setShowVolverOfrecerDialog(false)
        setShowCambioDireccionDialog(false)
        setShowDevolucionDialog(false)
        setShowOtroDialog(false)

        // NO cerrar el modal principal - dejar que el usuario vea el portal
        // El modal principal se cierra cuando el usuario cierre el portal modal
      } else {
        alert(`? Error: ${result.error}\n\nDetalles: ${JSON.stringify(result.details || {})}`)
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
      alert('? La dirección es obligatoria')
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
      alert('? La dirección del remitente es obligatoria')
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

  // Bloqueo de scroll cuando el modal está abierto
  useState(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('overflow-hidden', open)
      return () => document.body.classList.remove('overflow-hidden')
    }
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop - negro translúcido con blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[110] flex items-start md:items-center justify-center p-4 overflow-y-auto"
      >
        <div className="w-full max-w-4xl rounded-2xl border border-[#D4AF37]/30 bg-[#0E0E10] shadow-2xl my-8">
          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-white/10 bg-[#0E0E10]">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#F5E6B3] rounded-full blur-md opacity-40"></div>
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F5E6B3] flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.35)]">
                <AlertTriangle className="w-6 h-6 text-[#0B0B0C]" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Novedad en Envío
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-[#D4AF37]/30 text-xs font-medium text-[#D4AF37]">
                  Factura: {envio.factura || 'N/A'}
                </span>
                <span className="text-xs text-[#B8BDC7]">• {envio.envioId}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2.5 hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60 flex-shrink-0"
            >
              <X className="w-6 h-6 text-[#B8BDC7] hover:text-[#F7F7F8]" />
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">

        {/* Estado Actual - Card con borde oro y glow */}
        <section className="rounded-xl bg-[#1A1A1C] border border-[#D4AF37]/30 p-5 shadow-lg hover:shadow-[0_0_16px_rgba(212,175,55,0.25)] transition-all duration-300">
          <h3 className="text-base font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></div>
            Estado Actual
          </h3>
          <p className="text-[#F7F7F8] text-sm leading-6 mb-3">{envio.mipaqueteStatus || 'Novedad en entrega'}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80 hover:bg-white/15 cursor-default" title="Número de guía">
              Guía: {envio.guia}
            </span>
            <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80 hover:bg-white/15 cursor-default" title="Transportadora">
              {envio.transportadora}
            </span>
          </div>
        </section>

        {/* Información del Cliente - Card sólida */}
        <section className="rounded-xl bg-[#1A1A1C] border border-white/10 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
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
        </section>

        {/* Detalles del Pedido - Card sólida */}
        <section className="rounded-xl bg-[#1A1A1C] border border-white/10 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#F7F7F8] mb-5 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D4AF37]" />
            Detalles del Pedido
          </h3>

          {envio.productos && envio.productos.length > 0 ? (
            <>
              <div className="space-y-3 mb-5">
                {envio.productos.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-[#D4AF37]/20 transition-all duration-300">
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
        </section>
          </div>

          {/* Footer con botones */}
          <div className="p-6 flex gap-3 border-t border-white/10 bg-[#0E0E10]">

            <button
              onClick={handleVolverOfrecer}
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5E6B3] hover:from-[#F5E6B3] hover:to-[#D4AF37] text-[#0B0B0C] font-bold py-3 px-6 shadow-[0_8px_24px_rgba(212,175,55,0.35)] hover:shadow-[0_12px_32px_rgba(212,175,55,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Abriendo Portal...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  <span>Resolver Novedad</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/60"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

}
