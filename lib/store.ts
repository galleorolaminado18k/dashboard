export type MetodoPago = "Efectivo" | "Transferencia" | "Contraentrega"
export type EstadoFactura = "Pagado" | "Pendiente Pago" | "Devuelto"
export type EstadoEnvio = "Despachado" | "En tránsito" | "Entregado" | "Devuelto" | "Retrasado"

export type ItemFactura = {
  ref: string
  descripcion: string
  und: number
  ivaPct: number
  precioBase: number
  precioNeto: number
}

export type Factura = {
  numero: string
  cliente: {
    nombre: string
    nit?: string
    ciudad?: string
    barrio?: string
    direccion?: string
    telefono?: string
    email?: string
    asesor?: string
  }
  guia: string
  transportadora: string
  ciudad?: string
  emision: string
  vencimiento: string
  subtotal: number
  iva: number
  total: number
  estado: EstadoFactura
  metodo: MetodoPago
  items: ItemFactura[]
  createdAt: string
}

export type Venta = {
  id: string
  factura: string
  cliente: string
  ciudad?: string
  producto: string
  total: number
  metodo: MetodoPago
  estado: EstadoFactura
  transportadora: string
  guia: string
  envio: EstadoEnvio
  vendedor?: string
  createdAt: string
}

export type Pago = {
  id: string
  pedido: string
  cliente: string
  metodo: MetodoPago
  subMetodo?: string
  estado: "Pagado" | "Pendiente"
  monto: number
  fecha: string
}

export type Devolucion = {
  id: string
  factura: string
  motivo?: string
  total: number
  fecha: string
}

export type ClienteRow = {
  id: string
  nombre: string
  email?: string
  ciudad?: string
  asesor?: string
  frecuencia: number
  acumulado: number
  ultimaCompra?: string
  segmento?: "Mayorista Joyería" | "Baliniería" | "Detal" | "Prospecto"
}

/** —— CRM por teléfono —— */
export type CRMPurchase = {
  fecha: string
  descripcion: string
  total: number
  numeroFactura: string
}

export type CRMContact = {
  phone: string
  nombre?: string
  canal?: "WhatsApp" | "Instagram" | "Facebook" | "Web" | "Otro"
  etiquetas?: string[]
  historial: CRMPurchase[]
}

type Store = {
  facturas: Factura[]
  ventas: Venta[]
  pagos: Pago[]
  devoluciones: Devolucion[]
  clientes: ClienteRow[]
  crm: CRMContact[]
}

const store: Store = {
  facturas: [],
  ventas: [],
  pagos: [],
  devoluciones: [],
  clientes: [],
  crm: [],
}

function next(prefix: string, list: { id?: string; numero?: string }[], field: "id" | "numero" = "id") {
  const nums = list
    .map((x) => (x[field] ?? "").toString())
    .filter((s) => s.startsWith(prefix))
    .map((s) => Number((s.match(/\d+$/) ?? ["0"])[0]))
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(n).padStart(3, "0")}`
}

/** ——— CLIENTES (seguimiento) ——— */
function upsertClienteFromFactura(f: Factura) {
  let c = store.clientes.find((x) => x.nombre === f.cliente.nombre)
  if (!c) {
    c = {
      id: next("CLI-", store.clientes),
      nombre: f.cliente.nombre,
      email: f.cliente.email,
      ciudad: f.cliente.ciudad,
      asesor: f.cliente.asesor,
      frecuencia: 0,
      acumulado: 0,
      ultimaCompra: undefined,
      segmento: "Prospecto",
    }
    store.clientes.push(c)
  }
  c.frecuencia += 1
  c.acumulado += f.total
  c.ultimaCompra = f.emision
  c.ciudad = f.cliente.ciudad ?? c.ciudad
  c.asesor = f.cliente.asesor ?? c.asesor
  if (c.acumulado > 50_000_000) c.segmento = "Mayorista Joyería"
}

/** ——— CRM (historial por teléfono) ——— */
function upsertCRMFromFactura(f: Factura) {
  const tel = (f.cliente.telefono ?? "").replace(/\D/g, "")
  if (!tel) return // si no hay teléfono, no se puede mapear al CRM

  let c = store.crm.find((x) => x.phone === tel)
  if (!c) {
    c = {
      phone: tel,
      nombre: f.cliente.nombre,
      canal: "WhatsApp",
      etiquetas: [],
      historial: [],
    }
    store.crm.push(c)
  } else if (!c.nombre && f.cliente.nombre) {
    c.nombre = f.cliente.nombre
  }
  c.historial.unshift({
    fecha: f.emision,
    descripcion:
      f.items.length > 1 ? `${f.items[0].descripcion} +${f.items.length - 1}` : (f.items[0]?.descripcion ?? "Compra"),
    total: f.total,
    numeroFactura: f.numero,
  })
}

/** ——— CREAR FACTURA -> VENTA, PAGO, CLIENTE, CRM ——— */
export function createFactura(input: Omit<Factura, "createdAt">) {
  const factura: Factura = { ...input, createdAt: new Date().toISOString() }
  store.facturas.push(factura)

  const ventaId = next("VT-", store.ventas, "id")
  const producto = input.items[0]?.descripcion ?? (input.items.length > 1 ? "Varios items" : "Producto")
  const venta: Venta = {
    id: ventaId,
    factura: input.numero,
    cliente: input.cliente.nombre,
    ciudad: input.cliente.ciudad,
    producto,
    total: input.total,
    metodo: input.metodo,
    estado: input.estado,
    transportadora: input.transportadora,
    guia: input.guia,
    envio: "Despachado",
    createdAt: new Date().toISOString(),
  }
  store.ventas.push(venta)

  const pago: Pago = {
    id: next("PAY-", store.pagos),
    pedido: input.numero,
    cliente: input.cliente.nombre,
    metodo: input.metodo,
    estado: input.estado === "Pagado" ? "Pagado" : "Pendiente",
    monto: input.total,
    fecha: input.emision,
  }
  store.pagos.push(pago)

  upsertClienteFromFactura(factura)
  upsertCRMFromFactura(factura)

  return { factura, venta, pago }
}

/** ——— UPDATE ESTADO ——— */
export function updateFacturaEstado(numero: string, estado: EstadoFactura, metodo?: MetodoPago) {
  store.facturas = store.facturas.map((f) => (f.numero === numero ? { ...f, estado, metodo: metodo ?? f.metodo } : f))
  store.ventas = store.ventas.map((v) => (v.factura === numero ? { ...v, estado, metodo: metodo ?? v.metodo } : v))
  store.pagos = store.pagos.map((p) =>
    p.pedido === numero
      ? {
          ...p,
          estado: estado === "Pagado" ? "Pagado" : "Pendiente",
          metodo: metodo ?? p.metodo,
        }
      : p,
  )
}

/** ——— DEVOLUCIÓN ——— */
export function marcarVentaDevueltaPorFactura(numero: string, motivo?: string) {
  const fac = store.facturas.find((f) => f.numero === numero)
  if (!fac) return
  const dev: Devolucion = {
    id: next("DEV-", store.devoluciones),
    factura: numero,
    motivo,
    total: fac.total,
    fecha: new Date().toISOString().slice(0, 10),
  }
  store.devoluciones.push(dev)
  updateFacturaEstado(numero, "Devuelto")
  store.ventas = store.ventas.filter((v) => v.factura !== numero)
}

/** ——— ENVÍOS ——— */
export function updateEnvioPorGuia(guia: string, estado: EstadoEnvio) {
  store.ventas = store.ventas.map((v) => (v.guia === guia ? { ...v, envio: estado } : v))
}

/** ——— SELECTS ——— */
export const DB = {
  get: () => store,
  getVentas: () => store.ventas,
  getFacturas: () => store.facturas,
  getPagos: () => store.pagos,
  getDevols: () => store.devoluciones,
  getClientes: () => store.clientes,
  getCRMByPhone: (phone: string) => store.crm.find((c) => c.phone === phone.replace(/\D/g, "")),
}
