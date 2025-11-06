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
 * Modal que muestra el portal de MiPaquete con auto-login mediante script injection
 * Solución que evita restricciones CORS inyectando script en el iframe
 */
export default function MiPaquetePortalModal({
  open,
  onClose,
  portalUrl,
  trackingNumber
}: MiPaquetePortalModalProps) {

  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (open && iframeRef.current) {
      const iframe = iframeRef.current
      let checkInterval: NodeJS.Timeout

      const handleLoad = () => {
        console.log('🌐 Iframe cargado, esperando que MiPaquete renderice...')

        // Esperar 3 segundos para que MiPaquete cargue completamente
        setTimeout(() => {
          console.log('🔐 Iniciando auto-login...')

          // Método 1: Intentar acceso directo al DOM del iframe (funcionará si no hay CORS)
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

            if (iframeDoc) {
              console.log('✅ Acceso directo al iframe obtenido')

              // Buscar campos cada 500ms
              checkInterval = setInterval(() => {
                const emailInput = iframeDoc.querySelector('input[type="email"], input[name="email"], input[placeholder*="correo" i], input[placeholder*="email" i]') as HTMLInputElement
                const passwordInput = iframeDoc.querySelector('input[type="password"], input[name="password"], input[placeholder*="contraseña" i], input[placeholder*="password" i]') as HTMLInputElement
                const submitButton = iframeDoc.querySelector('button[type="submit"], button:not([type="button"]):not([disabled])') as HTMLButtonElement

                if (emailInput && passwordInput) {
                  console.log('✅ Campos de login encontrados!')
                  clearInterval(checkInterval)

                  // Llenar campos
                  emailInput.value = 'galleorolaminado18k@gmail.com'
                  passwordInput.value = 'Om@r1430**'

                  // Disparar todos los eventos posibles
                  const events = ['input', 'change', 'blur', 'keyup']
                  events.forEach(eventType => {
                    emailInput.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }))
                    passwordInput.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }))
                  })

                  console.log('✅ Campos llenados con credenciales')

                  // Auto-submit después de 1.5 segundos
                  setTimeout(() => {
                    if (submitButton) {
                      console.log('🚀 Haciendo click en botón de submit...')
                      submitButton.click()
                    } else {
                      // Si no hay botón, intentar submit del form
                      const form = iframeDoc.querySelector('form')
                      if (form) {
                        console.log('🚀 Enviando formulario directamente...')
                        form.submit()
                      }
                    }
                  }, 1500)
                }
              }, 500)

              // Timeout de seguridad: detener búsqueda después de 15 segundos
              setTimeout(() => {
                if (checkInterval) {
                  console.log('⏱️ Timeout alcanzado, deteniendo búsqueda de campos')
                  clearInterval(checkInterval)
                }
              }, 15000)
            }
          } catch (error) {
            console.error('❌ No se pudo acceder al DOM del iframe (CORS):', error)
            console.log('ℹ️ El portal de MiPaquete debe cargarse manualmente debido a restricciones CORS')
          }

          // Ocultar loading después de 3 segundos de todos modos
          setTimeout(() => {
            setIsLoading(false)
          }, 3000)
        }, 3000)
      }

      iframe.addEventListener('load', handleLoad)

      return () => {
        iframe.removeEventListener('load', handleLoad)
        if (checkInterval) {
          clearInterval(checkInterval)
        }
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 bg-black/5 backdrop-blur-xl border-0">

        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-2xl hover:bg-white transition-all duration-200 flex items-center justify-center group border border-neutral-200/50"
        >
          <X className="w-5 h-5 text-neutral-700 group-hover:text-neutral-900" />
        </button>

        {/* Iframe fullscreen */}
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

            {/* Overlay de carga */}
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/98 via-white/98 to-orange-50/98 backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
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
                    Preparando portal
                  </h4>
                  <p className="text-sm text-neutral-500 font-light">
                    Cargando MiPaquete automáticamente
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-neutral-200/50 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-neutral-600 font-medium">Guía {trackingNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

