"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que muestra el portal de MiPaquete en iframe
 * Simula una pestaña nueva pero dentro de la misma página
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const handleOpenInNewTab = () => {
    window.open(portalUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
        {/* Header del modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Portal MiPaquete - Novedades</span>
            </div>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
              Guía: {trackingNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en pestaña nueva
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Barra de dirección (simulada) */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-md border">
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-neutral-600 truncate flex-1">
              {portalUrl}
            </span>
          </div>
        </div>

        {/* Iframe del portal */}
        <div className="flex-1 bg-white relative">
          <iframe
            src={portalUrl}
            className="w-full h-full border-0"
            title="Portal MiPaquete - Novedades"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />

          {/* Overlay de carga inicial */}
          <div className="absolute inset-0 bg-white flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300" id="loading-overlay">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-neutral-600">Cargando portal de MiPaquete...</p>
              <p className="text-xs text-neutral-500 mt-2">Guía: {trackingNumber}</p>
            </div>
          </div>
        </div>

        {/* Footer con información */}
        <div className="px-4 py-2 bg-neutral-50 border-t">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>✅ Sesión iniciada automáticamente</span>
            <span>🔒 Conexión segura</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

