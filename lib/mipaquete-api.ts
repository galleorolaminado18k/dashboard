/**
 * Cliente para la API de MiPaquete
 * Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const MIPAQUETE_API_URL = "https://api.mipaquete.com/v1"
const MIPAQUETE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzExOWRjNDMzNjk2M2YzMzBlYjFjZTYiLCJuYW1lIjoiQ29tZXJjaWFsaXphZG9yYSIsInN1cm5hbWUiOiJnYWxlMThrIiwiZW1haWwiOiJnYWxsZW9yb2xhbWluYWRvMThrQGdtYWlsLmNvbSIsImNlbGxQaG9uZSI6IjMwMTY4NDUwMjYiLCJjcmVhdGVkQXQiOiIyMDI0LTEwLTE3VDIzOjI5OjA4LjAxNFoiLCJkYXRlIjoiMjAyNS0wOC0xOSAxMDoyMDoyNCIsImlhdCI6MTc1NTYxNjgyNH0.LHBLIsBCQlNM6WlnB514dN00dR7LcPjIQcYt1B62hEA"
const SESSION_TRACKER = "a0c96ea6-b22d-4fb7-a278-850678d5429c"

export interface MiPaqueteEstado {
  guia: string
  estado: string // "En tránsito", "Entregado", "Devuelto", "Novedad", etc.
  fecha_actualizacion: string
  ciudad_actual?: string
  observaciones?: string
}

/**
 * Obtiene el estado actual de una guía de MiPaquete
 */
export async function obtenerEstadoGuia(numeroGuia: string): Promise<MiPaqueteEstado | null> {
  try {
    console.log(`[MiPaquete] Consultando estado de guía: ${numeroGuia}`)

    const response = await fetch(`${MIPAQUETE_API_URL}/tracking/${numeroGuia}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MIPAQUETE_TOKEN}`,
        "Content-Type": "application/json",
        "X-Session-Tracker": SESSION_TRACKER
      }
    })

    if (!response.ok) {
      console.error(`[MiPaquete] Error ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    console.log(`[MiPaquete] Estado obtenido:`, data)

    return {
      guia: numeroGuia,
      estado: data.estado || data.status || "Desconocido",
      fecha_actualizacion: data.fecha_actualizacion || data.updated_at || new Date().toISOString(),
      ciudad_actual: data.ciudad_actual || data.current_city,
      observaciones: data.observaciones || data.notes
    }
  } catch (error) {
    console.error(`[MiPaquete] Error consultando guía ${numeroGuia}:`, error)
    return null
  }
}

/**
 * Obtiene el estado de múltiples guías
 */
export async function obtenerEstadosMultiples(guias: string[]): Promise<Map<string, MiPaqueteEstado>> {
  const resultados = new Map<string, MiPaqueteEstado>()

  // Consultar en paralelo con límite de 5 peticiones simultáneas
  const chunks = []
  for (let i = 0; i < guias.length; i += 5) {
    chunks.push(guias.slice(i, i + 5))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(guia => obtenerEstadoGuia(guia))
    const resultados_chunk = await Promise.all(promises)

    resultados_chunk.forEach((estado, index) => {
      if (estado) {
        resultados.set(chunk[index], estado)
      }
    })
  }

  return resultados
}

/**
 * Mapea el estado de MiPaquete a nuestro sistema
 */
export function mapearEstadoMiPaquete(estadoMiPaquete: string): {
  estadoFactura: string
  estadoCRM: string
  esVentaExitosa: boolean
  esDevolucion: boolean
} {
  const estadoLower = estadoMiPaquete.toLowerCase()

  // Entregado exitosamente
  if (estadoLower.includes("entregado") || estadoLower.includes("entrega exitosa")) {
    return {
      estadoFactura: "Pagado",
      estadoCRM: "pedido-completo",
      esVentaExitosa: true,
      esDevolucion: false
    }
  }

  // Devuelto
  if (estadoLower.includes("devuelto") || estadoLower.includes("devolucion") || estadoLower.includes("rechazado")) {
    return {
      estadoFactura: "Devuelto",
      estadoCRM: "devolucion",
      esVentaExitosa: false,
      esDevolucion: true
    }
  }

  // En tránsito
  if (estadoLower.includes("transito") || estadoLower.includes("en ruta") || estadoLower.includes("despachado")) {
    return {
      estadoFactura: "Pendiente Pago",
      estadoCRM: "pendiente-guia",
      esVentaExitosa: false,
      esDevolucion: false
    }
  }

  // Por defecto: pendiente
  return {
    estadoFactura: "Pendiente Pago",
    estadoCRM: "pendiente-guia",
    esVentaExitosa: false,
    esDevolucion: false
  }
}

