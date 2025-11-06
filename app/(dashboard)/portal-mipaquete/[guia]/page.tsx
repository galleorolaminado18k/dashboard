"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Package, AlertCircle } from "lucide-react"
import { useEffect } from "react"

export default function PortalMiPaquetePage() {
  const params = useParams()
  const router = useRouter()
  const guia = params.guia as string

  const portalUrl = `https://centrodenovedades.mipaquete.com/novedades/envios-con-novedad?search=${encodeURIComponent(guia)}`

  useEffect(() => {
    // Auto-abrir el portal en nueva pestaña al cargar esta página
    const timer = setTimeout(() => {
      window.open(portalUrl, '_blank', 'noopener,noreferrer')
    }, 500)

    return () => clearTimeout(timer)
  }, [portalUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/entregas')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Entregas
          </button>
          <div className="flex items-center gap-2 text-neutral-600">
            <Package className="w-5 h-5" />
            <span className="font-medium">Guía: {guia}</span>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Hero section */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-12 text-white text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ExternalLink className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Portal de MiPaquete
            </h1>
            <p className="text-orange-100 text-lg">
              Gestiona la guía <span className="font-semibold">{guia}</span>
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6">

            {/* Alerta informativa */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  El portal se abrió en una nueva pestaña
                </h3>
                <p className="text-blue-700 text-sm">
                  Por políticas de seguridad de MiPaquete, el portal debe abrirse en una ventana separada.
                  Si no se abrió automáticamente, haz click en el botón de abajo.
                </p>
              </div>
            </div>

            {/* Botón principal */}
            <button
              onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
              className="w-full py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
            >
              <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Abrir Portal de MiPaquete
            </button>

            {/* Instrucciones */}
            <div className="bg-neutral-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-neutral-900 text-lg mb-4">
                📋 Instrucciones
              </h3>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-neutral-700">
                      <strong>Busca tu guía:</strong> El portal debería buscar automáticamente la guía <span className="font-mono bg-orange-100 px-2 py-1 rounded">{guia}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-neutral-700">
                      <strong>Gestiona la novedad:</strong> Completa los datos necesarios en el formulario de MiPaquete
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-neutral-700">
                      <strong>Confirma la acción:</strong> Verifica los datos y envía la solución
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-neutral-700">
                      <strong>Regresa aquí:</strong> Una vez completado, usa el botón "Volver a Entregas" arriba
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón secundario */}
            <button
              onClick={() => router.push('/entregas')}
              className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors"
            >
              Ya terminé, volver a Entregas
            </button>
          </div>
        </div>

        {/* Nota al pie */}
        <p className="text-center text-neutral-500 text-sm mt-8">
          💡 <strong>Consejo:</strong> Mantén esta pestaña abierta mientras trabajas en MiPaquete para regresar fácilmente
        </p>
      </div>
    </div>
  )
}

