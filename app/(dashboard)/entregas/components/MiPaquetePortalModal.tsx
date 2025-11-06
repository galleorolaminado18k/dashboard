"use client"

import { useEffect } from "react"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que abre el portal de MiPaquete en una nueva pestaña
 * Solución simple y confiable sin problemas de CORS
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  // Abrir portal en nueva pestaña automáticamente
  useEffect(() => {
    if (open) {
      // Abrir en nueva pestaña
      const newWindow = window.open(portalUrl, '_blank', 'noopener,noreferrer')

      if (newWindow) {
        console.log('✅ Portal abierto en nueva pestaña')
      } else {
        console.warn('⚠️ Popup bloqueado, intentando de nuevo...')
        // Fallback si el popup fue bloqueado
        setTimeout(() => {
          window.open(portalUrl, '_blank')
        }, 100)
      }

      // Cerrar el modal inmediatamente
      setTimeout(() => {
        onClose()
      }, 300)
    }
  }, [open, portalUrl, onClose])

  // No renderizar nada - solo abrir pestaña
  return null
}

