import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET() {
  const supabase = createClient()

  try {
    // Obtener todos los envíos con información relacionada
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select(`
        *,
        invoices:invoice_number (
          invoice_number,
          total,
          status,
          issue_date
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Shipments API] Error:', error)
      return NextResponse.json({
        ok: false,
        shipments: [],
        error: error.message
      }, { status: 500 })
    }

    // Transformar datos al formato esperado por el frontend
    const formattedShipments = (shipments || []).map((ship: any) => ({
      envioId: ship.shipment_code,
      pedidoId: ship.sale_id || ship.invoice_number,
      factura: ship.invoice_number,
      cliente: ship.client_name,
      ciudad: ship.city || 'N/A',
      transportadora: ship.carrier || 'N/A',
      guia: ship.tracking_number || 'Sin guía',
      estado: mapStatus(ship.status),
      progreso: ship.progress || 0,
      despacho: ship.dispatch_date ? new Date(ship.dispatch_date).toISOString().split('T')[0] : 'Pendiente',
      eta: ship.estimated_delivery ? new Date(ship.estimated_delivery).toISOString().split('T')[0] : 'N/A',
      lastUpdate: getRelativeTime(ship.updated_at),
      // Datos adicionales
      barrio: ship.neighborhood,
      telefono: ship.client_phone,
      direccion: ship.client_address,
      notas: ship.notes,
      evidencia: ship.delivery_evidence,
      mipaqueteStatus: ship.mipaquete_status,
      actualDelivery: ship.actual_delivery,
    }))

    // Calcular resumen/KPIs
    const resumen = {
      enCurso: formattedShipments.filter((s: any) =>
        ['En tránsito', 'Despachado'].includes(s.estado)
      ).length,

      entregados: formattedShipments.filter((s: any) =>
        s.estado === 'Entregado'
      ).length,

      retrasos: formattedShipments.filter((s: any) =>
        s.estado === 'Retrasado'
      ).length,

      devoluciones: formattedShipments.filter((s: any) =>
        s.estado === 'Devolución'
      ).length,

      // Calcular promedio de días de entrega
      promDias: calculateAverageDeliveryDays(formattedShipments),

      // Calcular porcentaje de entregas a tiempo
      aTiempoPct: calculateOnTimePercentage(formattedShipments),
    }

    return NextResponse.json({
      ok: true,
      shipments: formattedShipments,
      resumen,
      total: formattedShipments.length
    })

  } catch (error: any) {
    console.error('[Shipments API] Exception:', error)
    return NextResponse.json({
      ok: false,
      shipments: [],
      error: error.message
    }, { status: 500 })
  }
}

// Mapear status de DB a español para el frontend
function mapStatus(dbStatus: string): string {
  const map: Record<string, string> = {
    'pending': 'Pendiente',
    'dispatched': 'Despachado',
    'in_transit': 'En tránsito',
    'delivered': 'Entregado',
    'returned': 'Devolución',
    'delayed': 'Retrasado'
  }
  return map[dbStatus] || 'Pendiente'
}

// Calcular tiempo relativo (hace X horas/días)
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `hace ${diffMins} min`
  } else if (diffHours < 24) {
    return `hace ${diffHours} h`
  } else {
    return `hace ${diffDays} d`
  }
}

// Calcular promedio de días de entrega
function calculateAverageDeliveryDays(shipments: any[]): number {
  const delivered = shipments.filter((s: any) =>
    s.actualDelivery && s.despacho !== 'Pendiente'
  )

  if (delivered.length === 0) return 0

  const totalDays = delivered.reduce((sum: number, ship: any) => {
    const dispatch = new Date(ship.despacho)
    const delivery = new Date(ship.actualDelivery)
    const days = Math.floor((delivery.getTime() - dispatch.getTime()) / 86400000)
    return sum + days
  }, 0)

  return Number((totalDays / delivered.length).toFixed(1))
}

// Calcular porcentaje de entregas a tiempo
function calculateOnTimePercentage(shipments: any[]): number {
  const delivered = shipments.filter((s: any) => s.estado === 'Entregado')

  if (delivered.length === 0) return 100

  const onTime = delivered.filter((s: any) => {
    if (!s.actualDelivery || !s.eta || s.eta === 'N/A') return true
    const delivery = new Date(s.actualDelivery)
    const eta = new Date(s.eta)
    return delivery <= eta
  })

  return Math.round((onTime.length / delivered.length) * 100)
}

