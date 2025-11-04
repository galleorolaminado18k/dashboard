"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, Package, DollarSign, AlertTriangle, CheckCircle2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleAccion = (accion: string) => {
    setAccionTomada(accion)
    // Aquí podrías hacer un POST a un API para registrar la acción
    console.log(`Acción tomada: ${accion} para envío ${envio.envioId}`)
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
              <span className="text-sm font-medium">Acción registrada: {accionTomada}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAccion('Cliente contactado')}
                className="justify-start"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contacté al cliente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAccion('Reprogramar entrega')}
                className="justify-start"
              >
                <Package className="w-4 h-4 mr-2" />
                Reprogramar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAccion('Solicitar devolución')}
                className="justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Solicitar devolución
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAccion('Actualizar dirección')}
                className="justify-start"
              >
                <MapPin className="w-4 h-4 mr-2" />
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
    </Dialog>
  )
}

