"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, Package, DollarSign, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react"
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

  // Estados para diálogos de acciones
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)

  // Estados de formularios
  const [contactNotes, setContactNotes] = useState('')
  const [contactMethod, setContactMethod] = useState<'phone' | 'whatsapp' | 'email'>('phone')
  const [newAddress, setNewAddress] = useState(envio.direccion || '')
  const [returnReason, setReturnReason] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleAccionAPI = async (actionType: string, data: any = {}) => {
    setLoading(true)
    try {
      const response = await fetch('/api/shipments/novedad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: envio.envioId,
          action_type: actionType,
          ...data
        })
      })

      const result = await response.json()

      if (result.success) {
        setAccionTomada(getActionLabel(actionType))

        // Cerrar diálogos
        setShowContactDialog(false)
        setShowAddressDialog(false)
        setShowReturnDialog(false)
        setShowRescheduleDialog(false)

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose()
          window.location.reload() // Recargar para actualizar datos
        }, 2000)
      } else {
        alert('Error al registrar la acción: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la acción')
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      'contactar_cliente': 'Cliente contactado',
      'reprogramar': 'Entrega reprogramada',
      'solicitar_devolucion': 'Devolución solicitada',
      'cambiar_direccion': 'Dirección actualizada'
    }
    return labels[actionType] || actionType
  }

  const handleContactarCliente = () => {
    setShowContactDialog(true)
  }

  const confirmContacto = () => {
    handleAccionAPI('contactar_cliente', {
      notes: contactNotes,
      contact_method: contactMethod
    })
  }

  const handleCambiarDireccion = () => {
    setShowAddressDialog(true)
  }

  const confirmCambiarDireccion = () => {
    if (!newAddress.trim()) {
      alert('Por favor ingresa una dirección válida')
      return
    }
    handleAccionAPI('cambiar_direccion', {
      new_address: newAddress,
      notes: 'Dirección actualizada por novedad'
    })
  }

  const handleSolicitarDevolucion = () => {
    setShowReturnDialog(true)
  }

  const confirmDevolucion = () => {
    if (!returnReason.trim()) {
      alert('Por favor indica el motivo de la devolución')
      return
    }
    handleAccionAPI('solicitar_devolucion', {
      notes: returnReason
    })
  }

  const handleReprogramar = () => {
    setShowRescheduleDialog(true)
  }

  const confirmReprogramar = () => {
    if (!rescheduleDate) {
      alert('Por favor selecciona una fecha')
      return
    }
    handleAccionAPI('reprogramar', {
      reschedule_date: rescheduleDate,
      notes: rescheduleNotes
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
                Novedad en Envío
              </DialogTitle>
              <p className="text-sm text-neutral-500 mt-1">
                Envío: {envio.envioId} • Factura: {envio.factura || 'N/A'}
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
                Guía: {envio.guia} • Transportadora: {envio.transportadora}
              </p>
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#D8BD80]" />
            Información del Cliente
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm text-neutral-500">Nombre:</div>
              <div className="font-medium">{envio.cliente}</div>
            </div>

            {envio.telefono && (
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm text-neutral-500">Teléfono:</div>
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
                <div className="w-24 text-sm text-neutral-500">Dirección:</div>
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
                        Cantidad: {prod.cantidad} × {formatCurrency(prod.precio)}
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
                    <span className="text-neutral-600">Costo de envío:</span>
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

        {/* Acciones Rápidas */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-3">Acciones Rápidas</h3>

          {accionTomada ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">✅ {accionTomada}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleContactarCliente}
                className="justify-start hover:bg-blue-50 hover:border-blue-300"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Phone className="w-4 h-4 mr-2" />}
                Contacté al cliente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprogramar}
                className="justify-start hover:bg-orange-50 hover:border-orange-300"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                Reprogramar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSolicitarDevolucion}
                className="justify-start hover:bg-red-50 hover:border-red-300"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                Solicitar devolución
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCambiarDireccion}
                className="justify-start hover:bg-purple-50 hover:border-purple-300"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                Cambiar dirección
              </Button>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
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

      {/* Diálogo: Contactar Cliente */}
      {showContactDialog && (
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Registrar Contacto con Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Método de contacto</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={contactMethod === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactMethod('phone')}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Teléfono
                  </Button>
                  <Button
                    variant={contactMethod === 'whatsapp' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactMethod('whatsapp')}
                    className="flex-1"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant={contactMethod === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContactMethod('email')}
                    className="flex-1"
                  >
                    Email
                  </Button>
                </div>
              </div>
              <div>
                <Label>Notas de la conversación</Label>
                <Textarea
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Ej: Cliente confirmó estar en casa mañana de 2-5pm"
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowContactDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmContacto}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Registrar Contacto
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo: Cambiar Dirección */}
      {showAddressDialog && (
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Actualizar Dirección de Entrega
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Dirección actual</Label>
                <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                  {envio.direccion || 'No especificada'}
                </div>
              </div>
              <div>
                <Label>Nueva dirección</Label>
                <Textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Ingresa la nueva dirección completa"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddressDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmCambiarDireccion}
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

      {/* Diálogo: Solicitar Devolución */}
      {showReturnDialog && (
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Solicitar Devolución
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta acción iniciará el proceso de devolución con la transportadora.
                </p>
              </div>
              <div>
                <Label>Motivo de la devolución</Label>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ej: Cliente no desea recibir el pedido, dirección incorrecta, etc."
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label className="text-sm text-neutral-500">Información del pedido</Label>
                <div className="mt-2 p-3 bg-neutral-50 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total:</span>
                    <span className="font-semibold">{formatCurrency(envio.total || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transportadora:</span>
                    <span>{envio.transportadora}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReturnDialog(false)}
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

      {/* Diálogo: Reprogramar Entrega */}
      {showRescheduleDialog && (
        <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                Reprogramar Entrega
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Nueva fecha de entrega</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label>Notas adicionales (opcional)</Label>
                <Textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="Ej: Cliente disponible después de las 2pm"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ La transportadora será notificada del cambio de fecha.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleDialog(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmReprogramar}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Reprogramar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}

