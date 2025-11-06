"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, ExternalLink } from "lucide-react"
import { useEffect } from "react"

export default function PortalMiPaquetePage() {
  const params = useParams()
  const router = useRouter()
  const guia = params.guia as string

  // URL directa de MiPaquete (sin proxy ya que es bloqueado)
  const mipaqueteUrl = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}`

  useEffect(() => {
    // Auto-abrir MiPaquete en nueva pestaña después de 1 segundo
    const timer = setTimeout(() => {
      window.open(mipaqueteUrl, '_blank', 'noopener,noreferrer,width=1400,height=900')
    }, 1000)

    return () => clearTimeout(timer)
  }, [mipaqueteUrl])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Header Luxury */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-orange-500/20 shadow-2xl backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/entregas')}
            className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-orange-500/50 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a Entregas</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl backdrop-blur-sm">
              <Package className="w-5 h-5 text-orange-400" />
              <div className="text-left">
                <p className="text-xs text-orange-300/70 font-medium">Guía de Envío</p>
                <p className="text-sm font-bold text-white tracking-wider">{guia}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal Luxury */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {/* Card Principal */}
          <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl shadow-2xl border border-orange-500/20 overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTEydjEyaDEyek0zNiAwaDEydjEySDB2MTJoMTJ2MTJoMTJ2MTJoMTJWMzZoMTJWMjRoMTJWMTJoLTEyVjBoLTEyek0zNiAzNmgxMnYxMkgzNnYtMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <ExternalLink className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-3">
                  Portal de MiPaquete
                </h1>
                <p className="text-orange-100 text-lg">
                  Gestiona tu envío con facilidad
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6">
              {/* Guía Badge */}
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 text-center">
                <p className="text-orange-300/70 text-sm font-medium mb-2">Número de Guía</p>
                <p className="text-3xl font-bold text-white tracking-wider font-mono">{guia}</p>
              </div>

              {/* Mensaje */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Portal Abierto en Nueva Ventana</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Por políticas de seguridad de MiPaquete, el portal se abre en una ventana separada.
                      Si no se abrió automáticamente, usa el botón de abajo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón Principal */}
              <button
                onClick={() => window.open(mipaqueteUrl, '_blank', 'noopener,noreferrer,width=1400,height=900')}
                className="w-full group relative px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center gap-3">
                  <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Abrir Portal de MiPaquete</span>
                </div>
              </button>

              {/* Instrucciones */}
              <div className="bg-neutral-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Instrucciones
                </h3>

                <div className="space-y-3">
                  {[
                    'Busca tu guía en el portal (debería aparecer automáticamente)',
                    'Completa los datos necesarios en el formulario',
                    'Verifica y envía la solución a la novedad',
                    'Regresa aquí usando el botón "Volver a Entregas"'
                  ].map((step, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-neutral-300 text-sm pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Secundario */}
              <button
                onClick={() => router.push('/entregas')}
                className="w-full px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-all duration-300"
              >
                Ya terminé, volver a Entregas
              </button>
            </div>
          </div>

          {/* Nota al pie */}
          <p className="text-center text-neutral-500 text-sm mt-6">
            💡 <strong>Consejo:</strong> Mantén esta pestaña abierta para regresar fácilmente
          </p>
        </div>
      </div>
    </div>
  )
}

