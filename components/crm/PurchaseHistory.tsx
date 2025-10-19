"use client"
import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function PurchaseHistory({ phone }: { phone: string }) {
  const { data, error } = useSWR<{
    ok: boolean
    data: { nombre?: string; historial: any[] }
  }>(phone ? `/api/crm/customer/${encodeURIComponent(phone)}` : null, fetcher)

  if (!phone) return <div className="text-sm text-neutral-500">Sin teléfono</div>
  if (error) return <div className="text-sm text-red-600">No se encontró historial</div>
  if (!data) return <div className="text-sm text-neutral-500">Cargando historial…</div>
  const { data: c } = data

  return (
    <div className="rounded-2xl border border-[#D8BD80]/45 bg-white/95 shadow-[0_12px_36px_rgba(0,0,0,.06)] p-4 space-y-3">
      <div className="font-medium">Historial de Compras</div>
      <ul className="space-y-2">
        {c.historial?.length ? (
          c.historial.map((h: any, i: number) => (
            <li key={i} className="flex items-center justify-between text-sm border-b border-neutral-100 pb-2">
              <div>
                <div className="font-medium">{h.descripcion}</div>
                <div className="text-neutral-500 text-xs">
                  {h.fecha} • {h.numeroFactura}
                </div>
              </div>
              <div className="font-semibold">$ {Number(h.total).toLocaleString("es-CO")}</div>
            </li>
          ))
        ) : (
          <li className="text-sm text-neutral-500">Sin compras registradas</li>
        )}
      </ul>
    </div>
  )
}
