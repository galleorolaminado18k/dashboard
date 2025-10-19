"use client"
import { useEffect } from "react"
import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function TrackingDialog({
  guia,
  open,
  onClose,
}: {
  guia: string
  open: boolean
  onClose: () => void
}) {
  const { data, error, isLoading, mutate } = useSWR(
    open && guia ? `/api/mipaquete/track?guia=${encodeURIComponent(guia)}` : null,
    fetcher,
  )

  useEffect(() => {
    if (open) mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guia])

  if (!open) return null

  const ok = data?.ok === true
  const d = data?.data

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="w-[min(1200px,95vw)] max-h-[85vh] overflow-hidden rounded-3xl border-2 border-[#d8bd80]/30 bg-gradient-to-br from-white via-[#fdfbf7] to-white shadow-[0_40px_100px_rgba(0,0,0,.3)]">
        <div className="relative overflow-hidden">
          <div className="h-16 w-full bg-gradient-to-r from-[#d8bd80] via-[#e8d4a0] to-[#d8bd80]" />
          <div className="absolute inset-0 flex items-center px-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/90 shadow-lg grid place-items-center text-lg">📦</div>
              <div>
                <div className="text-xs font-medium text-[#6b5728]/80 uppercase tracking-wider">Tracking MiPaquete</div>
                <div className="text-base font-bold text-[#6b5728] tabular-nums">{guia}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/95 text-neutral-700 shadow-lg hover:bg-white hover:scale-105 transition-transform text-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-64px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-2.5">
                <div className="h-10 w-10 mx-auto rounded-full border-4 border-[#d8bd80] border-t-transparent animate-spin" />
                <div className="text-sm text-neutral-600">Cargando información del envío...</div>
              </div>
            </div>
          )}

          {!isLoading && ok && <ResumenTracking data={d} guia={guia} />}

          {!isLoading && !ok && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 text-rose-900">
                <div className="text-base font-semibold mb-1.5">No fue posible obtener el estado</div>
                <div className="text-sm opacity-80">Por favor, verifica el número de guía o intenta más tarde.</div>
              </div>
              {data?.error && (
                <pre className="overflow-x-auto rounded-2xl bg-neutral-100 p-3.5 text-xs text-neutral-700 border">
                  {JSON.stringify({ error: data?.error, detail: data?.detail }, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* Diseño compacto con espaciados reducidos y grid de 2 columnas en la sección de destinatario */
function ResumenTracking({ data, guia }: { data: any; guia: string }) {
  const destinatario = data?.receiver || data?.destinatario || {}
  const carrier = data?.carrier || data?.transportadora || {}
  const valorCobrar = data?.price || data?.valor || data?.valorCobrar || 0
  const timeline: Array<{ label: string; at?: string; done?: boolean }> = data?.timeline ||
    data?.historial || [
      { label: "Recolección", done: !!data },
      { label: "Recogido", done: !!data },
      { label: "En transporte", done: !!data?.inTransit },
      { label: "En ciudad", done: !!data?.inCity },
      { label: "Distribución", done: !!data?.inDistribution },
      { label: "Entregado", done: !!data?.delivered },
    ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Columna izquierda: Información del destinatario y progreso */}
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-[#d8bd80]/30 bg-gradient-to-br from-white to-[#fdfbf7] p-4 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d8bd80] to-[#c9b074] shadow-md grid place-items-center text-lg">
              👤
            </div>
            <div>
              <div className="text-[10px] font-medium text-[#6b5728]/70 uppercase tracking-wider">Destinatario</div>
              <div className="text-base font-bold text-[#6b5728]">{destinatario?.name || "Sin información"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoField icon="📍" label="Dirección" value={destinatario?.address} />
            <InfoField icon="🚚" label="Transportadora" value={carrier?.name || "No especificada"} />
            <InfoField icon="🏙️" label="Ciudad" value={destinatario?.city} />
            <InfoField
              icon="💰"
              label="Valor a cobrar"
              value={valorCobrar ? `$${Number(valorCobrar).toLocaleString("es-CO")}` : "$0"}
              highlight
            />
            <InfoField icon="📱" label="Teléfono" value={destinatario?.phone} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[#d8bd80]/30 bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d8bd80] to-[#c9b074] shadow grid place-items-center text-base">
              📊
            </div>
            <div className="text-base font-bold text-[#6b5728]">Estado del Envío</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              {timeline.map((t, i) => (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all ${
                      t.done
                        ? "bg-gradient-to-br from-[#d8bd80] to-[#c9b074] text-white shadow-sm"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {t.done ? "✓" : ""}
                  </div>
                  <div className={`text-[9px] mt-1 font-medium ${t.done ? "text-[#6b5728]" : "text-neutral-400"}`}>
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#d8bd80]/30 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#d8bd80]/10 to-[#c9b074]/10 px-4 py-2.5 border-b border-[#d8bd80]/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#6b5728]">Vista MiPaquete (embebida)</div>
            <a
              href={`https://mipaquete.com/rastreo/${guia}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#6b5728] hover:underline font-medium"
            >
              Abrir en pestaña ↗
            </a>
          </div>
        </div>
        <div className="h-[480px] overflow-auto">
          <iframe
            src={`https://mipaquete.com/rastreo/${guia}`}
            className="w-full h-full border-0"
            title="Vista MiPaquete"
          />
        </div>
      </div>
    </div>
  )
}

/* Componente InfoField más compacto con padding y fuentes reducidas */
function InfoField({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string
  label: string
  value?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-2.5 transition-all ${
        highlight
          ? "bg-gradient-to-br from-[#d8bd80]/20 to-[#c9b074]/10 border-2 border-[#d8bd80]/40"
          : "bg-neutral-50 border border-neutral-200"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="text-base mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-medium text-neutral-600 uppercase tracking-wide mb-0.5">{label}</div>
          <div
            className={`text-xs font-semibold break-words ${highlight ? "text-[#6b5728] text-sm" : "text-neutral-800"}`}
          >
            {value || "No disponible"}
          </div>
        </div>
      </div>
    </div>
  )
}
