// lib/ventasStore.ts
export type MetodoPago = "Efectivo" | "Transferencia" | "Contraentrega"
export type EstadoPago = "Pagado" | "Pendiente Pago"

export type Venta = {
  id: string // VT-001
  cliente: string
  fecha: string // YYYY-MM-DD
  producto: string
  total: number // en COP
  estado: EstadoPago
  metodo: MetodoPago
  transportadora: string
  guia: string
  evidenciaUrl?: string // link/archivo
  vendedor: string
  factura?: string // FAC-2025-0001
}

let ventas: Venta[] = [
  {
    id: "VT-002",
    cliente: "Carlos Rodríguez",
    fecha: "2025-01-07",
    producto: "Anillo de Plata",
    total: 125000,
    estado: "Pendiente Pago",
    metodo: "Efectivo",
    transportadora: "Coordinadora",
    guia: "1714816",
    evidenciaUrl: undefined,
    vendedor: "Ana López",
    factura: "FAC-2025-0002",
  },
  {
    id: "VT-001",
    cliente: "María González",
    fecha: "2025-01-07",
    producto: "Balín de Oro 18k",
    total: 285000,
    estado: "Pendiente Pago",
    metodo: "Transferencia",
    transportadora: "Servientrega",
    guia: "1714815",
    evidenciaUrl: undefined,
    vendedor: "Juan Pérez",
    factura: "FAC-2025-0001",
  },
  {
    id: "VT-004",
    cliente: "Pedro Sánchez",
    fecha: "2025-01-06",
    producto: "Aretes de Oro",
    total: 320000,
    estado: "Pendiente Pago",
    metodo: "Transferencia",
    transportadora: "Servientrega",
    guia: "1714818",
    evidenciaUrl: undefined,
    vendedor: "Ana López",
    factura: undefined,
  },
  {
    id: "VT-003",
    cliente: "Laura Martínez",
    fecha: "2025-01-06",
    producto: "Balín Premium",
    total: 450000,
    estado: "Pendiente Pago",
    metodo: "Contraentrega",
    transportadora: "SERVIENTREGA",
    guia: "1714817",
    evidenciaUrl: undefined,
    vendedor: "Juan Pérez",
    factura: undefined,
  },
  {
    id: "VT-006",
    cliente: "Diego Torres",
    fecha: "2025-01-05",
    producto: "Pulsera de Oro",
    total: 280000,
    estado: "Pendiente Pago",
    metodo: "Contraentrega",
    transportadora: "ENVIA",
    guia: "1714829",
    evidenciaUrl: undefined,
    vendedor: "Ana López",
    factura: undefined,
  },
  {
    id: "VT-005",
    cliente: "Sofía Ramírez",
    fecha: "2025-01-05",
    producto: "Cadena de Plata",
    total: 190000,
    estado: "Pendiente Pago",
    metodo: "Efectivo",
    transportadora: "Coordinadora",
    guia: "1714819",
    evidenciaUrl: undefined,
    vendedor: "Juan Pérez",
    factura: undefined,
  },
  {
    id: "VT-007",
    cliente: "Valentina Cruz",
    fecha: "2025-01-04",
    producto: "Anillo de Compromiso",
    total: 850000,
    estado: "Pendiente Pago",
    metodo: "Transferencia",
    transportadora: "Servientrega",
    guia: "1714821",
    evidenciaUrl: undefined,
    vendedor: "Juan Pérez",
    factura: undefined,
  },
]

export function listVentas() {
  return ventas
}

export function replaceEvidence(ventaId: string, url: string) {
  ventas = ventas.map((v) => (v.id === ventaId ? { ...v, evidenciaUrl: url } : v))
  return ventas.find((v) => v.id === ventaId)
}

/** Sincroniza un cambio que viene desde Facturación */
export function applyFacturaUpdate(input: {
  factura: string // FAC-2025-0001
  estadoPago: EstadoPago // "Pagado" | "Pendiente Pago"
  metodo?: MetodoPago // opcional si cambia
  evidenciaUrl?: string // opcional
}) {
  ventas = ventas.map((v) =>
    v.factura === input.factura
      ? {
          ...v,
          estado: input.estadoPago,
          metodo: input.metodo ?? v.metodo,
          evidenciaUrl: input.evidenciaUrl ?? v.evidenciaUrl,
        }
      : v,
  )
  return ventas
}
