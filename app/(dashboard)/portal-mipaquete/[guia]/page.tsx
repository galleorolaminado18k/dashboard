"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, Loader2 } from "lucide-react"
import { useState } from "react"

export default function PortalMiPaquetePage() {
  const params = useParams()
  const router = useRouter()
  const guia = params.guia as string
  const [loading, setLoading] = useState(true)

  // URL del proxy interno que carga MiPaquete sin restricciones X-Frame-Options
  const proxyUrl = `/api/mipaquete/proxy?guia=${encodeURIComponent(guia)}`

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
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

      {/* Iframe Container Luxury */}
      <div className="flex-1 relative p-4">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl flex flex-col items-center justify-center z-10 border border-orange-500/20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Cargando Portal de MiPaquete</h3>
              <p className="text-orange-300/70 text-sm">Conectando con el sistema...</p>
              <div className="flex gap-2 justify-center mt-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Iframe Luxury */}
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-orange-500/20 bg-white relative">
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            title="Portal MiPaquete"
            onLoad={() => setLoading(false)}
            allow="clipboard-read; clipboard-write; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          />

          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-orange-500/30 rounded-tl-3xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-orange-500/30 rounded-tr-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-orange-500/30 rounded-bl-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-orange-500/30 rounded-br-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  )
}

