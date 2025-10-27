import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import { obtenerEstadoGuia, mapearEstadoMiPaquete } from "@/lib/mipaquete-api"

/**
 * POST /api/facturacion/sync
 * Sincroniza una factura con:
 * 1. Tabla sales (ventas)
 * 2. Tabla conversations (CRM)
 * 3. API de MiPaquete (estado de guía)
 */
export async function POST(req: Request) {
  const supabase = createClient()

  try {
    const body = await req.json()
    const { factura, estado, metodo, motivo, guia } = body || {}

    if (!factura) {
      return NextResponse.json({ ok: false, error: "Número de factura requerido" }, { status: 400 })
    }

    console.log(`[Sync Factura] Sincronizando factura ${factura}`)
    console.log(`[Sync Factura] Estado: ${estado}, Método: ${metodo}, Guía: ${guia}`)

    // 1. Obtener datos de la factura
    const { data: facturaData, error: facturaError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', factura)
      .single()

    if (facturaError || !facturaData) {
      console.error(`[Sync Factura] Error obteniendo factura:`, facturaError)
      return NextResponse.json({ ok: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // 2. Si hay guía, consultar estado en MiPaquete
    let estadoMiPaquete = null
    let estadoFinal = estado
    let estadoCRM = "pendiente-guia"
    let esVentaExitosa = false
    let esDevolucion = false

    if (guia || facturaData.mipaquete_code) {
      const numeroGuia = guia || facturaData.mipaquete_code
      console.log(`[Sync Factura] Consultando guía ${numeroGuia} en MiPaquete...`)

      estadoMiPaquete = await obtenerEstadoGuia(numeroGuia)

      if (estadoMiPaquete) {
        const mapped = mapearEstadoMiPaquete(estadoMiPaquete.estado)
        estadoFinal = mapped.estadoFactura
        estadoCRM = mapped.estadoCRM
        esVentaExitosa = mapped.esVentaExitosa
        esDevolucion = mapped.esDevolucion

        console.log(`[Sync Factura] Estado MiPaquete: ${estadoMiPaquete.estado} → ${estadoFinal}`)
      }
    } else if (estado) {
      // Si no hay guía pero se proporciona estado manual
      if (estado === "Pagado") {
        estadoCRM = "pedido-completo"
        esVentaExitosa = true
      } else if (estado === "Devuelto") {
        estadoCRM = "devolucion"
        esDevolucion = true
      }
    }

    // 3. Actualizar o crear registro en tabla sales
    const saleData = {
      client_name: facturaData.client_name,
      client_phone: facturaData.client_phone,
      client_address: facturaData.client_address,
      city: facturaData.city,
      products: facturaData.products || [],
      payment_method: metodo || facturaData.payment_method || "Contraentrega",
      total_amount: Number(facturaData.total_amount || 0),
      shipping_amount: Number(facturaData.shipping_amount || 0),
      status: esVentaExitosa ? "entregado" : esDevolucion ? "devuelto" : "pendiente",
      is_return: esDevolucion,
      mipaquete_code: guia || facturaData.mipaquete_code,
      mipaquete_status: estadoMiPaquete?.estado || null,
      invoice_number: factura,
      campaign_id: facturaData.campaign_id || null,
      utm_source: facturaData.utm_source || null,
      utm_medium: facturaData.utm_medium || null,
      utm_campaign: facturaData.utm_campaign || null,
    }

    // Buscar si ya existe una venta para esta factura
    const { data: existingSale } = await supabase
      .from('sales')
      .select('id')
      .eq('invoice_number', factura)
      .single()

    if (existingSale) {
      // Actualizar venta existente
      const { error: updateError } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', existingSale.id)

      if (updateError) {
        console.error(`[Sync Factura] Error actualizando sale:`, updateError)
      } else {
        console.log(`[Sync Factura] ✓ Sale actualizada: ${existingSale.id}`)
      }
    } else {
      // Crear nueva venta
      const { data: newSale, error: insertError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single()

      if (insertError) {
        console.error(`[Sync Factura] Error creando sale:`, insertError)
      } else {
        console.log(`[Sync Factura] ✓ Sale creada: ${newSale.id}`)
      }
    }

    // 4. Actualizar estado en CRM (conversations)
    if (facturaData.client_phone) {
      // Buscar cliente por teléfono
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', facturaData.client_phone)
        .single()

      if (client) {
        // Actualizar conversación asociada
        const { error: convError } = await supabase
          .from('conversations')
          .update({
            status: estadoCRM,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', client.id)

        if (!convError) {
          console.log(`[Sync Factura] ✓ Conversación actualizada a estado: ${estadoCRM}`)
        }
      }
    }

    // 5. Actualizar factura con nuevo estado
    const { error: updateFacturaError } = await supabase
      .from('invoices')
      .update({
        status: estadoFinal,
        payment_method: metodo || facturaData.payment_method,
        mipaquete_status: estadoMiPaquete?.estado || facturaData.mipaquete_status,
        updated_at: new Date().toISOString()
      })
      .eq('invoice_number', factura)

    if (updateFacturaError) {
      console.error(`[Sync Factura] Error actualizando factura:`, updateFacturaError)
    } else {
      console.log(`[Sync Factura] ✓ Factura actualizada`)
    }

    return NextResponse.json({
      ok: true,
      factura: factura,
      estadoFinal: estadoFinal,
      estadoCRM: estadoCRM,
      esVentaExitosa: esVentaExitosa,
      esDevolucion: esDevolucion,
      estadoMiPaquete: estadoMiPaquete?.estado || null
    })

  } catch (error: any) {
    console.error(`[Sync Factura] Error:`, error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
