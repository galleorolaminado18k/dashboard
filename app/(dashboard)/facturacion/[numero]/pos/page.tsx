"use client"
import useSWR from "swr"
import { useParams } from "next/navigation"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function FacturaPOS() {
  const { numero } = useParams<{ numero: string }>()
  const { data } = useSWR<{ ok: boolean; facturas: any[] }>("/api/facturacion/list", fetcher)
  const fac = data?.facturas?.find((f) => f.numero === numero)

  if (!fac) return <div className="p-6 text-sm">Cargando factura...</div>

  return (
    <div className="w-[304px] mx-auto text-[11px] text-black">
      <style>{`
        @page { size: 80mm auto; margin: 4mm; }
        @media print { .no-print { display:none !important; } body{background:#fff;} }
        .hr { border-top:1px dashed #000; margin:6px 0; }
        .flex { display:flex; justify-content:space-between; }
      `}</style>

      <div className="text-center">
        <div className="text-[18px] font-bold">GALLE</div>
        <div>COMERCIALIZADORA GALLE18K ORO LAMINADO Y ACCESORIOS SAS</div>
        <div className="hr" />
        <div>
          <b>FACTURA:</b> {fac.numero}
        </div>
        <div>
          <b>FECHA:</b> {fac.emision}
        </div>
        <div>
          <b>MÉTODO:</b> {fac.metodo} • <b>ESTADO:</b> {fac.estado}
        </div>
        <div className="hr" />
      </div>

      <div>
        <div>
          <b>CLIENTE:</b> {fac.cliente.nombre}
        </div>
        {fac.cliente.nit && (
          <div>
            <b>NIT:</b> {fac.cliente.nit}
          </div>
        )}
        {fac.cliente.ciudad && (
          <div>
            <b>CIUDAD:</b> {fac.cliente.ciudad}
          </div>
        )}
        {fac.cliente.direccion && (
          <div>
            <b>DIR:</b> {fac.cliente.direccion}
          </div>
        )}
        <div className="hr" />
      </div>

      <div>
        <div className="flex">
          <b>REF</b>
          <b>TOTAL</b>
        </div>
        {fac.items.map((it: any, i: number) => (
          <div key={i}>
            <div>{it.descripcion}</div>
            <div className="flex">
              <span>
                x{it.und} • IVA {it.ivaPct}%
              </span>
              <span>$ {it.precioNeto.toLocaleString("es-CO")}</span>
            </div>
          </div>
        ))}
        <div className="hr" />
        <div className="flex">
          <span>SUBTOTAL</span>
          <b>$ {fac.subtotal.toLocaleString("es-CO")}</b>
        </div>
        <div className="flex">
          <span>IVA</span>
          <b>$ {fac.iva.toLocaleString("es-CO")}</b>
        </div>
        <div className="flex text-[14px]">
          <span>
            <b>TOTAL</b>
          </span>
          <b>$ {fac.total.toLocaleString("es-CO")}</b>
        </div>
        <div className="hr" />
      </div>

      <div className="text-center">¡Gracias por su compra!</div>

      <div className="no-print mt-4 flex gap-2">
        <button onClick={() => window.print()} className="w-full h-9 rounded bg-black text-white">
          Imprimir
        </button>
        <a href={`/facturacion/${numero}`} className="w-full h-9 rounded border grid place-items-center">
          Volver
        </a>
      </div>
    </div>
  )
}
