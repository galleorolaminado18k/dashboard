"use client"

import * as React from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // Log para diagnosticar en producción (Vercel logs del navegador)
    console.error("/publicidad error:", error)
  }, [error])

  return (
    <main className="min-h-dvh grid place-items-center p-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Error en Publicidad</h1>
        <p className="opacity-70 mb-6">Ocurrió un error en el cliente al renderizar la página.</p>
        <pre className="text-left inline-block bg-neutral-100 p-4 rounded max-w-[90vw] overflow-auto text-sm">
          {error?.message}
        </pre>
        <div className="mt-6">
          <button className="underline" onClick={() => reset()}>Reintentar</button>
        </div>
      </div>
    </main>
  )
}

