import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

// API actualizado para cargar ventas desde Supabase en lugar de memoria
export async function GET() {
  const supabase = createClient()

  // Obtener facturas de Supabase con sus items
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      *,
      invoice_items (*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[ventas/list] Error fetching invoices:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // Transformar datos de facturas a formato de ventas
  const ventas = (invoices || []).map((invoice: any) => {
    // Concatenar nombres de productos de los items
    const productos = invoice.invoice_items?.map((item: any) => item.description).join(", ") || "Sin productos"

    // Mapear estados de la BD al formato esperado
    let estado: "Pagado" | "Pendiente Pago" = "Pendiente Pago"
    if (invoice.status === "paid" || invoice.status === "PAGADO") {
      estado = "Pagado"
    }

    // Mapear métodos de pago
    let metodo: "Efectivo" | "Transferencia" | "Contraentrega" = "Contraentrega"
    if (invoice.payment_method) {
      const method = invoice.payment_method.toLowerCase()
      if (method === "efectivo") metodo = "Efectivo"
      else if (method === "transferencia") metodo = "Transferencia"
      else if (method === "contraentrega" || method === "credito") metodo = "Contraentrega"
    }

    return {
      id: invoice.invoice_number,
      cliente: invoice.client_name,
      fecha: invoice.issue_date || invoice.created_at,
      producto: productos,
      total: Number(invoice.total) || 0,
      estado,
      metodo,
      transportadora: invoice.transportadora || "",
      guia: invoice.guia || "",
      evidenciaUrl: invoice.evidencia || null,
      vendedor: invoice.vendedor || "Sistema",
      factura: invoice.invoice_number,
    }
  })

  return NextResponse.json({ ok: true, data: ventas })
}
