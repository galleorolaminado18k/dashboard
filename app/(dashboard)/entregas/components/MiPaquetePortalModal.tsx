"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface MiPaquetePortalModalProps {
  open: boolean
  onClose: () => void
  portalUrl: string
  trackingNumber: string
}

/**
 * Modal que muestra el portal de MiPaquete con auto-login
 * Inyecta credenciales automáticamente en el formulario
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Auto-login cuando se abre el modal
  useEffect(() => {
    if (open && !sessionReady) {
      performAutoLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const performAutoLogin = async () => {
    try {
      setIsAuthenticating(true)
      setAuthError(null)
      console.log('🔐 Iniciando auto-login...')

      // Llamar a la API de auto-login
      const response = await fetch('/api/mipaquete/auto-login', {
        method: 'POST',
        credentials: 'include' // Importante: incluir cookies
      })

      const result = await response.json()

      if (result.success && result.token) {
        console.log('✅ Auto-login exitoso, sesión establecida')
        setSessionReady(true)

        // Esperar 500ms para que las cookies se establezcan
        setTimeout(() => {
          setIsAuthenticating(false)
        }, 500)
      } else {
        console.error('❌ Error en auto-login:', result)
        setAuthError(result.error || 'Error al autenticar')
        // Mostrar iframe de todos modos después de 2 seg
        setTimeout(() => {
          setIsAuthenticating(false)
        }, 2000)
      }
    } catch (error: any) {
      console.error('❌ Error en auto-login:', error)
      setAuthError(error.message)
      // Mostrar iframe de todos modos después de 2 seg
      setTimeout(() => {
        setIsAuthenticating(false)
      }, 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 gap-0 bg-black/5 backdrop-blur-xl border-0">

        {/* Solo botón de cerrar - diseño minimalista luxury */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-2xl hover:bg-white transition-all duration-200 flex items-center justify-center group border border-neutral-200/50"
        >
          <X className="w-5 h-5 text-neutral-700 group-hover:text-neutral-900" />
        </button>

        {/* Iframe fullscreen con diseño luxury */}
        <div className="relative w-full h-full p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/20 bg-white">
            <iframe
              ref={iframeRef}
              src={portalUrl}
              className="w-full h-full"
              title="Portal MiPaquete"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />

            {/* Overlay de autenticación automática */}
            {isAuthenticating && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/98 via-white/98 to-orange-50/98 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  {/* Spinner luxury */}
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-[2px] border-orange-100 rounded-full"></div>
                    <div className="absolute inset-0 border-[2px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 bg-gradient-to-br from-orange-50 to-white rounded-full shadow-inner flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>

                  <h4 className="text-lg font-light text-neutral-800 mb-2 tracking-tight">
                    {sessionReady ? 'Abriendo portal' : 'Iniciando sesión'}
                  </h4>
                  <p className="text-sm text-neutral-500 font-light">
                    {sessionReady ? 'Cargando MiPaquete...' : 'Autenticando automáticamente'}
                  </p>

                  {/* Badge minimalista */}
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-neutral-200/50 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-neutral-600 font-medium">
                      {sessionReady ? '✓ Sesión activa' : `Guía ${trackingNumber}`}
                    </span>
                  </div>

                  {authError && (
                    <div className="mt-4 p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-lg max-w-sm mx-auto">
                      <p className="text-xs text-amber-700 font-medium">⚠️ {authError}</p>
                      <p className="text-xs text-amber-600 mt-1">Cargando portal de todos modos...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

