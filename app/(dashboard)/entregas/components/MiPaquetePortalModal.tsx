"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que muestra el portal de MiPaquete en iframe
 * Con auto-login automático usando credenciales
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authenticatedUrl, setAuthenticatedUrl] = useState<string>('')

  // Auto-login cuando se abre el modal
  useEffect(() => {
    if (open) {
      performAutoLogin()
    }
  }, [open])

  const performAutoLogin = async () => {
    try {
      setIsAuthenticating(true)
      setAuthError(null)
      console.log('🔐 Iniciando auto-login...')

      const response = await fetch('/api/mipaquete/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (result.success && result.token) {
        console.log('✅ Auto-login exitoso')
        setAuthToken(result.token)

        // Construir URL autenticada con token
        const urlWithToken = `${portalUrl}&token=${encodeURIComponent(result.token)}`
        setAuthenticatedUrl(urlWithToken)

        setIsAuthenticating(false)
      } else {
        console.error('❌ Error en auto-login:', result)
        setAuthError(result.error || 'Error al autenticar')
        setIsAuthenticating(false)

        // Fallback: cargar URL sin token
        setAuthenticatedUrl(portalUrl)
      }
    } catch (error: any) {
      console.error('❌ Error en auto-login:', error)
      setAuthError(error.message)
      setIsAuthenticating(false)

      // Fallback: cargar URL sin token
      setAuthenticatedUrl(portalUrl)
    }
  }

  const handleOpenInNewTab = () => {
    window.open(authenticatedUrl || portalUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
        {/* Header del modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isAuthenticating ? 'bg-yellow-500 animate-pulse' : authToken ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-medium">
                {isAuthenticating ? 'Autenticando...' : authToken ? 'Portal MiPaquete - Sesión iniciada' : 'Portal MiPaquete'}
              </span>
            </div>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
              Guía: {trackingNumber}
            </span>
            {authToken && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ Autenticado
              </span>
            )}
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
          {!isAuthenticating && authenticatedUrl && (
            <iframe
              src={authenticatedUrl}
              className="w-full h-full border-0"
              title="Portal MiPaquete - Novedades"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          )}

          {/* Overlay de autenticación/carga */}
          {(isAuthenticating || !authenticatedUrl) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-medium text-neutral-700">
                  {isAuthenticating ? '🔐 Iniciando sesión automáticamente...' : 'Cargando portal de MiPaquete...'}
                </p>
                <p className="text-xs text-neutral-500 mt-2">Guía: {trackingNumber}</p>
                <p className="text-xs text-neutral-400 mt-1">galleorolaminado18k@gmail.com</p>
                {authError && (
                  <p className="text-xs text-red-600 mt-3 bg-red-50 px-3 py-2 rounded">
                    ⚠️ {authError}
                  </p>
                )}
              </div>
            </div>
          )}
            title="Portal MiPaquete - Novedades"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />

        </div>

        {/* Footer con información */}
        <div className="px-4 py-2 bg-neutral-50 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className={authToken ? 'text-green-600' : 'text-neutral-500'}>
              {authToken ? '✅ Sesión iniciada: galleorolaminado18k@gmail.com' : '⏳ Iniciando sesión...'}
            </span>
            <span className="text-neutral-500">🔒 Conexión segura HTTPS</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

