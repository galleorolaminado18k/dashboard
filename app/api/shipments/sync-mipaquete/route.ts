import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import axios from "axios"

/**
 * POST /api/shipments/sync-mipaquete
 * Sincroniza los estados de todos los envíos activos con MiPaquete
 */
export async function POST() {
  const supabase = createClient()

  try {
    console.log('[Sync Shipments] Iniciando sincronización con MiPaquete...')

    // 1. Obtener todos los envíos que NO están finalizados
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .not('tracking_number', 'is', null)
      .neq('status', 'delivered')
      .neq('status', 'returned')

    if (error) {
      console.error('[Sync Shipments] Error obteniendo envíos:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    console.log(`[Sync Shipments] Shipments obtenidos:`, shipments?.length || 0)

    if (!shipments || shipments.length === 0) {
      console.log('[Sync Shipments] No hay envíos para sincronizar')
      return NextResponse.json({
        ok: true,
        message: 'No hay envíos activos para sincronizar',
        actualizados: 0
      })
    }

    console.log(`[Sync Shipments] Encontrados ${shipments.length} envíos activos`)
    console.log('[Sync Shipments] Guías a consultar:', shipments.map(s => s.tracking_number))

    // 2. Configurar cliente de MiPaquete
    const MIPAQUETE_API_URL = "https://api-v2.mpr.mipaquete.com/getSendingTracking"
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzExOWRjNDMzNjk2M2YzMzBlYjFjZTYiLCJuYW1lIjoiQ29tZXJjaWFsaXphZG9yYSIsInN1cm5hbWUiOiJnYWxlMThrIiwiZW1haWwiOiJnYWxsZW9yb2xhbWluYWRvMThrQGdtYWlsLmNvbSIsImNlbGxQaG9uZSI6IjMwMTY4NDUwMjYiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTE3VDIzOjI5OjA4LjAxNFoiLCJkYXRlIjoiMjAyNS0wOC0xOSAxMDoyMDoyNCIsImlhdCI6MTc1NTYxNjgyNH0.LHBLIsBCQlNM6WlnB514dN00dR7LcPjIQcYt1B62hEA"

    let actualizados = 0
    let conNovedad = 0
    let entregados = 0
    let errores = 0

    // 3. Procesar cada envío
    for (const ship of shipments) {
      try {
        console.log(`[Sync] Consultando guía: ${ship.tracking_number}`)

        // Consultar estado en MiPaquete
        const response = await axios.post(
          MIPAQUETE_API_URL,
          { mpCode: ship.tracking_number },
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': API_KEY
            },
            timeout: 10000
          }
        )

        if (!response.data || !response.data.data) {
          console.log(`[Sync] Sin datos para guía ${ship.tracking_number}`)
          continue
        }

        const trackingData = response.data.data

        // Obtener el último estado
        let latestStatus = 'Sin información'
        let latestDate = null

        if (trackingData.sendingTracking && trackingData.sendingTracking.length > 0) {
          const lastEvent = trackingData.sendingTracking[trackingData.sendingTracking.length - 1]
          latestStatus = lastEvent.statusSending || 'Sin información'
          latestDate = lastEvent.dateEvent || null
        }

        console.log(`[Sync] Guía ${ship.tracking_number}: "${latestStatus}"`)

        // Mapear estado de MiPaquete a nuestro sistema
        const mappedStatus = mapMiPaqueteStatus(latestStatus)

        console.log(`[Sync] Mapeo: ${latestStatus} → status: ${mappedStatus.status}, novedad: ${mappedStatus.hasNovedad}`)

        // SIEMPRE actualizar para refrescar el estado (incluso si es igual)
        const { error: updateError } = await supabase
          .from('shipments')
          .update({
            status: mappedStatus.status,
            mipaquete_status: latestStatus,
            progress: mappedStatus.progress,
            actual_delivery: mappedStatus.status === 'delivered' && !ship.actual_delivery
              ? new Date().toISOString()
              : ship.actual_delivery,
            updated_at: new Date().toISOString()
          })
          .eq('id', ship.id)

        if (!updateError) {
          actualizados++
          if (mappedStatus.hasNovedad) conNovedad++
          if (mappedStatus.status === 'delivered') entregados++
          console.log(`[Sync] ✓ Actualizado: ${ship.shipment_code} → ${latestStatus} (novedad: ${mappedStatus.hasNovedad})`)
        } else {
          console.error(`[Sync] Error actualizando ${ship.shipment_code}:`, updateError)
          errores++
        }

      } catch (err: any) {
        console.error(`[Sync] Error con guía ${ship.tracking_number}:`, err.message)
        errores++
      }

      // Pequeña pausa entre peticiones para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`[Sync Shipments] Completado:`)
    console.log(`  - Actualizados: ${actualizados}`)
    console.log(`  - Con novedad: ${conNovedad}`)
    console.log(`  - Entregados: ${entregados}`)
    console.log(`  - Errores: ${errores}`)

    return NextResponse.json({
      ok: true,
      actualizados,
      conNovedad,
      entregados,
      errores,
      total: shipments.length
    })

  } catch (error: any) {
    console.error('[Sync Shipments] Error general:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

// Mapear estado de MiPaquete a nuestro sistema
function mapMiPaqueteStatus(mipaqueteStatus: string): {
  status: string
  progress: number
  hasNovedad: boolean
} {
  const statusLower = mipaqueteStatus.toLowerCase()
  const statusOriginal = mipaqueteStatus // Mantener original para debug

  // Detectar novedades - LISTA AMPLIADA
  const hasNovedad =
    statusLower.includes('novedad') ||
    statusLower.includes('usuario cancela') ||
    statusLower.includes('cancela pedido') ||
    statusLower.includes('cancelado') ||
    statusLower.includes('rechazado') ||
    statusLower.includes('rechaza') ||
    statusLower.includes('retenido') ||
    statusLower.includes('devolucion') ||
    statusLower.includes('devuelto') ||
    statusLower.includes('no reclama') ||
    statusLower.includes('destinatario ausente') ||
    statusLower.includes('direccion incorrecta')

  // Entregado
  if (statusLower.includes('entregado') || statusLower.includes('entrega exitosa')) {
    return { status: 'delivered', progress: 100, hasNovedad: false }
  }

  // Devolución
  if (statusLower.includes('devolucion') || statusLower.includes('devuelto')) {
    return { status: 'returned', progress: 100, hasNovedad: true }
  }

  // Novedad / Problema
  if (hasNovedad) {
    return { status: 'delayed', progress: 50, hasNovedad: true }
  }

  // En tránsito
  if (
    statusLower.includes('transito') ||
    statusLower.includes('en ruta') ||
    statusLower.includes('centro de distribucion')
  ) {
    return { status: 'in_transit', progress: 70, hasNovedad: false }
  }

  // Despachado / Recolectado
  if (
    statusLower.includes('recolectado') ||
    statusLower.includes('despachado') ||
    statusLower.includes('recogido')
  ) {
    return { status: 'dispatched', progress: 35, hasNovedad: false }
  }

  // Por defecto: pendiente
  return { status: 'pending', progress: 10, hasNovedad: false }
}

