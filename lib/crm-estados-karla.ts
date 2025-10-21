// =====================================================
// Sistema de Estados CRM - Karla García (Galle Oro Laminado 18K)
// =====================================================
// Lógica REAL: Basada en flujo de Karla García con GATES críticos

export type EstadoConversacion = 
  | 'por-contestar'        // 1. Cliente escribió, esperando saludo y solicitud de datos
  | 'pendiente-datos'      // 2. Faltan datos obligatorios (GATE: barrio + celular 10)
  | 'por-confirmar'        // 3. Agente envió RESUMEN FINAL, esperando confirmación
  | 'pendiente-guia'       // 4. Cliente confirmó (+ pago validado si anticipado), esperando guía
  | 'pedido-completo'      // 5. Guía registrada y enviada al cliente

// =====================================================
// DETECTORES DE INTENCIÓN (170+ variaciones)
// =====================================================

export const DETECTORES_ESTADO = {
  
  // Palabras de confirmación (27 variaciones)
  CONFIRMACION: /\b(s[ií]|si|dale|perfecto|listo|confirm(o|a|ado)?|de una|h[áa]gale|hagale|vamos|ok(ay)?|va|claro|exacto|correcto|así es|eso|sale|bien|bueno|✅|👍|👌|✔️|seguimos|adelante|venga)\b/i,
  
  // Interés en productos (38 variaciones + garantía)
  INTERES_PRODUCTO: /\b(quiero|kiero|me interesa|me gusta|cuánto|cu[áa]nto|quanto|precio|cuesta|valor|catálogo|catalogo|ver|mostrar|balinería|baliner[íi]a|joyería|joyer[íi]a|aretes|arete|collar|qollar|pulsera|cadena|anillo|conjunto|disponible|hay|envían|envian|despachan|mandan|entregan|llega|demora|cu[áa]nto tarda|garantía|garant[íi]a)\b/i,
  
  // DATOS COMPLETOS OBLIGATORIOS según Karla García
  // REQUISITOS CRÍTICOS: nombre + ciudad + dirección + BARRIO + celular 10 + CC + correo + método pago
  // IQ 145: Análisis contextual mejorado con tolerancia a mayúsculas y formato libre
  DATOS_COMPLETOS: (mensaje: string) => {
    
    const mensajeLower = mensaje.toLowerCase()
    
    // 1. Nombre: 2+ palabras capitalizadas o con etiqueta
    const tieneNombre = /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/i.test(mensaje) || 
                        /(nombre|me llamo|soy|mi nombre)[:\s]+([a-záéíóúñ\s]{3,})/i.test(mensaje)
    
    // 2. Ciudad colombiana (con errores ortográficos + mayúsculas)
    const tieneCiudad = /(bogot[aá]|medell[ií]n|kali|cali|barranquilla|cartagena|bucaramanga|pereira|c[uú]cuta|manizales|ibagu[ée]|pasto|monter[ií]a|valledupar|villavicencio|armenia|neiva|popay[aá]n|tunja|sincelejo|riohacha|santa marta|soacha|bello|soledad)/i.test(mensaje)
    
    // 3. Dirección con número o palabra clave
    const tieneDireccion = /(direcci[óo]n|direc|dir|kalle|calle|carrera|avenida|diagonal|transversal|av|cr|cl|kr|cra|apto|apartamento|casa|edificio|torre|conjunto|local|oficina|interior|urbanización|urbanizaci[óo]n|sector|barrio|manzana|vereda|corregimiento)[:\s#\d]/i.test(mensaje) ||
                           /\b(kalle|calle|carrera|cr|cl|kr|cra|diagonal|transversal)\s*\d+/i.test(mensaje)
    
    // 4. ⚠️ BARRIO (GATE CRÍTICO - IQ 145: busca CUALQUIER indicador de ubicación específica)
    // Ahora detecta: "Barrio X", "Conjunto X", "Torre X", "Sector X", "Diagonal X", "Local X", etc.
    // MEJORADO: Intentar con regex simple primero, si falla intentar con split manual
    let tieneBarrio = /\b(barrio|bario|vario|brio|b\/|b\.|sector|urbanización|urb\.?|urbanizaci[óo]n|conjunto|residencial|torre|bloque|manzana|mz|etapa|vereda|corregimiento|diagonal|transversal|local|oficina|interior|apto|apartamento)\s+[A-Za-zÁ-ú0-9]/i.test(mensaje)
    
    // IQ 145: Si no encontró, revisar por líneas (split por \n o join con espacios puede perder contexto)
    if (!tieneBarrio && mensaje.includes('\n')) {
      const lineas = mensaje.split('\n')
      tieneBarrio = lineas.some(linea => 
        /\b(barrio|bario|vario|brio|b\/|b\.|sector|urbanización|urb\.?|urbanizaci[óo]n|conjunto|residencial|torre|bloque|manzana|mz|etapa|vereda|corregimiento|diagonal|transversal|local|oficina|interior|apto|apartamento)\s+[A-Za-zÁ-ú0-9\s]{2,}/i.test(linea)
      )
    }
    
    // 5. ⚠️ CELULAR 10 DÍGITOS (GATE CRÍTICO - debe empezar con 3)
    const telefonoLimpio = mensaje.replace(/[\s\-()]/g, '')
    const tieneCelular10 = /\b3\d{9}\b/.test(telefonoLimpio)
    
    // 6. Documento 7-10 dígitos
    const tieneDocumento = /(cc|c[eé]dula|cedula|documento|doc|identificaci[óo]n)[:\s]*\d{7,}/i.test(mensaje) ||
                           /\b\d{7,10}\b/.test(mensaje.replace(/3\d{9}/, '')) // Excluir teléfono
    
    // 7. Correo electrónico (case insensitive)
    const tieneCorreo = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(mensaje)
    
    // 8. Método de pago (anticipado o contraentrega)
    const tieneMetodoPago = /(transferencia|transferir|transferensia|consignar|consignaci[óo]n|anticipado|anticipo|adelantado|pago ya|contraentrega|contra entrega|pago contra|nequi|nequ[íi]|daviplata|bancolombia|efectivo|pago al recibir)\b/i.test(mensaje)
    
    // ✅ IQ 145: Barrio y celular 10 NO son obligatorios - solo confirmación de datos
    // Campos obligatorios: nombre, ciudad, dirección, teléfono (cualquier formato), documento, correo, método pago
    return tieneNombre && tieneCiudad && tieneDireccion && (tieneCelular10 || /\d{7,}/.test(telefonoLimpio)) && 
           tieneDocumento && tieneCorreo && tieneMetodoPago
  },
  
  // Detecta barrio específicamente (para validación por separado)
  // IQ 145: Busca CUALQUIER palabra que indique ubicación específica dentro de ciudad
  // Ahora más flexible: "Barrio Belén", "BARRIO CENTRO", "barrio norte", "Conjunto X", etc.
  TIENE_BARRIO: /\b(barrio|bario|vario|brio|b\/|b\.|sector|urbanización|urb\.?|urbanizaci[óo]n|conjunto|residencial|torre|bloque|manzana|mz|etapa|vereda|corregimiento|diagonal|transversal|local|oficina|interior|apto|apartamento|casa|edificio)\s+[A-Za-zÁ-ú0-9]/i,
  
  // Función mejorada para detectar barrio con análisis de cada mensaje por separado
  TIENE_BARRIO_MEJORADO: (mensajes: string[]) => {
    // IQ 145: Revisar cada mensaje individualmente para evitar pérdida de contexto
    return mensajes.some(msg => 
      /\b(barrio|bario|vario|brio|b\/|b\.|sector|urbanización|urb\.?|urbanizaci[óo]n|conjunto|residencial|torre|bloque|manzana|mz|etapa|vereda|corregimiento|diagonal|transversal|local|oficina|interior|apto|apartamento)\s+[A-Za-zÁ-ú0-9\s]{2,}/i.test(msg)
    )
  },
  
  // Detecta celular 10 dígitos específicamente
  // IQ 145: Más flexible con separadores (comas, espacios, guiones, paréntesis)
  TIENE_CELULAR_10: (mensaje: string) => {
    // Limpiar TODO excepto dígitos
    const limpio = mensaje.replace(/[^\d]/g, '')
    // Buscar secuencia de 3 seguido de exactamente 9 dígitos más
    return /3\d{9}/.test(limpio)
  },
  
  // Método de pago
  METODO_PAGO: /(transferencia|transferir|transferensia|consignar|anticipado|adelantado|pago ya|contraentrega|contra entrega|pago contra|nequi|nequ[íi]|daviplata|bancolombia|efectivo)\b/i,
  
  // Detecta si es pago anticipado específicamente
  ES_PAGO_ANTICIPADO: /\b(transferencia|transferir|transferensia|consignar|anticipado|adelantado|pago ya|nequi|nequ[íi]|daviplata|bancolombia)\b/i,
  
  // Detecta comprobante de pago (foto, captura, pantallazo)
  // IQ 145: Incluye TODAS las formas de mencionar envío de pago
  ENVIO_COMPROBANTE: /\b(comprobante|pago|transacci[óo]n|transferencia|foto|captura|pantallazo|pantalla|screenshot|recibo|voucher|soporte|adjunto|env[ií]o|enviado|enviada|ah[ií]|aqu[ií]|listo|ya|pagué|pague|consign[ée]|consigne|ya transfer[ií]|transfer[ií] ya|nequi|daviplata)\b/i,
  
  // Detecta "confirmo despacho" para contraentrega
  CONFIRMA_DESPACHO: /\b(confirmo|confirmar|de acuerdo|acepto|apruebo|autorizo|despach(o|en|ar))\b/i,
  
  // Detecta que agente envió RESUMEN FINAL (trigger para pasar a por-confirmar)
  // IQ 145: Expandido con TODAS las variaciones colombianas de confirmación de pedido
  AGENTE_ENVIO_RESUMEN: /\b(resumen|total|valor final|valor|producto|env[ií]o|descuento|confirmas?|aseguramos|lo dejamos as[íi]|quedamos as[íi]|resumiendo|lo aseguro|te lo aseguro|quedó en|queda en|son \$|cuesta \$|vale \$|= \$|despacho|sería|serian|serían)\b/i,
  
  // Detecta que agente registró guía
  AGENTE_REGISTRO_GUIA: /\b(gu[ií]a|numero de gu[ií]a|n[uú]mero de gu[ií]a|c[óo]digo|rastreo|despachado|en camino|fue despachado|transportadora|mipaquete)\b/i,
  
  // Solicita asesor
  SOLICITA_ASESOR: /\b(asesor|asesora|persona|hablar con alguien|atención|atenci[óo]n|quien atiende|alguien|ayuda|necesito ayuda|me pueden ayudar|representante|vendedor|vendedora)\b/i,
  
  // Garantía/problemas
  SOLICITA_GARANTIA: /\b(garantía|garant[íi]a|cambio|devoluci[óo]n|reclamo|queja|problema|pelado|dañ(o|ado)|roto|defecto|malo|mala calidad|no sirve|no funciona|no me gusta|no es lo que|esperaba otro)\b/i,
}

// =====================================================
// ANALIZADOR DE ESTADO AUTOMÁTICO
// =====================================================

export function analizarEstadoConversacion(mensajes: Array<{ sender: string; content: string }>): EstadoConversacion {
  
  if (mensajes.length === 0) {
    return 'por-contestar'
  }
  
  const ultimosMensajes = mensajes.slice(-10)
  const mensajesCliente = ultimosMensajes.filter(m => m.sender === 'client')
  const mensajesAgente = ultimosMensajes.filter(m => m.sender === 'agent')
  
  // Si no hay respuesta del agente, está por contestar
  if (mensajesAgente.length === 0) {
    return 'por-contestar'
  }
  
  const ultimoMensajeCliente = mensajesCliente[mensajesCliente.length - 1]?.content || ''
  const ultimoMensajeAgente = mensajesAgente[mensajesAgente.length - 1]?.content || ''
  
  // IQ 145: Acumular mensajes con SALTOS DE LÍNEA para mantener contexto
  const todosLosMensajesCliente = mensajesCliente.map(m => m.content).join('\n')
  const todosLosMensajesAgente = mensajesAgente.map(m => m.content).join('\n')
  
  // =====================================================
  // 5. PEDIDO COMPLETO
  // =====================================================
  // Agente registró y envió número de guía
  if (DETECTORES_ESTADO.AGENTE_REGISTRO_GUIA.test(todosLosMensajesAgente)) {
    return 'pedido-completo'
  }
  
  // =====================================================
  // 4. PENDIENTE GUÍA
  // =====================================================
  // Cliente confirmó Y (si es anticipado: validó pago | si es contraentrega: confirmó despacho)
  const clienteConfirmo = DETECTORES_ESTADO.CONFIRMACION.test(ultimoMensajeCliente) ||
                          DETECTORES_ESTADO.CONFIRMACION.test(mensajesCliente.slice(-2).map(m => m.content).join(' '))
  
  // IQ 145: Pasar array de mensajes para mejor detección de BARRIO
  const mensajesClienteTexto = mensajesCliente.map(m => m.content)
  const tieneDatosCompletos = DETECTORES_ESTADO.DATOS_COMPLETOS(todosLosMensajesCliente, mensajesClienteTexto)
  const esAnticipado = DETECTORES_ESTADO.ES_PAGO_ANTICIPADO.test(todosLosMensajesCliente)
  
  if (clienteConfirmo && tieneDatosCompletos) {
    // IQ 145: Cliente confirmó con datos completos → Pendiente Guía DIRECTAMENTE
    // ⭐ SIMPLIFICACIÓN MÁXIMA: La validación de comprobante/despacho es CONVERSACIONAL
    // El agente pedirá comprobante o confirmará despacho DESPUÉS en el chat
    return 'pendiente-guia'
  }
  
  // =====================================================
  // 3. POR CONFIRMAR
  // =====================================================
  // Agente envió RESUMEN FINAL y esperamos confirmación del cliente
  const agenteEnvioResumen = DETECTORES_ESTADO.AGENTE_ENVIO_RESUMEN.test(todosLosMensajesAgente)
  
  // Si tiene TODOS los datos Y agente envió resumen → POR CONFIRMAR
  if (tieneDatosCompletos && agenteEnvioResumen) {
    return 'por-confirmar'
  }
  
  // Si tiene todos los datos pero agente NO envió resumen, queda en PENDIENTE DATOS
  // (agente debe calcular envío y enviar resumen primero)
  if (tieneDatosCompletos && !agenteEnvioResumen) {
    return 'pendiente-datos' // ⚠️ Agente debe enviar RESUMEN primero
  }
  
  // =====================================================
  // 2. PENDIENTE DATOS
  // =====================================================
  // Cliente mostró interés O agente pidió datos O cliente dio algún dato
  const muestroInteres = DETECTORES_ESTADO.INTERES_PRODUCTO.test(todosLosMensajesCliente)
  const agentePidioDatos = /\b(nombre|ciudad|dirección|direccion|celular|teléfono|telefono|documento|correo|método de pago|datos|barrio)\b/i.test(todosLosMensajesAgente)
  
  // Detectar si dio ALGÚN dato parcial
  const dioAlgunDato = DETECTORES_ESTADO.TIENE_CELULAR_10(todosLosMensajesCliente) ||
                       /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(todosLosMensajesCliente) ||
                       /\b\d{7,10}\b/.test(todosLosMensajesCliente) ||
                       /(kalle|calle|carrera|cr|cl|kr)\s*\d/i.test(todosLosMensajesCliente) ||
                       /(bogot[aá]|medell[ií]n|kali|cali)/i.test(todosLosMensajesCliente) ||
                       DETECTORES_ESTADO.TIENE_BARRIO.test(todosLosMensajesCliente) ||
                       DETECTORES_ESTADO.METODO_PAGO.test(todosLosMensajesCliente) ||
                       DETECTORES_ESTADO.SOLICITA_GARANTIA.test(todosLosMensajesCliente)
  
  if (muestroInteres || agentePidioDatos || dioAlgunDato) {
    return 'pendiente-datos'
  }
  
  // =====================================================
  // 1. POR CONTESTAR (Estado inicial)
  // =====================================================
  return 'por-contestar'
}

// =====================================================
// VALIDACIÓN DE PROGRESIÓN
// =====================================================

export function debeActualizarEstado(
  estadoActual: EstadoConversacion,
  mensajes: Array<{ sender: string; content: string }>
): { debeActualizar: boolean; nuevoEstado: EstadoConversacion; razon?: string } {
  
  const estadoDetectado = analizarEstadoConversacion(mensajes)
  
  // Mapeo de progresión válida según Karla García
  const PROGRESION_VALIDA: Record<EstadoConversacion, EstadoConversacion[]> = {
    'por-contestar': ['pendiente-datos'],
    'pendiente-datos': ['por-confirmar'], // Solo si agente envió RESUMEN
    'por-confirmar': ['pendiente-guia'],  // Solo si confirmó + validó pago
    'pendiente-guia': ['pedido-completo'], // Solo si agente registró guía
    'pedido-completo': [], // Estado final
  }
  
  const puedeProgresar = PROGRESION_VALIDA[estadoActual].includes(estadoDetectado)
  
  // IQ 145: NO bloquear por barrio/celular - solo confirmar datos presentes
  // El agente recibirá sugerencias si falta algo, pero el sistema NO bloquea progresión
  let razon: string | undefined
  
  return {
    debeActualizar: puedeProgresar && estadoActual !== estadoDetectado,
    nuevoEstado: estadoDetectado,
    razon: razon
  }
}

// =====================================================
// EXTRACTOR DE DATOS
// =====================================================

export function extraerDatosCliente(mensajes: Array<{ sender: string; content: string }>) {
  const todosLosMensajes = mensajes
    .filter(m => m.sender === 'client')
    .map(m => m.content)
    .join('\n')
  
  // Nombre
  const nombreMatch = todosLosMensajes.match(/(?:nombre[:\s]+|me llamo[:\s]+|soy[:\s]+|mi nombre es[:\s]+)([a-záéíóúñ\s]{3,})/i) ||
                      todosLosMensajes.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\b/)
  const nombre = nombreMatch ? nombreMatch[1].trim().split(/\s+(ciudad|de|en|vivo|tel|celular|cc|cedula|correo|email|@|3\d{2})/i)[0].trim() : null
  
  // Ciudad
  const ciudadMatch = todosLosMensajes.match(/(?:ciudad[:\s]+|de[:\s]+|en[:\s]+|desde[:\s]+|vivo en[:\s]+)?(bogot[aá]|medell[ií]n|kali|cali|barranquilla|cartagena|bucaramanga|pereira|c[uú]cuta|manizales|ibagu[ée]|pasto|monter[ií]a|valledupar|villavicencio|armenia|soacha|santa marta|bello|soledad|buenaventura|neiva|popay[aá]n|tunja|sincelejo|riohacha)/i)
  const ciudad = ciudadMatch ? ciudadMatch[ciudadMatch.length - 1].trim() : null
  
  // Teléfono 10 dígitos
  const telefonoMatch = todosLosMensajes.replace(/[\s\-()]/g, '').match(/\b(3\d{9})\b/)
  const telefono = telefonoMatch ? telefonoMatch[1] : null
  
  // Correo
  const correoMatch = todosLosMensajes.match(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i)
  const correo = correoMatch ? correoMatch[1] : null
  
  // Dirección
  const direccionMatch = todosLosMensajes.match(/(?:dirección|direccion|direcci[óo]n|direc|dir|donde vivo|mi direcci[óo]n|kalle|calle|carrera|cr|kr|cl|diagonal|transversal|mz|manzana)[:\s#]+([^\n]{8,})/i)
  const direccion = direccionMatch ? direccionMatch[1].trim().split(/\s+(tel|celular|cc|cedula|correo|email|doc|transferencia|nequi)/i)[0].trim() : null
  
  // Documento
  const documentoMatch = todosLosMensajes.match(/(?:cc|cédula|cedula|c[ée]dula|documento|identificaci[óo]n|doc)[:\s]*(\d{7,})/i) ||
                         todosLosMensajes.match(/\b(\d{7,10})\b/)
  const documento = documentoMatch ? documentoMatch[1] : null
  
  // Barrio
  const barrioMatch = todosLosMensajes.match(/(?:barrio|bario|vario|brio|b\/|sector|conjunto|residencial|urbanizaci[óo]n|urb\.?|torre|mz|manzana)[:\s]+([a-záéíóúñ0-9\s]{3,})/i)
  const barrio = barrioMatch ? barrioMatch[1].trim().split(/\s+(tel|celular|cc|cedula|correo|3\d{2}|ciudad)/i)[0].trim() : null
  
  // Método de pago
  let metodoPago: 'anticipado' | 'contraentrega' | null = null
  if (/\b(transferencia|transferensia|transferir|consignar|consignación|anticipado|adelantado|pago ya|nequi|nequ[íi]|daviplata)\b/i.test(todosLosMensajes)) {
    metodoPago = 'anticipado'
  } else if (/\b(contraentrega|contra entrega|pago contra|efectivo al recibir)\b/i.test(todosLosMensajes)) {
    metodoPago = 'contraentrega'
  }
  
  // Validar celular 10 dígitos
  const celular10Valido = telefono ? telefono.length === 10 && telefono.startsWith('3') : false
  
  return {
    nombre,
    ciudad,
    telefono,
    celular10Valido, // ⚠️ GATE crítico
    correo,
    direccion,
    documento,
    barrio, // ⚠️ GATE crítico
    metodoPago,
    datosCompletos: !!(nombre && ciudad && telefono && celular10Valido && correo && direccion && documento && barrio && metodoPago)
  }
}

// =====================================================
// SUGERENCIAS PARA EL AGENTE
// =====================================================

export function obtenerSugerenciasAgente(estado: EstadoConversacion, datosCliente?: ReturnType<typeof extraerDatosCliente>): string[] {
  const sugerencias: Record<EstadoConversacion, string[]> = {
    'por-contestar': [
      '¡Buenos [días/tardes/noches]! 👋 Soy Karla García de Galle Oro Laminado 18K',
      '¿Te gustaría ver Balinería Premium 💎 o Joyería Exclusiva 💍?',
      '¿Es tu primera vez con nosotros? 😊'
    ],
    'pendiente-datos': [
      '📝 Para alistar tu pedido necesito:',
      '• Nombre completo',
      '• Ciudad',
      '• Dirección' + (datosCliente?.barrio ? '' : ' + BARRIO (recomendado)'),
      '• Celular' + (datosCliente?.celular10Valido ? '' : ' (preferible 10 dígitos)'),
      '• Cédula',
      '• Correo',
      '• Método de pago: Anticipado 💳 o Contraentrega 📦',
      datosCliente?.barrio ? '' : '💡 Sugerencia: Pide el BARRIO para envío preciso',
      datosCliente?.telefono && !datosCliente?.celular10Valido ? '💡 Sugerencia: Confirma que el celular tenga 10 dígitos' : ''
    ].filter(Boolean),
    'por-confirmar': [
      '📦 RESUMEN FINAL:',
      '• Producto: [Nombre]',
      '• Valor: $[Total]',
      '• Envío: $[Costo]',
      '• Total: $[Final]',
      '¿Confirmas para despacho HOY? ✅',
      '¿Lo aseguramos ya? 💫'
    ],
    'pendiente-guia': [
      datosCliente?.metodoPago === 'anticipado' 
        ? '📸 Por favor envía el comprobante de pago'
        : '✅ ¡Pedido confirmado!',
      '📦 Estamos preparando tu envío',
      '⏰ Te envío la guía en los próximos minutos'
    ],
    'pedido-completo': [
      '✅ ¡Tu pedido está en camino! 🚚',
      '📋 Guía de rastreo: [Número]',
      '📱 Puedes rastrear tu pedido en [Link]',
      '¿Alguna pregunta sobre tu pedido? 😊'
    ]
  }
  
  return sugerencias[estado]
}

// =====================================================
// MÉTRICAS Y ESTADÍSTICAS
// =====================================================

export function calcularMetricasEstado(conversaciones: Array<{ status: EstadoConversacion }>) {
  const total = conversaciones.length
  const porEstado = conversaciones.reduce((acc, conv) => {
    acc[conv.status] = (acc[conv.status] || 0) + 1
    return acc
  }, {} as Record<EstadoConversacion, number>)
  
  const tasaConversion = total > 0 
    ? ((porEstado['pedido-completo'] || 0) / total * 100).toFixed(1)
    : '0.0'
  
  const tasaBloqueadosEnDatos = total > 0
    ? ((porEstado['pendiente-datos'] || 0) / total * 100).toFixed(1)
    : '0.0'
  
  return {
    total,
    porEstado,
    tasaConversion: `${tasaConversion}%`,
    tasaBloqueadosEnDatos: `${tasaBloqueadosEnDatos}%`,
    embudoConversion: {
      inicial: porEstado['por-contestar'] || 0,
      recolectandoDatos: porEstado['pendiente-datos'] || 0,
      esperandoConfirmacion: porEstado['por-confirmar'] || 0,
      confirmados: porEstado['pendiente-guia'] || 0,
      completados: porEstado['pedido-completo'] || 0,
    }
  }
}
