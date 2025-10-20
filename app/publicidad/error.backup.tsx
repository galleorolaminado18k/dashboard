"use client"

import * as React from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // Log para diagnosticar en producción (Vercel logs del navegador)
    console.error("/publicidad error:", error)

    // Si es un error de carga de chunk, forzar recarga completa para obtener assets nuevos
    if (typeof window !== "undefined" && /Loading chunk/i.test(error?.message ?? "")) {
      const timeout = window.setTimeout(() => {
        window.location.reload()
      }, 150)
      return () => window.clearTimeout(timeout)
    }
  }, [error])

  return (
    <main className="min-h-dvh grid place-items-center p-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Error en Publicidad</h1>
        <p className="opacity-70 mb-6">
          Ocurrió un error en el cliente al renderizar la página. Si ves "Loading chunk ... failed", la página será
          recargada automáticamente.
        </p>
        <pre className="text-left inline-block bg-neutral-100 p-4 rounded max-w-[90vw] overflow-auto text-sm">
          {error?.message}
        </pre>
        <div className="mt-6">
          <button
            className="underline"
            onClick={() => {
              if (/Loading chunk/i.test(error?.message ?? "")) {
                window.location.reload()
              } else {
                reset()
              }
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    </main>
  )
}
