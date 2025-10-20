"use client"

import { useEffect } from "react"

/**
 * Listener global para errores de carga de chunks. Cuando ocurre un deploy en Vercel
 * con el sitio ya abierto, los archivos con hash cambian y el navegador puede intentar
 * cargar un chunk viejo. Aquí detectamos ese caso y forzamos una recarga completa.
 */
export default function ChunkReload() {
  useEffect(() => {
    const reload = () => {
      // Evita bucles de recarga rápida
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.reload()
      }, 50)
    }

    const onError = (e: ErrorEvent) => {
      // Caso típico: "Loading chunk XXXX failed" o un <script> de /_next/static/chunks/ falla
      const msg = String((e?.error as any)?.message ?? e?.message ?? "")
      const isChunkMsg = /Loading chunk/i.test(msg)

      const target = e?.target as any
      const isNextChunkScript =
        target && target.tagName === "SCRIPT" && typeof target.src === "string" && target.src.includes("/_next/static/chunks/")

      if (isChunkMsg || isNextChunkScript) reload()
    }

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e?.reason as any
      const msg = String(reason?.message ?? reason ?? "")
      if (/Loading chunk/i.test(msg) || String(reason?.name ?? "").includes("ChunkLoadError")) reload()
    }

    window.addEventListener("error", onError, true)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError, true)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}

