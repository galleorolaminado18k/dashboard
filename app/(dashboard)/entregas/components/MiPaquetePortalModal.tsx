"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useRef } from "react"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal simplificado que muestra el portal de MiPaquete
 * SIN overlay de loading - Iframe visible directamente
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // ✅ NO renderizar si no hay URL (evita SSR/build con valores vacíos)
  if (!portalUrl || portalUrl.trim() === '') {
    console.log('⚠️ [MiPaquetePortalModal] No hay URL, no renderizar modal')
    return null
  }

  console.log('🌐 [MiPaquetePortalModal] Abriendo portal - URL:', portalUrl, 'Guía:', trackingNumber)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 bg-neutral-900/95 backdrop-blur-xl border-0">

        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-2xl hover:bg-white transition-all duration-200 flex items-center justify-center group border border-neutral-200/50"
        >
          <X className="w-5 h-5 text-neutral-700 group-hover:text-neutral-900" />
        </button>

        {/* Mensaje de carga arriba del iframe */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-orange-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <p className="text-white text-sm font-medium">
            ⚡ Cargando Portal de MiPaquete - Guía: {trackingNumber}
          </p>
        </div>

        {/* Iframe fullscreen */}
        <div className="relative w-full h-full p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 bg-neutral-800">
            <iframe
              ref={iframeRef}
              src={portalUrl}
              className="w-full h-full bg-white"
              title="Portal MiPaquete"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

