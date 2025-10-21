// =====================================================
// Sistema de Estados CRM - Karla García (Galle Oro Laminado 18K)
// =====================================================
// Gestión automática de estados basada en el flujo de ventas

export type EstadoConversacion = 
  | 'por-contestar'        // 1. Cliente escribió, esperando respuesta inicial
  | 'pendiente-datos'      // 2. Mostró interés, faltan datos completos
  | 'por-confirmar'        // 3. Tiene todos los datos, esperando confirmación
  | 'pendiente-guia'       // 4. Pedido confirmado, esperando guía de envío
  | 'pedido-completo'      // 5. Guía enviada, pedido en tránsito/completado

// Detectores de intención basados en el prompt de Karla
export const DETECTORES_ESTADO = {
  
  // Palabras que indican confirmación de pedido (lenguaje natural colombiano)
  CONFIRMACION: /\b(s[ií]|si|dale|perfecto|listo|confirm(o|a|ado)?|de una|h[áa]gale|vamos|ok(ay)?|va|claro|exacto|correcto|así es|eso|sale|bien|bueno|✅|👍|👌|✔️|seguimos|adelante|venga)\b/i,
  
  // Palabras que indican interés en producto (más variaciones)
  INTERES_PRODUCTO: /\b(quiero|me interesa|me gusta|cuánto|cu[áa]nto|precio|cuesta|valor|catálogo|catalogo|ver|mostrar|balinería|baliner[íi]a|joyería|joyer[íi]a|aretes|arete|collar|pulsera|cadena|anillo|conjunto|disponible|hay|envían|envian|despachan|mandan|entregan|llega|demora|cu[áa]nto tarda)\b/i,
  
  // Detecta si tiene datos completos (nombre + ciudad + dirección + teléfono + documento + correo)
  DATOS_COMPLETOS: (mensaje: string) => {
    const tieneNombre = /nombre[:\s]*([a-záéíóúñ\s]{3,})/i.test(mensaje)
    const tieneCiudad = /ciudad[:\s]*([a-záéíóúñ\s]{3,})/i.test(mensaje)
    const tieneDireccion = /(dirección|direccion|calle|carrera|avenida|av|cr|cl)[:\s#]*\d/i.test(mensaje)
    const tieneTelefono = /\b3\d{9}\b/.test(mensaje.replace(/[\s\-()]/g, ''))
    const tieneDocumento = /(cc|cédula|cedula|documento)[:\s]*\d{7,}/i.test(mensaje)
    const tieneCorreo = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(mensaje)
    
    return tieneNombre && tieneCiudad && tieneDireccion && tieneTelefono && tieneDocumento && tieneCorreo
  },
  
  // Detecta si proporcionó el barrio (CRÍTICO según el prompt - más variaciones)
  TIENE_BARRIO: /\b(barrio|brio|b\/|sector|urbanización|urb\.|urbanizaci[óo]n|conjunto|residencial|torre|edificio|casa|calle|carrera|kr|cl|diagonal|transversal|vereda|etapa|manzana|apartamento|apto|piso|bloque|interior|local|ofic|corregimiento)\b/i,
  
  // Detecta método de pago elegido (más variaciones)
  METODO_PAGO: /(transferencia|transferir|consignar|consignación|consignacion|anticipado|adelantado|pago ya|contraentrega|contra entrega|pago contra|efectivo|nequi|daviplata|bancolombia)\b/i,
  
  // Detecta que quiere hablar con un asesor (más variaciones)
  SOLICITA_ASESOR: /\b(asesor|asesora|persona|hablar con alguien|atención|atenci[óo]n|quien atiende|alguien|ayuda|necesito ayuda|me pueden ayudar|representante|vendedor|vendedora)\b/i,
  
  // Detecta temas de garantía/problemas (más variaciones)
  SOLICITA_GARANTIA: /\b(garantía|garant[íi]a|cambio|devoluci[óo]n|reclamo|queja|problema|pelado|dañ(o|ado)|roto|defecto|malo|mala calidad|no sirve|no funciona|no me gusta|no es lo que|esperaba otro)\b/i,
}

// Analizador de estado automático
export function analizarEstadoConversacion(mensajes: Array<{ sender: string; content: string }>): EstadoConversacion {
  
  if (mensajes.length === 0) {
    return 'por-contestar'
  }
  
  const ultimosMensajes = mensajes.slice(-10) // Analizar últimos 10 mensajes
  const mensajesCliente = ultimosMensajes.filter(m => m.sender === 'client')
  const mensajesAgente = ultimosMensajes.filter(m => m.sender === 'agent')
  
  // Si no hay respuesta del agente, está por contestar
  if (mensajesAgente.length === 0) {
    return 'por-contestar'
  }
  
  // Analizar último mensaje del cliente
  const ultimoMensajeCliente = mensajesCliente[mensajesCliente.length - 1]?.content || ''
  const todosLosMensajesCliente = mensajesCliente.map(m => m.content).join(' ')
  
  // 5. PEDIDO COMPLETO - Si el agente ya envió guía o confirmó despacho
  const agenteEnvioGuia = mensajesAgente.some(m => 
    /\b(guía|numero de guía|código de rastreo|despachado|en camino)\b/i.test(m.content)
  )
  if (agenteEnvioGuia) {
    return 'pedido-completo'
  }
  
  // 4. PENDIENTE GUÍA - Cliente confirmó y dio todos los datos
  const clienteConfirmo = DETECTORES_ESTADO.CONFIRMACION.test(ultimoMensajeCliente)
  const tieneDatosCompletos = DETECTORES_ESTADO.DATOS_COMPLETOS(todosLosMensajesCliente)
  const tieneBarrio = DETECTORES_ESTADO.TIENE_BARRIO.test(todosLosMensajesCliente)
  const tieneMetodoPago = DETECTORES_ESTADO.METODO_PAGO.test(todosLosMensajesCliente)
  
  if (clienteConfirmo && tieneDatosCompletos && tieneBarrio && tieneMetodoPago) {
    return 'pendiente-guia'
  }
  
  // 3. POR CONFIRMAR - Tiene todos los datos, esperando confirmación final
  if (tieneDatosCompletos && tieneBarrio && tieneMetodoPago) {
    return 'por-confirmar'
  }
  
  // 2. PENDIENTE DATOS - Mostró interés pero faltan datos
  const muestroInteres = DETECTORES_ESTADO.INTERES_PRODUCTO.test(ultimoMensajeCliente)
  const agentePidioDatos = mensajesAgente.some(m => 
    /\b(nombre completo|ciudad|dirección|celular|documento|correo|método de pago)\b/i.test(m.content)
  )
  
  if (muestroInteres || agentePidioDatos) {
    return 'pendiente-datos'
  }
  
  // 1. POR CONTESTAR - Estado por defecto
  return 'por-contestar'
}

// Función para actualizar estado automáticamente
export function debeActualizarEstado(
  estadoActual: EstadoConversacion,
  mensajes: Array<{ sender: string; content: string }>
): { debeActualizar: boolean; nuevoEstado: EstadoConversacion } {
  
  const estadoDetectado = analizarEstadoConversacion(mensajes)
  
  // Mapeo de progresión lógica de estados
  const PROGRESION_VALIDA: Record<EstadoConversacion, EstadoConversacion[]> = {
    'por-contestar': ['pendiente-datos', 'por-confirmar', 'pendiente-guia', 'pedido-completo'],
    'pendiente-datos': ['por-confirmar', 'pendiente-guia', 'pedido-completo'],
    'por-confirmar': ['pendiente-guia', 'pedido-completo'],
    'pendiente-guia': ['pedido-completo'],
    'pedido-completo': [], // Estado final
  }
  
  // Solo actualizar si es una progresión válida
  const puedeProgresar = PROGRESION_VALIDA[estadoActual].includes(estadoDetectado)
  
  return {
    debeActualizar: puedeActualizar && estadoActual !== estadoDetectado,
    nuevoEstado: estadoDetectado
  }
}

// Extractor de datos del cliente (para autocompletado)
export function extraerDatosCliente(mensajes: Array<{ sender: string; content: string }>) {
  const todosLosMensajes = mensajes
    .filter(m => m.sender === 'client')
    .map(m => m.content)
    .join('\n')
  
  // Extraer nombre (más patrones)
  const nombreMatch = todosLosMensajes.match(/(?:nombre[:\s]+|me llamo[:\s]+|soy[:\s]+|mi nombre es[:\s]+)([a-záéíóúñ\s]{3,})/i)
  const nombre = nombreMatch ? nombreMatch[1].trim() : null
  
  // Extraer ciudad (más ciudades colombianas)
  const ciudadMatch = todosLosMensajes.match(/(?:ciudad[:\s]+|de[:\s]+|en[:\s]+|desde[:\s]+|vivo en[:\s]+)(bogotá|bogota|medellín|medellin|cali|barranquilla|cartagena|bucaramanga|pereira|cúcuta|cucuta|manizales|ibagué|ibague|pasto|montería|monteria|valledupar|villavicencio|armenia|soacha|santa marta|bello|soledad|buenaventura|[a-záéíóúñ\s]{3,})/i)
  const ciudad = ciudadMatch ? ciudadMatch[1].trim() : null
  
  // Extraer teléfono (más formatos colombianos)
  const telefonoMatch = todosLosMensajes.replace(/[\s\-()]/g, '').match(/\b(3\d{9})\b/)
  const telefono = telefonoMatch ? telefonoMatch[1] : null
  
  // Extraer correo
  const correoMatch = todosLosMensajes.match(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i)
  const correo = correoMatch ? correoMatch[1] : null
  
  // Extraer dirección (más formatos)
  const direccionMatch = todosLosMensajes.match(/(?:dirección|direccion|direcci[óo]n|dir|donde vivo|mi direcci[óo]n)[:\s]+([^\n]{10,})/i)
  const direccion = direccionMatch ? direccionMatch[1].trim() : null
  
  // Extraer documento (más formatos)
  const documentoMatch = todosLosMensajes.match(/(?:cc|cédula|cedula|c[ée]dula|documento|identificaci[óo]n)[:\s]+(\d{7,})/i)
  const documento = documentoMatch ? documentoMatch[1] : null
  
  // Extraer barrio (más patrones)
  const barrioMatch = todosLosMensajes.match(/(?:barrio|brio|b\/|sector|conjunto|residencial|urbanizaci[óo]n|urb\.?)[:\s]+([a-záéíóúñ0-9\s]{3,})/i)
  const barrio = barrioMatch ? barrioMatch[1].trim() : null
  
  // Detectar método de pago (más variaciones)
  let metodoPago: 'anticipado' | 'contraentrega' | null = null
  if (/\b(transferencia|transferir|consignar|consignación|anticipado|adelantado|pago ya|nequi|daviplata)\b/i.test(todosLosMensajes)) {
    metodoPago = 'anticipado'
  } else if (/\b(contraentrega|contra entrega|pago contra|efectivo al recibir)\b/i.test(todosLosMensajes)) {
    metodoPago = 'contraentrega'
  }
  
  return {
    nombre,
    ciudad,
    telefono,
    correo,
    direccion,
    documento,
    barrio,
    metodoPago,
    datosCompletos: !!(nombre && ciudad && telefono && correo && direccion && documento && barrio)
  }
}

// Sugerencias para el agente según el estado
export function obtenerSugerenciasAgente(estado: EstadoConversacion): string[] {
  const sugerencias: Record<EstadoConversacion, string[]> = {
    'por-contestar': [
      '¡Buenos [días/tardes/noches]! 👋 Soy Karla García de Galle Oro Laminado 18K',
      '¿Te gustaría ver Balinería Premium 💎 o Joyería Exclusiva 💍?',
      '¿Es tu primera vez con nosotros? 😊'
    ],
    'pendiente-datos': [
      'Para alistar tu pedido, necesito: Nombre, Ciudad, Dirección + barrio, Celular, Documento, Correo y Método de pago',
      '¿Cuál es tu dirección completa con barrio? 🏘️',
      '¿Prefieres pago anticipado 💳 o contraentrega 📦?'
    ],
    'por-confirmar': [
      '¿Confirmas para despacho HOY? ✅',
      'Resumen: [Producto] $[Total]. ¿Lo aseguramos ya? 💫',
      '¿Aprovechamos el descuento del pago anticipado? 🎯'
    ],
    'pendiente-guia': [
      '¡Pedido confirmado! Estamos preparando tu envío 📦',
      'Te envío la guía de envío en los próximos minutos ⏰',
      'Tu pedido saldrá HOY mismo ✨'
    ],
    'pedido-completo': [
      '¡Tu pedido está en camino! 🚚',
      'Guía de rastreo: [Número]',
      '¿Alguna pregunta sobre tu pedido? 😊'
    ]
  }
  
  return sugerencias[estado]
}

// Estadísticas de conversión por estado
export function calcularMetricasEstado(conversaciones: Array<{ status: EstadoConversacion }>) {
  const total = conversaciones.length
  const porEstado = conversaciones.reduce((acc, conv) => {
    acc[conv.status] = (acc[conv.status] || 0) + 1
    return acc
  }, {} as Record<EstadoConversacion, number>)
  
  const tasaConversion = total > 0 
    ? ((porEstado['pedido-completo'] || 0) / total * 100).toFixed(1)
    : '0.0'
  
  return {
    total,
    porEstado,
    tasaConversion: `${tasaConversion}%`,
    embudoConversion: {
      inicial: porEstado['por-contestar'] || 0,
      interesados: (porEstado['pendiente-datos'] || 0) + (porEstado['por-confirmar'] || 0),
      confirmados: porEstado['pendiente-guia'] || 0,
      completados: porEstado['pedido-completo'] || 0,
    }
  }
}
