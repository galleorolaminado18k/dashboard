"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

export default function DatabaseInitializer() {
  const [status, setStatus] = useState<"checking" | "initialized" | "error" | "initializing">("checking")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAndInitialize() {
      try {
        console.log("[v0] Verificando estado de la base de datos...")

        // Verificar si la base de datos está inicializada
        const checkResponse = await fetch("/api/init-db")
        const checkData = await checkResponse.json()

        if (checkData.initialized) {
          console.log("[v0] Base de datos ya inicializada")
          setStatus("initialized")
          return
        }

        console.log("[v0] Inicializando base de datos...")
        setStatus("initializing")

        // Inicializar la base de datos
        const initResponse = await fetch("/api/init-db", { method: "POST" })
        const initData = await initResponse.json()

        if (initData.success) {
          console.log("[v0] Base de datos inicializada correctamente")
          setStatus("initialized")
        } else {
          console.error("[v0] Error al inicializar:", initData.error)
          setError(initData.message || initData.error)
          setStatus("error")
        }
      } catch (err: any) {
        console.error("[v0] Error en inicialización:", err)
        setError(err.message)
        setStatus("error")
      }
    }

    checkAndInitialize()
  }, [])

  // No mostrar nada si está inicializado
  if (status === "initialized") {
    return null
  }

  // Mostrar indicador de carga
  if (status === "checking" || status === "initializing") {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {status === "checking" ? "Verificando base de datos..." : "Inicializando base de datos..."}
            </p>
            <p className="text-xs text-blue-700">Por favor espera un momento</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (status === "error") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error de inicialización</p>
            <p className="mt-1 text-xs text-red-700">{error}</p>
            <p className="mt-2 text-xs text-red-600">
              Por favor ejecuta el script SQL manualmente desde la interfaz de v0
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
