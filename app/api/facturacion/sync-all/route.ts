import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { obtenerEstadosMultiples, mapearEstadoMiPaquete } from "@/lib/mipaquete-api"

/**
 * POST /api/facturacion/sync-all
 * Sincroniza TODAS las facturas con guías de MiPaquete
 * Actualiza automáticamente estados en invoices, sales y conversations
 */
export async function POST(req: Request) {
  const supabase = createClient()

  try {
    console.log(`[Sync All] Iniciando sincronización masiva con MiPaquete...`)

    // 1. Obtener todas las facturas con guía que no estén finalizadas
    const { data: facturas, error: facturasError } = await supabase
      .from('invoices')
      .select('*')
      .not('mipaquete_code', 'is', null)
      .not('status', 'in', '("Pagado","Devuelto")')  // Solo pendientes

    if (facturasError) {
      console.error(`[Sync All] Error obteniendo facturas:`, facturasError)
      return NextResponse.json({ ok: false, error: facturasError.message }, { status: 500 })
    }

    if (!facturas || facturas.length === 0) {
      console.log(`[Sync All] No hay facturas pendientes para sincronizar`)
      return NextResponse.json({ ok: true, message: "No hay facturas pendientes", actualizadas: 0 })
    }

    console.log(`[Sync All] Encontradas ${facturas.length} facturas con guías pendientes`)

    // 2. Obtener estados de todas las guías de MiPaquete
    const guias = facturas
      .map(f => f.mipaquete_code)
      .filter(g => g) as string[]

    const estadosMiPaquete = await obtenerEstadosMultiples(guias)
    console.log(`[Sync All] Obtenidos ${estadosMiPaquete.size} estados de MiPaquete`)

    // 3. Procesar cada factura
    let actualizadas = 0
    let ventasExitosas = 0
    let devoluciones = 0

    for (const factura of facturas) {
      const estadoMiPaquete = estadosMiPaquete.get(factura.mipaquete_code!)

      if (!estadoMiPaquete) {
        console.log(`[Sync All] Sin estado para guía: ${factura.mipaquete_code}`)
        continue
      }

      const mapped = mapearEstadoMiPaquete(estadoMiPaquete.estado)

      // Solo actualizar si cambió el estado
      if (factura.status === mapped.estadoFactura) {
        continue
      }

      console.log(`[Sync All] Actualizando ${factura.invoice_number}: ${factura.status} → ${mapped.estadoFactura}`)

      // Actualizar factura
      await supabase
        .from('invoices')
        .update({
          status: mapped.estadoFactura,
          mipaquete_status: estadoMiPaquete.estado,
          updated_at: new Date().toISOString()
        })
        .eq('invoice_number', factura.invoice_number)

      // Actualizar o crear sale
      const saleData = {
        client_name: factura.client_name,
        client_phone: factura.client_phone,
        client_address: factura.client_address,
        city: factura.city,
        products: factura.products || [],
        payment_method: factura.payment_method || "Contraentrega",
        total_amount: Number(factura.total_amount || 0),
        shipping_amount: Number(factura.shipping_amount || 0),
        status: mapped.esVentaExitosa ? "entregado" : mapped.esDevolucion ? "devuelto" : "pendiente",
        is_return: mapped.esDevolucion,
        mipaquete_code: factura.mipaquete_code,
        mipaquete_status: estadoMiPaquete.estado,
        invoice_number: factura.invoice_number,
        campaign_id: factura.campaign_id || null,
      }

      const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('invoice_number', factura.invoice_number)
        .single()

      if (existingSale) {
        await supabase
          .from('sales')
          .update(saleData)
          .eq('id', existingSale.id)
      } else {
        await supabase
          .from('sales')
          .insert([saleData])
      }

      // Actualizar CRM
      if (factura.client_phone) {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', factura.client_phone)
          .single()

        if (client) {
          await supabase
            .from('conversations')
            .update({
              status: mapped.estadoCRM,
              updated_at: new Date().toISOString()
            })
            .eq('client_id', client.id)
        }
      }

      actualizadas++
      if (mapped.esVentaExitosa) ventasExitosas++
      if (mapped.esDevolucion) devoluciones++
    }

    console.log(`[Sync All] ✓ Sincronización completada:`)
    console.log(`  - Facturas actualizadas: ${actualizadas}`)
    console.log(`  - Ventas exitosas: ${ventasExitosas}`)
    console.log(`  - Devoluciones: ${devoluciones}`)

    return NextResponse.json({
      ok: true,
      actualizadas,
      ventasExitosas,
      devoluciones,
      total: facturas.length
    })

  } catch (error: any) {
    console.error(`[Sync All] Error:`, error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

