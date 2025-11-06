"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Auto-login cuando el iframe carga
  useEffect(() => {
    if (open && iframeRef.current) {
      const iframe = iframeRef.current

      const handleIframeLoad = () => {
        console.log('📄 Iframe cargado, intentando auto-login...')

        setTimeout(() => {
          try {
            // Intentar inyectar credenciales en el formulario
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

            if (iframeDoc) {
              // Buscar campos de email y password
              const emailInput = iframeDoc.querySelector('input[type="email"], input[name="email"], input[placeholder*="correo" i], input[placeholder*="email" i]') as HTMLInputElement
              const passwordInput = iframeDoc.querySelector('input[type="password"], input[name="password"], input[placeholder*="contraseña" i], input[placeholder*="password" i]') as HTMLInputElement
              const submitButton = iframeDoc.querySelector('button[type="submit"], button:not([type="button"])') as HTMLButtonElement

              if (emailInput && passwordInput) {
                console.log('✅ Campos de login encontrados, llenando automáticamente...')

                // Llenar campos
                emailInput.value = 'galleorolaminado18k@gmail.com'
                passwordInput.value = 'Om@r1430**'

                // Disparar eventos para que React/Vue detecte los cambios
                emailInput.dispatchEvent(new Event('input', { bubbles: true }))
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }))

                setIsAuthenticating(false)
                setIsAuthenticated(true)

                // Auto-submit después de 500ms
                setTimeout(() => {
                  if (submitButton) {
                    console.log('🚀 Enviando formulario automáticamente...')
                    submitButton.click()
                  }
                }, 500)
              } else {
                console.log('⚠️ No se encontraron campos de login, usuario ya autenticado o página diferente')
                setIsAuthenticating(false)
                setIsAuthenticated(true)
              }
            }
          } catch (error) {
            console.error('❌ Error al acceder al iframe (CORS):', error)
            setAuthError('No se pudo acceder al formulario (restricción de seguridad)')
            setIsAuthenticating(false)

            // Mostrar overlay con instrucciones
            setTimeout(() => {
              setIsAuthenticating(false)
            }, 2000)
          }
        }, 1000) // Esperar 1 segundo para que el formulario cargue completamente
      }

      iframe.addEventListener('load', handleIframeLoad)

      return () => {
        iframe.removeEventListener('load', handleIframeLoad)
      }
    }
  }, [open])

  const handleOpenInNewTab = () => {
    window.open(portalUrl, '_blank')
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsAuthenticating(true)
      setAuthError(null)
      iframeRef.current.src = portalUrl
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

            {/* Overlay de autenticación minimalista */}
            {isAuthenticating && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/98 via-white/98 to-orange-50/98 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  {/* Spinner luxury */}
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-[3px] border-orange-100 rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-orange-50 to-white rounded-full shadow-inner flex items-center justify-center">
                      <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>

                  <h4 className="text-2xl font-light text-neutral-800 mb-3 tracking-tight">
                    Autenticando
                  </h4>
                  <p className="text-sm text-neutral-500 font-light">
                    Preparando portal de MiPaquete
                  </p>

                  {/* Badge minimalista */}
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-neutral-200/50 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-neutral-600 font-medium">Guía {trackingNumber}</span>
                  </div>

                  {authError && (
                    <div className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl max-w-sm mx-auto">
                      <p className="text-sm text-red-700 font-medium">⚠️ {authError}</p>
                      <button
                        onClick={handleRefresh}
                        className="mt-3 text-sm text-red-600 underline hover:text-red-800 font-medium"
                      >
                        Reintentar
                      </button>
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

