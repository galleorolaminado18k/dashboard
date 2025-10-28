import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET() {
  const supabase = createClient()

  try {
    // Obtener facturas con sus items desde Supabase
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('[Facturacion List] Error:', error)
      return NextResponse.json({
        ok: false,
        facturas: [],
        devoluciones: []
      })
    }

    // Transformar datos de Supabase al formato esperado por el frontend
    const facturas = (invoices || []).map((inv: any) => {
      const items = (inv.invoice_items || []).map((item: any) => ({
        ref: item.id || '',
        descripcion: item.product_name || item.description || 'Producto sin nombre',
        und: Number(item.quantity || 1),
        ivaPct: 19, // IVA estándar
        precioBase: Number(item.unit_price || 0),
        precioNeto: Number(item.total || 0)
      }))
      
      console.log(`[Facturacion] ${inv.invoice_number} tiene ${items.length} items:`, items)
      
      return {
        numero: inv.invoice_number,
        cliente: {
          nombre: inv.client_name,
          nit: inv.client_nit,
          telefono: inv.client_phone,
          ciudad: inv.client_address ? inv.client_address.split(', ')[1] || '' : '',
          direccion: inv.client_address
        },
        guia: inv.guia || inv.mipaquete_code || '',
        transportadora: inv.transportadora || inv.carrier || '',
        emision: inv.issue_date ? new Date(inv.issue_date).toISOString().slice(0, 10) : '',
        vencimiento: inv.due_date ? new Date(inv.due_date).toISOString().slice(0, 10) : '',
        subtotal: Number(inv.subtotal || 0),
        iva: Number(inv.tax_amount || 0),
        total: Number(inv.total || 0),
        estado: inv.status || 'PENDIENTE PAGO',
        metodo: inv.payment_method || 'Contraentrega',
        items
      }
    })

    // Filtrar devoluciones (facturas con estado DEVUELTO)
    const devoluciones = facturas.filter((f: any) =>
      f.estado === 'DEVUELTO' || f.estado === 'Devuelto' || f.estado === 'devuelto'
    )

    return NextResponse.json({
      ok: true,
      facturas,
      devoluciones
    })

  } catch (error: any) {
    console.error('[Facturacion List] Exception:', error)
    return NextResponse.json({
      ok: false,
      facturas: [],
      devoluciones: [],
      error: error.message
    })
  }
}
