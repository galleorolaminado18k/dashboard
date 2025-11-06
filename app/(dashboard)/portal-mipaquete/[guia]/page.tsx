"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, X } from "lucide-react"
import { useState } from "react"

export default function PortalMiPaquetePage() {
  const params = useParams()
  const router = useRouter()
  const guia = params.guia as string
  const [loading, setLoading] = useState(true)

  // URL directa de MiPaquete
  const mipaqueteUrl = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}`

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-900 z-50">
      {/* Header Luxury - Sticky Top */}
      <div className="flex-shrink-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-orange-500/20 shadow-2xl">
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

            <button
              onClick={() => router.push('/entregas')}
              className="w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Iframe Container - Fullscreen */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading Overlay Luxury */}
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col items-center justify-center z-10">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-orange-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Cargando Portal de MiPaquete</h3>
              <p className="text-orange-300/70 text-sm mb-6">Conectando con el sistema de novedades...</p>
              <div className="flex gap-2 justify-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Iframe Fullscreen DENTRO del Dashboard */}
        <iframe
          src={mipaqueteUrl}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          title="Portal MiPaquete"
          onLoad={() => setLoading(false)}
          allow="clipboard-read; clipboard-write; fullscreen; camera; microphone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
        />
      </div>
    </div>
  )
}

