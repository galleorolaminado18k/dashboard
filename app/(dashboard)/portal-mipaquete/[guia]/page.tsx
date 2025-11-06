"use client"

import { useParams, useRouter } from "next/navigation"
import { X, ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"

export default function PortalMiPaquetePage() {
  const params = useParams()
  const router = useRouter()
  const guia = params.guia as string
  const [portalUrl, setPortalUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Construir URL del portal con la guía
    const url = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}&guia=${encodeURIComponent(guia)}&tracking=${encodeURIComponent(guia)}`
    setPortalUrl(url)
    setLoading(false)
  }, [guia])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando Portal de MiPaquete...</p>
          <p className="text-neutral-400 text-sm">Guía: {guia}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-neutral-900 flex flex-col">
      {/* Header con botón de regresar */}
      <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/entregas')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Entregas
          </button>
          <div className="text-white">
            <span className="text-neutral-400">Portal MiPaquete - Guía:</span>
            <span className="font-semibold ml-2">{guia}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/entregas')}
          className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Iframe fullscreen */}
      <div className="flex-1 relative">
        <iframe
          src={portalUrl}
          className="absolute inset-0 w-full h-full border-0"
          title="Portal MiPaquete"
          allow="clipboard-read; clipboard-write; fullscreen"
        />
      </div>
    </div>
  )
}

