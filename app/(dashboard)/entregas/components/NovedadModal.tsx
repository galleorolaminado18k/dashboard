"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Package, DollarSign, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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

  // Estados para diÃ¡logos de acciones REALES de MiPaquete
  const [showIndemnizacionDialog, setShowIndemnizacionDialog] = useState(false)
  const [showVolverOfrecerDialog, setShowVolverOfrecerDialog] = useState(false)
  const [showCambioDireccionDialog, setShowCambioDireccionDialog] = useState(false)
  const [showDevolucionDialog, setShowDevolucionDialog] = useState(false)
  const [showOtroDialog, setShowOtroDialog] = useState(false)

  // Estados de formularios segÃºn MiPaquete
  const [indemnizacionDesc, setIndemnizacionDesc] = useState('')
  const [volverOfrecerDesc, setVolverOfrecerDesc] = useState('')
  const [volverOfrecerDireccion, setVolverOfrecerDireccion] = useState(envio.direccion || '')

  // Cambio de direcciÃ³n (campos requeridos por MiPaquete)
  const [nuevaCiudad, setNuevaCiudad] = useState(envio.ciudad || '')
  const [nuevaDireccion, setNuevaDireccion] = useState(envio.direccion || '')
  const [nombreDestinatario, setNombreDestinatario] = useState(envio.cliente || '')
  const [telefonoDestinatario, setTelefonoDestinatario] = useState(envio.telefono || '')

  // DevoluciÃ³n (campos requeridos por MiPaquete)
  const [nombreRemitente, setNombreRemitente] = useState('Comercializadora Gale18k')
  const [telefonoRemitente, setTelefonoRemitente] = useState('3016845026')
  const [ciudadRemitente, setCiudadRemitente] = useState('VILLA DEL ROSARIO-NORTE DE SANTANDER')
  const [direccionRemitente, setDireccionRemitente] = useState('Av 1 #9-53 Lomitas del trapiche')
  const [devolucionDesc, setDevolucionDesc] = useState('')

  // Otro tipo de soluciÃ³n
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
      console.log('ðŸš€ Enviando soluciÃ³n a MiPaquete:', { solutionType, data })

      const response = await fetch('/api/mipaquete/resolver-novedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_number: envio.guia,
          solution_type: solutionType,
          ...data
        })
      })

      const result = await response.json()
      console.log('ðŸ“¥ Respuesta de API:', result)

      if (result.success) {
        setAccionTomada(`âœ… ${getSolutionLabel(solutionType)} - Enviado a MiPaquete`)

        // Cerrar todos los diÃ¡logos
        setShowIndemnizacionDialog(false)
        setShowVolverOfrecerDialog(false)
        setShowCambioDireccionDialog(false)
        setShowDevolucionDialog(false)
        setShowOtroDialog(false)

        // Cerrar modal despuÃ©s de 3 segundos
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 3000)
      } else {
        alert(`âŒ Error: ${result.error}\n\nDetalles: ${JSON.stringify(result.details || {})}`)
      }
    } catch (error: any) {
      console.error('âŒ Error:', error)
      alert(`Error al procesar la acciÃ³n: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getSolutionLabel = (solutionType: string): string => {
    const labels: Record<string, string> = {
      'indemnizacion': 'IndemnizaciÃ³n solicitada',
      'volver_a_ofrecer': 'Volver a ofrecer programado',
      'cambio_direccion': 'DirecciÃ³n actualizada',
      'devolucion': 'DevoluciÃ³n solicitada',
      'otro': 'SoluciÃ³n registrada'
    }
    return labels[solutionType] || solutionType
  }

  // 1. IndemnizaciÃ³n
  const handleIndemnizacion = () => {
    setShowIndemnizacionDialog(true)
  }

  const confirmIndemnizacion = () => {
    enviarSolucionMiPaquete('indemnizacion', {
      description: indemnizacionDesc || 'Solicitud de indemnizaciÃ³n por novedad en entrega'
    })
  }

  // 2. Volver a ofrecer
  const handleVolverOfrecer = () => {
    setShowVolverOfrecerDialog(true)
  }

  const confirmVolverOfrecer = () => {
    enviarSolucionMiPaquete('volver_a_ofrecer', {
      description: volverOfrecerDesc || 'Volver a ofrecer el envÃ­o',
      new_address: volverOfrecerDireccion || undefined
    })
  }

  // 3. Cambio de direcciÃ³n
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
      alert('âŒ La direcciÃ³n es obligatoria')
      return
    }
    if (!nombreDestinatario.trim()) {
      alert('âŒ El nombre del destinatario es obligatorio')
      return
    }
    if (!telefonoDestinatario.trim()) {
      alert('âŒ El telÃ©fono del destinatario es obligatorio')
      return
    }

    enviarSolucionMiPaquete('cambio_direccion', {
      new_city: nuevaCiudad,
      new_address: nuevaDireccion,
      recipient_name: nombreDestinatario,
      recipient_phone: telefonoDestinatario,
      description: 'Cambio de direcciÃ³n de entrega solicitado por novedad'
    })
  }

  // 4. DevoluciÃ³n
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
      alert('âŒ El telÃ©fono del remitente es obligatorio')
      return
    }
    if (!ciudadRemitente.trim()) {
      alert('âŒ La ciudad del remitente es obligatoria')
      return
    }
    if (!direccionRemitente.trim()) {
      alert('âŒ La direcciÃ³n del remitente es obligatoria')
      return
    }

    enviarSolucionMiPaquete('devolucion', {
      sender_name: nombreRemitente,
      sender_phone: telefonoRemitente,
      sender_city: ciudadRemitente,
      sender_address: direccionRemitente,
      description: devolucionDesc || 'Solicitud de devoluciÃ³n del pedido'
    })
  }

  // 5. Otro tipo de soluciÃ³n
  const handleOtro = () => {
    setShowOtroDialog(true)
  }

  const confirmOtro = () => {
    if (!otroDesc.trim() || otroDesc.length < 6) {
      alert('âŒ Debes ingresar una descripciÃ³n de al menos 6 caracteres')
      return
    }

    enviarSolucionMiPaquete('otro', {
      description: otroDesc
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Novedad en EnvÃ­o
              </DialogTitle>
              <p className="text-sm text-neutral-500 mt-1">
                EnvÃ­o: {envio.envioId} â€¢ Factura: {envio.factura || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Estado de la Novedad */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Estado Actual</h3>
              <p className="text-sm text-red-700 mt-1">{envio.mipaqueteStatus || 'Novedad en entrega'}</p>
              <p className="text-xs text-red-600 mt-2">
                GuÃ­a: {envio.guia} â€¢ Transportadora: {envio.transportadora}
              </p>
            </div>
          </div>
        </div>

        {/* InformaciÃ³n del Cliente */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#D8BD80]" />
            InformaciÃ³n del Cliente
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm text-neutral-500">Nombre:</div>
              <div className="font-medium">{envio.cliente}</div>
            </div>

            {envio.telefono && (
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm text-neutral-500">TelÃ©fono:</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{envio.telefono}</span>
                  <a
                    href={`tel:${envio.telefono}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    Llamar
                  </a>
                  <a
                    href={`https://wa.me/57${envio.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-24 text-sm text-neutral-500">Ciudad:</div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span>{envio.ciudad}</span>
              </div>
            </div>

            {envio.direccion && (
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm text-neutral-500">DirecciÃ³n:</div>
                <div className="text-sm">{envio.direccion}</div>
              </div>
            )}
          </div>
        </div>

        {/* Detalles del Pedido */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D8BD80]" />
            Detalles del Pedido
          </h3>

          {envio.productos && envio.productos.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {envio.productos.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{prod.descripcion}</div>
                      <div className="text-xs text-neutral-500">
                        Cantidad: {prod.cantidad} Ã— {formatCurrency(prod.precio)}
                      </div>
                    </div>
                    <div className="font-semibold text-right ml-4">
                      {formatCurrency(prod.total)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-3 space-y-2">
                {envio.subtotal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(envio.subtotal)}</span>
                  </div>
                )}
                {envio.envioMonto && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Costo de envÃ­o:</span>
                    <span className="font-medium">{formatCurrency(envio.envioMonto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                  <span>Total:</span>
                  <span className="text-[#D8BD80]">{formatCurrency(envio.total || 0)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">No hay detalles de productos disponibles</p>
          )}
        </div>

        {/* Acciones RÃ¡pidas */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">Acciones RÃ¡pidas</h3>

          {accionTomada ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">{accionTomada}</span>
              <span className="text-xs text-green-700 ml-auto">Cerrando en 3s...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 mb-3">
                ðŸ’¡ Estas acciones se envÃ­an directamente a MiPaquete para resolver la novedad
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* IndemnizaciÃ³n */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIndemnizacion}
                  className="justify-start hover:bg-yellow-50 hover:border-yellow-400 text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <DollarSign className="w-3 h-3 mr-1" />}
                  IndemnizaciÃ³n
                </Button>

                {/* Volver a ofrecer */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVolverOfrecer}
                  className="justify-start hover:bg-orange-50 hover:border-orange-400 text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Package className="w-3 h-3 mr-1" />}
                  Volver a ofrecer
                </Button>

                {/* Cambio de direcciÃ³n */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCambioDireccion}
                  className="justify-start hover:bg-purple-50 hover:border-purple-400 text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MapPin className="w-3 h-3 mr-1" />}
                  Cambiar direcciÃ³n
                </Button>

                {/* DevoluciÃ³n */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDevolucion}
                  className="justify-start hover:bg-red-50 hover:border-red-400 text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                  DevoluciÃ³n
                </Button>

                {/* Otro tipo de soluciÃ³n */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOtro}
                  className="justify-start hover:bg-blue-50 hover:border-blue-400 text-xs col-span-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                  Otro tipo de soluciÃ³n
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Botones de AcciÃ³n */}
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

      {/* ========== DIÃLOGOS REALES DE MIPAQUETE ========== */}

      {/* DiÃ¡logo 1: IndemnizaciÃ³n */}
      {showIndemnizacionDialog && (
        <Dialog open={showIndemnizacionDialog} onOpenChange={setShowIndemnizacionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Solicitar IndemnizaciÃ³n
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ðŸ’° Esta solicitud se enviarÃ¡ directamente a MiPaquete para iniciar el proceso de indemnizaciÃ³n.
                </p>
              </div>
              <div>
                <Label>DescripciÃ³n (opcional)</Label>
                <Textarea
                  value={indemnizacionDesc}
                  onChange={(e) => setIndemnizacionDesc(e.target.value)}
                  placeholder="Ej: Producto daÃ±ado, paquete perdido, etc."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-neutral-500">
                <p><strong>GuÃ­a:</strong> {envio.guia}</p>
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
                  Solicitar IndemnizaciÃ³n
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DiÃ¡logo 2: Volver a ofrecer */}
      {showVolverOfrecerDialog && (
        <Dialog open={showVolverOfrecerDialog} onOpenChange={setShowVolverOfrecerDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Volver a Ofrecer el EnvÃ­o
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  ðŸ“¦ El envÃ­o serÃ¡ reprogramado para un nuevo intento de entrega.
                </p>
              </div>
              <div>
                <Label>DescripciÃ³n (opcional)</Label>
                <Textarea
                  value={volverOfrecerDesc}
                  onChange={(e) => setVolverOfrecerDesc(e.target.value)}
                  placeholder="Ej: Cliente disponible despuÃ©s de las 2pm"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Soporte de direcciÃ³n (opcional)</Label>
                <Input
                  value={volverOfrecerDireccion}
                  onChange={(e) => setVolverOfrecerDireccion(e.target.value)}
                  placeholder="Indicaciones adicionales sobre la direcciÃ³n"
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

      {/* DiÃ¡logo 3: Cambio de DirecciÃ³n (CAMPOS REQUERIDOS POR MIPAQUETE) */}
      {showCambioDireccionDialog && (
        <Dialog open={showCambioDireccionDialog} onOpenChange={setShowCambioDireccionDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Cambio de DirecciÃ³n
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  ðŸ“ Actualiza la direcciÃ³n de entrega. Todos los campos son obligatorios.
                </p>
              </div>

              <div>
                <Label>Nueva Ciudad *</Label>
                <Input
                  value={nuevaCiudad}
                  onChange={(e) => setNuevaCiudad(e.target.value)}
                  placeholder="Ej: TURBACO-BOLÃVAR"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Nueva DirecciÃ³n *</Label>
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
                <Label>TelÃ©fono del Destinatario *</Label>
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
                  Actualizar DirecciÃ³n
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DiÃ¡logo 4: DevoluciÃ³n (CAMPOS REQUERIDOS POR MIPAQUETE) */}
      {showDevolucionDialog && (
        <Dialog open={showDevolucionDialog} onOpenChange={setShowDevolucionDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Solicitar DevoluciÃ³n
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  âš ï¸ El pedido serÃ¡ devuelto a la direcciÃ³n del remitente.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-neutral-700">Datos del Remitente:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Nombre:</strong> {nombreRemitente}</p>
                  <p><strong>TelÃ©fono:</strong> {telefonoRemitente}</p>
                  <p><strong>Ciudad:</strong> {ciudadRemitente}</p>
                  <p><strong>DirecciÃ³n:</strong> {direccionRemitente}</p>
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
                <Label>TelÃ©fono del Remitente *</Label>
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
                <Label>DirecciÃ³n del Remitente *</Label>
                <Textarea
                  value={direccionRemitente}
                  onChange={(e) => setDireccionRemitente(e.target.value)}
                  rows={2}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>DescripciÃ³n (opcional)</Label>
                <Textarea
                  value={devolucionDesc}
                  onChange={(e) => setDevolucionDesc(e.target.value)}
                  placeholder="Motivo de la devoluciÃ³n..."
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
                  Solicitar DevoluciÃ³n
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DiÃ¡logo 5: Otro tipo de soluciÃ³n */}
      {showOtroDialog && (
        <Dialog open={showOtroDialog} onOpenChange={setShowOtroDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                Otro Tipo de SoluciÃ³n
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ðŸ’¡ Describe la soluciÃ³n especÃ­fica que necesitas para esta novedad.
                </p>
              </div>
              <div>
                <Label>DescripciÃ³n de la soluciÃ³n * (mÃ­nimo 6 caracteres)</Label>
                <Textarea
                  value={otroDesc}
                  onChange={(e) => setOtroDesc(e.target.value)}
                  placeholder="Describe detalladamente la soluciÃ³n que necesitas..."
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
                  Enviar SoluciÃ³n
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========== FIN DIÃLOGOS REALES ========== */}
    </Dialog>
  )
}
