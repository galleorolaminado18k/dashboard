"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { useEffect } from "react"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que abre el portal de MiPaquete en una NUEVA PESTAÑA
 * (Los iframes son bloqueados por MiPaquete por políticas de seguridad)
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  // ✅ NO renderizar si no hay URL
  if (!portalUrl || portalUrl.trim() === '') {
    console.log('⚠️ [MiPaquetePortalModal] No hay URL, no renderizar modal')
    return null
  }

  useEffect(() => {
    if (open && portalUrl) {
      console.log('🌐 [MiPaquetePortalModal] Abriendo portal en nueva pestaña - URL:', portalUrl)

      // Abrir en nueva pestaña
      const newWindow = window.open(portalUrl, '_blank', 'noopener,noreferrer')

      if (!newWindow) {
        alert('⚠️ Por favor, permite las ventanas emergentes para abrir el portal de MiPaquete')
      }

      // Cerrar el modal inmediatamente después de abrir la pestaña
      setTimeout(() => {
        onClose()
      }, 500)
    }
  }, [open, portalUrl, onClose])

  console.log('🌐 [MiPaquetePortalModal] Mostrando confirmación - Guía:', trackingNumber)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white border-0">

        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 flex items-center justify-center group"
        >
          <X className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900" />
        </button>

        {/* Contenido del modal */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-orange-600" />
          </div>

          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Portal de MiPaquete
          </h3>

          <p className="text-neutral-600 mb-6">
            Se abrió el portal en una nueva pestaña para gestionar la guía <strong>{trackingNumber}</strong>
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                window.open(portalUrl, '_blank', 'noopener,noreferrer')
              }}
              className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir Portal de Nuevo
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            💡 Si no se abrió, permite las ventanas emergentes en tu navegador
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

