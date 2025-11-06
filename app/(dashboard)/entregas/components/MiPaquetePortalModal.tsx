"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que navega al portal de MiPaquete en una subpágina interna
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const router = useRouter()

  // ✅ NO renderizar si no hay URL
  if (!portalUrl || portalUrl.trim() === '') {
    console.log('⚠️ [MiPaquetePortalModal] No hay URL, no renderizar modal')
    return null
  }

  useEffect(() => {
    if (open && trackingNumber) {
      console.log('🌐 [MiPaquetePortalModal] Navegando a portal interno - Guía:', trackingNumber)

      // Navegar a la página interna del portal
      router.push(`/portal-mipaquete/${trackingNumber}`)

      // Cerrar el modal después de navegar
      setTimeout(() => {
        onClose()
      }, 300)
    }
  }, [open, trackingNumber, router, onClose])

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
            Abriendo Portal de MiPaquete
          </h3>

          <p className="text-neutral-600 mb-6">
            Cargando portal para gestionar la guía <strong>{trackingNumber}</strong>
          </p>

          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

