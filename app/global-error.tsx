"use client"

import * as React from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("[global-error]", error)
  }, [error])

  return (
    <html>
      <body>
        <main className="min-h-dvh grid place-items-center p-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">Se produjo un error</h1>
            <p className="opacity-70 mb-6">Excepción en cliente durante la carga.</p>
            <pre className="text-left inline-block bg-neutral-100 p-4 rounded max-w-[90vw] overflow-auto text-sm">
              {error?.message}
            </pre>
            <div className="mt-6">
              <button className="underline" onClick={() => reset()}>Reintentar</button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}

