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
      <DialogContent className="max-w-[98vw] w-full h-[98vh] p-0 gap-0 bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-orange-200/50 shadow-2xl">

        {/* Header moderno con gradiente */}
        <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white shadow-lg">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAtNGgydjJoLTJ2LTJ6bS0yIDJ2LTJoLTJ2Mmgyem0wIDBoMnYyaC0ydi0yem0wIDR2LTJoLTJ2Mmgyem0yLTJoMnYyaC0ydi0yem0wIDBodjJoMnYtMmgtMnptLTYgMHYyaDJ2LTJoLTJ6bTIgMmgydjJoLTJ2LTJ6bS0yIDJWMzZoLTJ2Mmgyem0wLTRoLTJ2Mmgydi0yem0wIDBoMnYtMmgtMnYyem0yLTJoMnYyaC0ydi0yem0wIDB2LTJoMnYyaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

          <div className="relative flex items-center gap-4">
            {/* Logo/Icono */}
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">Portal MiPaquete</h3>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isAuthenticated 
                    ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                    : 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30 animate-pulse'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? 'bg-green-200' : 'bg-yellow-200'}`}></div>
                  {isAuthenticated ? 'Autenticado' : 'Autenticando...'}
                </div>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">Guía: {trackingNumber}</p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-9 gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-9 gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir en pestaña
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Barra de navegación moderna */}
        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
          <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm text-neutral-700 truncate flex-1 font-mono">
              {portalUrl}
            </span>
          </div>
        </div>

        {/* Contenedor del iframe con sombra */}
        <div className="flex-1 relative m-4 rounded-xl overflow-hidden shadow-2xl border border-neutral-200">
          <iframe
            ref={iframeRef}
            src={portalUrl}
            className="w-full h-full bg-white"
            title="Portal MiPaquete - Novedades"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />

          {/* Overlay de autenticación con diseño moderno */}
          {isAuthenticating && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/95 to-white/95 backdrop-blur-md flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                {/* Spinner moderno */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-neutral-800 mb-2">
                  🔐 Iniciando sesión automáticamente
                </h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Preparando el portal de MiPaquete...
                </p>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500">Guía: {trackingNumber}</p>
                  <p className="text-xs text-neutral-400 mt-1">galleorolaminado18k@gmail.com</p>
                </div>

                {authError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">⚠️ {authError}</p>
                    <button
                      onClick={handleRefresh}
                      className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                    >
                      Intentar nuevamente
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer moderno */}
        <div className="px-6 py-3 bg-gradient-to-r from-neutral-100 to-neutral-50 border-t border-neutral-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isAuthenticated 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">
                  {isAuthenticated ? 'galleorolaminado18k@gmail.com' : 'Autenticando...'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-neutral-600">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Conexión segura HTTPS</span>
              </div>
            </div>

            <div className="text-neutral-500">
              MiPaquete © 2025
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
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

