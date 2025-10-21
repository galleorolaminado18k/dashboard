// =====================================================
// SIMULACIÓN DE 100 CONVERSACIONES REALES
// Testing exhaustivo del sistema de detección regex
// =====================================================

import { analizarEstadoConversacion, extraerDatosCliente, DETECTORES_ESTADO } from '../lib/crm-estados-karla'

type Mensaje = { sender: 'agent' | 'client'; content: string }

// 100 Conversaciones reales simuladas con lenguaje colombiano natural
const CONVERSACIONES_TEST: Array<{ 
  id: number
  nombre: string
  mensajes: Mensaje[]
  estadoEsperado: string
  datosEsperados?: any
}> = [
  
  // ===== GRUPO 1: SALUDOS INICIALES (10) =====
  {
    id: 1,
    nombre: "Saludo simple WhatsApp",
    mensajes: [
      { sender: 'client', content: 'Hola' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 2,
    nombre: "Saludo con emoji",
    mensajes: [
      { sender: 'client', content: 'Hola! 👋' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 3,
    nombre: "Buenos días formal",
    mensajes: [
      { sender: 'client', content: 'Buenos días' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 4,
    nombre: "Hola con pregunta genérica",
    mensajes: [
      { sender: 'client', content: 'Hola, cómo estás?' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 5,
    nombre: "Buenas noches",
    mensajes: [
      { sender: 'client', content: 'Buenas noches' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 6,
    nombre: "Hola informal",
    mensajes: [
      { sender: 'client', content: 'holaaa' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 7,
    nombre: "Buenas tardes",
    mensajes: [
      { sender: 'client', content: 'Buenas tardes' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 8,
    nombre: "Hola con punto",
    mensajes: [
      { sender: 'client', content: 'Hola.' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 9,
    nombre: "Saludo con ¿Hay alguien?",
    mensajes: [
      { sender: 'client', content: 'Hola, hay alguien?' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 10,
    nombre: "Permiso informal",
    mensajes: [
      { sender: 'client', content: 'Permiso' }
    ],
    estadoEsperado: 'por-contestar'
  },

  // ===== GRUPO 2: INTERÉS EN PRODUCTOS (15) =====
  {
    id: 11,
    nombre: "Quiero ver catálogo",
    mensajes: [
      { sender: 'client', content: 'Hola, quiero ver el catálogo' },
      { sender: 'agent', content: '¡Hola! Claro, tenemos balinería y joyería' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 12,
    nombre: "Pregunta por precio",
    mensajes: [
      { sender: 'client', content: 'Cuanto cuesta el collar?' },
      { sender: 'agent', content: 'El collar vale $150,000' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 13,
    nombre: "Me interesa producto",
    mensajes: [
      { sender: 'client', content: 'Me interesa el conjunto de aretes' },
      { sender: 'agent', content: 'Excelente elección' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 14,
    nombre: "Pregunta si tienen disponible",
    mensajes: [
      { sender: 'client', content: 'Tienen disponible la pulsera?' },
      { sender: 'agent', content: 'Sí, tenemos en stock' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 15,
    nombre: "Cuánto vale con error ortográfico",
    mensajes: [
      { sender: 'client', content: 'Cuanto bale el anillo' },
      { sender: 'agent', content: '$200,000' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 16,
    nombre: "Me gusta producto",
    mensajes: [
      { sender: 'client', content: 'Me gusta ese collar que mostraste' },
      { sender: 'agent', content: 'Genial!' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 17,
    nombre: "Ver balinería",
    mensajes: [
      { sender: 'client', content: 'Quiero ver balinería' },
      { sender: 'agent', content: 'Te envío fotos' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 18,
    nombre: "Mostrar joyería",
    mensajes: [
      { sender: 'client', content: 'Me pueden mostrar joyería?' },
      { sender: 'agent', content: 'Claro' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 19,
    nombre: "Envían a mi ciudad?",
    mensajes: [
      { sender: 'client', content: 'Envían a Medellín?' },
      { sender: 'agent', content: 'Sí, enviamos a todo Colombia' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 20,
    nombre: "Cuánto tarda el envío",
    mensajes: [
      { sender: 'client', content: 'Cuanto tarda el envio' },
      { sender: 'agent', content: '2-3 días hábiles' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 21,
    nombre: "Valor con envío",
    mensajes: [
      { sender: 'client', content: 'El valor incluye envio?' },
      { sender: 'agent', content: 'Sí, incluye envío' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 22,
    nombre: "Hay aretes pequeños",
    mensajes: [
      { sender: 'client', content: 'Hay aretes pequeños?' },
      { sender: 'agent', content: 'Sí, varios modelos' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 23,
    nombre: "Mandan a Cali",
    mensajes: [
      { sender: 'client', content: 'Mandan a Cali?' },
      { sender: 'agent', content: 'Claro que sí' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 24,
    nombre: "Entregan en Bogotá",
    mensajes: [
      { sender: 'client', content: 'Entregan en Bogotá?' },
      { sender: 'agent', content: 'Sí, sin problema' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 25,
    nombre: "Llega rápido?",
    mensajes: [
      { sender: 'client', content: 'Llega rapido?' },
      { sender: 'agent', content: 'Sí, 2-3 días' }
    ],
    estadoEsperado: 'pendiente-datos'
  },

  // ===== GRUPO 3: DATOS INCOMPLETOS (20) =====
  {
    id: 26,
    nombre: "Solo nombre",
    mensajes: [
      { sender: 'client', content: 'Quiero el collar' },
      { sender: 'agent', content: 'Perfecto! Dame tu nombre completo' },
      { sender: 'client', content: 'María Fernández' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 27,
    nombre: "Nombre y ciudad",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Dame tus datos' },
      { sender: 'client', content: 'Nombre: Carlos, Ciudad: Medellín' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 28,
    nombre: "Solo teléfono",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Dame tu celular' },
      { sender: 'client', content: '3001234567' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 29,
    nombre: "Nombre, ciudad, teléfono (falta dirección)",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Ana López, Cali, 3109876543' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 30,
    nombre: "Dirección sin barrio",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Dirección?' },
      { sender: 'client', content: 'Calle 45 #23-10' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 31,
    nombre: "Todos los datos PERO sin barrio",
    mensajes: [
      { sender: 'client', content: 'Quiero el collar' },
      { sender: 'agent', content: 'Datos completos?' },
      { sender: 'client', content: 'Nombre: Laura Gómez, Ciudad: Bogotá, Dirección: Calle 72 #10-50, Tel: 3201234567, CC: 1234567890, Correo: laura@gmail.com' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 32,
    nombre: "Solo correo",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Tu correo?' },
      { sender: 'client', content: 'juan@hotmail.com' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 33,
    nombre: "Solo documento",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Tu cédula?' },
      { sender: 'client', content: 'CC 98765432' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 34,
    nombre: "Nombre y teléfono",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Dame tus datos' },
      { sender: 'client', content: 'Pedro Martínez 3151234567' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 35,
    nombre: "Ciudad y dirección",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Dónde vives?' },
      { sender: 'client', content: 'Barranquilla, Calle 84 #50-20' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 36,
    nombre: "Solo método de pago",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Cómo pagas?' },
      { sender: 'client', content: 'Transferencia' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 37,
    nombre: "Nombre, teléfono, ciudad (faltan otros)",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Sofía Rodríguez, 3189876543, Pereira' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 38,
    nombre: "Dirección completa pero sin otros datos",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Dirección?' },
      { sender: 'client', content: 'Carrera 15 #80-40, Barrio Chapinero' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 39,
    nombre: "Casi todos los datos (falta correo)",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Nombre: Daniel Torres, Ciudad: Cali, Dirección: Calle 5 #10-30 Barrio El Peñón, Tel: 3101234567, CC: 1029384756, Pago anticipado' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 40,
    nombre: "Casi completo (falta documento)",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Nombre: Isabella Moreno, Ciudad: Medellín, Dirección: Calle 10 #20-30 Barrio Laureles, Tel: 3209876543, Correo: isabella@gmail.com, Contraentrega' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 41,
    nombre: "Nombre con apellidos y ciudad",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Me llamo Camila Andrea Vargas, soy de Bucaramanga' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 42,
    nombre: "Teléfono con guiones",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Celular?' },
      { sender: 'client', content: '310-456-7890' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 43,
    nombre: "Dirección con conjunto pero sin otros datos",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Dirección?' },
      { sender: 'client', content: 'Conjunto Residencial Los Andes, Torre 3, Apto 502' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 44,
    nombre: "CC sin otros datos",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Documento?' },
      { sender: 'client', content: 'Cédula 52341678' }
    ],
    estadoEsperado: 'pendiente-datos'
  },
  {
    id: 45,
    nombre: "Ciudad con 'vivo en'",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'De dónde eres?' },
      { sender: 'client', content: 'Vivo en Cartagena' }
    ],
    estadoEsperado: 'pendiente-datos'
  },

  // ===== GRUPO 4: DATOS COMPLETOS CON RESUMEN DEL AGENTE (15) =====
  {
    id: 46,
    nombre: "Todos los datos con barrio + agente envía resumen",
    mensajes: [
      { sender: 'client', content: 'Quiero el collar' },
      { sender: 'agent', content: 'Necesito todos tus datos' },
      { sender: 'client', content: 'Nombre: María Fernández, Ciudad: Bogotá, Dirección: Calle 123 #45-67 Barrio Suba, Tel: 3001234567, CC: 1234567890, Correo: maria@gmail.com, Transferencia' },
      { sender: 'agent', content: 'Perfecto! RESUMEN: Collar $80.000 + Envío $15.000 = Total $95.000. ¿Confirmas?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 47,
    nombre: "Datos completos en varios mensajes + resumen agente",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Dame tus datos' },
      { sender: 'client', content: 'Carlos Ramírez' },
      { sender: 'client', content: 'Medellín' },
      { sender: 'client', content: 'Carrera 80 #50-30 Barrio Belén, 3109876543' },
      { sender: 'client', content: 'CC 98765432, carlos@hotmail.com' },
      { sender: 'client', content: 'Contraentrega' },
      { sender: 'agent', content: 'Listo! Resumiendo: Producto $120.000 + Envío $18.000 = $138.000 contraentrega. ¿Confirmas?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 48,
    nombre: "Datos completos formato informal + agente envía total",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Soy Ana López de Cali, vivo en la Calle 5 #10-20 del Barrio El Peñón, mi cel es 3201234567, cedula 1029384756, correo ana@gmail.com, pago con nequi' },
      { sender: 'agent', content: 'Perfecto Ana! Valor final: Aretes $50.000 + Envío $12.000 = $62.000. Te lo aseguramos ya?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 49,
    nombre: "Datos completos con conjunto residencial + resumen",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Datos completos con barrio' },
      { sender: 'client', content: 'Nombre: Laura Gómez, Ciudad: Bucaramanga, Dirección: Conjunto Los Cedros Mz 5 Casa 10, Tel: 3151234567, Documento: 87654321, Email: laura@yahoo.com, Anticipo por Daviplata' },
      { sender: 'agent', content: 'Total: Pulsera $90.000 + Envío $16.000 = $106.000 anticipado. ¿Lo dejamos así?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 50,
    nombre: "Datos completos con urbanización + total enviado",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Dame todo' },
      { sender: 'client', content: 'Pedro Martínez, Pereira, Urbanización Santa Mónica Etapa 2 Casa 45, 3189876543, CC 11223344, pedro@outlook.com, Pago anticipado' },
      { sender: 'agent', content: 'Resumen: Cadena $110.000 + Envío $14.000 = $124.000. ¿Confirmas despacho?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 51,
    nombre: "Datos completos con torre y apto + resumen",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Sofía Rodríguez, Barranquilla, Torre del Mar Apto 801, 3201234567, Cedula 55443322, sofia@gmail.com, Transferencia Bancolombia' },
      { sender: 'agent', content: 'Listo Sofía! Total: Anillo $75.000 + Envío $13.000 = $88.000. ¿Lo aseguramos?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 52,
    nombre: "Datos completos con sector + resumen",
    mensajes: [
      { sender: 'client', content: 'Me gusta' },
      { sender: 'agent', content: 'Necesito datos' },
      { sender: 'client', content: 'Daniel Torres, Cúcuta, Sector San Luis Calle 8 #15-20, Tel 3109876543, Doc 77889900, daniel@hotmail.com, Contraentrega' },
      { sender: 'agent', content: 'Perfecto! Resumen final: Conjunto $150.000 + Envío $20.000 = $170.000 contraentrega. ¿Va?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 53,
    nombre: "Datos completos con corregimiento + resumen",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Todo?' },
      { sender: 'client', content: 'Isabella Moreno, Santa Marta, Corregimiento Bonda Vereda El Caimán Casa 7, 3151234567, CC 99887766, isabella@yahoo.com, Pago ya por Nequi' },
      { sender: 'agent', content: 'Isabella, total: Collar $85.000 + Envío $22.000 = $107.000. ¿Confirmas?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 54,
    nombre: "Datos completos con manzana + resumen",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Camila Vargas, Manizales, Manzana 10 Casa 5 Barrio La Enea, 3189876543, Documento 44556677, camila@gmail.com, Anticipo' },
      { sender: 'agent', content: 'Camila, resumiendo: Aretes $60.000 + Envío $15.000 = $75.000. ¿Lo aseguramos ya?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 55,
    nombre: "Datos completos con diagonal + resumen",
    mensajes: [
      { sender: 'client', content: 'Lo quiero ya' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Andrés Ríos, Ibagué, Diagonal 50 #20-30 Sector Centro, 3201234567, CC 33445566, andres@outlook.com, Pago anticipado' },
      { sender: 'agent', content: 'Listo! Total: Pulsera $95.000 + Envío $17.000 = $112.000. ¿Confirmas?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 56,
    nombre: "Datos completos con transversal + resumen",
    mensajes: [
      { sender: 'client', content: 'Compro' },
      { sender: 'agent', content: 'Necesito todo' },
      { sender: 'client', content: 'Valentina Ospina, Armenia, Transversal 15 #10-20 Barrio La Fachada, 3151234567, Cedula 22334455, valentina@gmail.com, Contraentrega' },
      { sender: 'agent', content: 'Perfecto Valentina! Resumiendo: Cadena $100.000 + Envío $14.000 = $114.000. ¿Lo dejamos así?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 57,
    nombre: "Datos completos con local + resumen",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Santiago Mejía, Pasto, Centro Comercial Gran Plaza Local 205, 3189876543, Doc 66778899, santiago@hotmail.com, Transferencia' },
      { sender: 'agent', content: 'Santiago, valor final: Anillo $70.000 + Envío $19.000 = $89.000. ¿Confirmas despacho?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 58,
    nombre: "Datos completos con oficina + resumen",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Natalia Castro, Villavicencio, Edificio Central Oficina 302, 3201234567, CC 11223344, natalia@yahoo.com, Anticipo Bancolombia' },
      { sender: 'agent', content: 'Natalia, total: Conjunto $140.000 + Envío $18.000 = $158.000. ¿Lo aseguramos?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 59,
    nombre: "Datos completos con interior + resumen",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Datos completos con barrio' },
      { sender: 'client', content: 'Gabriela Rojas, Montería, Calle 30 #15-40 Interior 3 Barrio Sur, 3151234567, Documento 55667788, gabriela@gmail.com, Contraentrega' },
      { sender: 'agent', content: 'Gabriela, resumiendo: Collar $88.000 + Envío $21.000 = $109.000. ¿Confirmas?' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 60,
    nombre: "Datos completos con bloque + resumen",
    mensajes: [
      { sender: 'client', content: 'Me gusta, lo compro' },
      { sender: 'agent', content: 'Dame todos tus datos' },
      { sender: 'client', content: 'Alejandro Díaz, Valledupar, Conjunto Los Alpes Bloque 5 Apto 201, 3189876543, CC 99887766, alejandro@outlook.com, Pago anticipado' },
      { sender: 'agent', content: 'Alejandro, total final: Pulsera $105.000 + Envío $16.000 = $121.000. ¿Lo dejamos así?' }
    ],
    estadoEsperado: 'por-confirmar'
  },

  // ===== GRUPO 5: CONFIRMACIONES CON VALIDACIÓN DE PAGO (20) =====
  {
    id: 61,
    nombre: "Confirmación anticip+ + envía comprobante",
    mensajes: [
      { sender: 'client', content: 'Quiero el collar' },
      { sender: 'agent', content: 'Dame datos' },
      { sender: 'client', content: 'Nombre: María, Ciudad: Bogotá, Dirección: Calle 123 Barrio Suba, Tel: 3001234567, CC: 1234567890, Correo: maria@gmail.com, Transferencia' },
      { sender: 'agent', content: 'RESUMEN: Collar $80.000 + Envío $15.000 = $95.000. ¿Confirmas?' },
      { sender: 'client', content: 'Sí' },
      { sender: 'agent', content: 'Perfecto! Por favor envía el comprobante de pago' },
      { sender: 'client', content: 'Aquí está la foto del pago' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 62,
    nombre: "Confirmación contraentrega + confirma despacho",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Carlos Ramírez, Medellín, Carrera 80 Barrio Belén, 3109876543, CC 98765432, carlos@hotmail.com, Contraentrega' },
      { sender: 'agent', content: 'Total: $120.000 + $18.000 envío = $138.000. ¿Confirmas?' },
      { sender: 'client', content: 'si, confirmo despacho' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 63,
    nombre: "Confirmación Nequi + foto comprobante",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos?' },
      { sender: 'client', content: 'Ana López, Cali, Calle 5 Barrio El Peñón, 3201234567, CC 1029384756, ana@gmail.com, Nequi' },
      { sender: 'agent', content: 'Resumen: Aretes $50.000 + Envío $12.000 = $62.000. ¿Lo aseguramos?' },
      { sender: 'client', content: 'Dale' },
      { sender: 'agent', content: 'Envía captura de pago por Nequi' },
      { sender: 'client', content: 'Listo, ahí va la foto' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 64,
    nombre: "Confirmación con 'listo'",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Laura Gómez, Bucaramanga, Conjunto Los Cedros, 3151234567, CC 87654321, laura@yahoo.com, Anticipo' },
      { sender: 'agent', content: 'Confirmado?' },
      { sender: 'client', content: 'Listo' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 65,
    nombre: "Confirmación con 'perfecto'",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Pedro Martínez, Pereira, Urbanización Santa Mónica, 3189876543, CC 11223344, pedro@outlook.com, Anticipado' },
      { sender: 'agent', content: 'Aseguramos?' },
      { sender: 'client', content: 'Perfecto' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 66,
    nombre: "Confirmación con 'confirmo'",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Sofía Rodríguez, Barranquilla, Torre del Mar Apto 801, 3201234567, CC 55443322, sofia@gmail.com, Transferencia' },
      { sender: 'agent', content: 'Confirmas?' },
      { sender: 'client', content: 'Confirmo' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 67,
    nombre: "Confirmación con 'de una'",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Necesito todo' },
      { sender: 'client', content: 'Daniel Torres, Cúcuta, Sector San Luis Calle 8, 3109876543, CC 77889900, daniel@hotmail.com, Contraentrega' },
      { sender: 'agent', content: 'Lo aseguramos?' },
      { sender: 'client', content: 'De una' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 68,
    nombre: "Confirmación con 'hágale'",
    mensajes: [
      { sender: 'client', content: 'Me gusta' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Isabella Moreno, Santa Marta, Corregimiento Bonda, 3151234567, CC 99887766, isabella@yahoo.com, Nequi' },
      { sender: 'agent', content: 'Confirmas?' },
      { sender: 'client', content: 'Hágale' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 69,
    nombre: "Confirmación con 'ok'",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Camila Vargas, Manizales, Manzana 10 Barrio La Enea, 3189876543, CC 44556677, camila@gmail.com, Anticipo' },
      { sender: 'agent', content: 'Lo confirmamos?' },
      { sender: 'client', content: 'Ok' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 70,
    nombre: "Confirmación con 'va'",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Andrés Ríos, Ibagué, Diagonal 50 Sector Centro, 3201234567, CC 33445566, andres@outlook.com, Anticipado' },
      { sender: 'agent', content: 'Aseguramos?' },
      { sender: 'client', content: 'Va' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 71,
    nombre: "Confirmación con 'claro'",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Valentina Ospina, Armenia, Transversal 15 Barrio La Fachada, 3151234567, CC 22334455, valentina@gmail.com, Contraentrega' },
      { sender: 'agent', content: 'Confirmado?' },
      { sender: 'client', content: 'Claro' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 72,
    nombre: "Confirmación con 'exacto'",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Santiago Mejía, Pasto, Centro Comercial Gran Plaza, 3189876543, CC 66778899, santiago@hotmail.com, Transferencia' },
      { sender: 'agent', content: 'Así lo dejamos?' },
      { sender: 'client', content: 'Exacto' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 73,
    nombre: "Confirmación con 'correcto'",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Natalia Castro, Villavicencio, Edificio Central Ofic 302, 3201234567, CC 11223344, natalia@yahoo.com, Anticipo' },
      { sender: 'agent', content: 'Todo ok?' },
      { sender: 'client', content: 'Correcto' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 74,
    nombre: "Confirmación con 'así es'",
    mensajes: [
      { sender: 'client', content: 'Me gusta' },
      { sender: 'agent', content: 'Necesito todo' },
      { sender: 'client', content: 'Gabriela Rojas, Montería, Calle 30 Interior 3 Barrio Sur, 3151234567, CC 55667788, gabriela@gmail.com, Contraentrega' },
      { sender: 'agent', content: 'Así lo dejamos?' },
      { sender: 'client', content: 'Así es' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 75,
    nombre: "Confirmación con 'eso'",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Alejandro Díaz, Valledupar, Conjunto Los Alpes Bloque 5, 3189876543, CC 99887766, alejandro@outlook.com, Anticipado' },
      { sender: 'agent', content: 'Confirmado?' },
      { sender: 'client', content: 'Eso' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 76,
    nombre: "Confirmación con 'sale'",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Mateo Herrera, Neiva, Barrio La Gaitana Calle 20, 3201234567, CC 88776655, mateo@gmail.com, Nequi' },
      { sender: 'agent', content: 'Lo aseguramos?' },
      { sender: 'client', content: 'Sale' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 77,
    nombre: "Confirmación con 'bien'",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Lucía Ramírez, Popayán, Sector El Norte Calle 12, 3151234567, CC 77665544, lucia@yahoo.com, Transferencia' },
      { sender: 'agent', content: 'Todo ok?' },
      { sender: 'client', content: 'Bien' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 78,
    nombre: "Confirmación con 'bueno'",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Emilio García, Tunja, Urbanización San Francisco, 3189876543, CC 66554433, emilio@outlook.com, Anticipo' },
      { sender: 'agent', content: 'Lo dejamos así?' },
      { sender: 'client', content: 'Bueno' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 79,
    nombre: "Confirmación con emoji ✅",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Paula Jiménez, Sincelejo, Barrio La Granja Manzana 8, 3201234567, CC 55443322, paula@gmail.com, Contraentrega' },
      { sender: 'agent', content: 'Confirmado?' },
      { sender: 'client', content: '✅' }
    ],
    estadoEsperado: 'pendiente-guia'
  },
  {
    id: 80,
    nombre: "Confirmación con 'seguimos'",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Necesito datos' },
      { sender: 'client', content: 'Roberto Vega, Riohacha, Sector Centro Calle 5, 3151234567, CC 44332211, roberto@hotmail.com, Anticipado' },
      { sender: 'agent', content: 'Todo listo?' },
      { sender: 'client', content: 'Seguimos' }
    ],
    estadoEsperado: 'pendiente-guia'
  },

  // ===== GRUPO 6: PEDIDOS COMPLETADOS (10) =====
  {
    id: 81,
    nombre: "Agente envió guía",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'María F, Bogotá, Calle 123 Barrio Suba, 3001234567, CC 123, maria@gmail.com, Transfer' },
      { sender: 'agent', content: 'Confirmado?' },
      { sender: 'client', content: 'Sí' },
      { sender: 'agent', content: 'Tu guía de envío es: MIP123456789' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 82,
    nombre: "Agente confirmó despacho",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Carlos R, Medellín, Carr 80 Barrio Belén, 3109876543, CC 987, carlos@mail.com, Contraentrega' },
      { sender: 'client', content: 'Confirmo' },
      { sender: 'agent', content: 'Ya fue despachado! 📦' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 83,
    nombre: "Número de rastreo enviado",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Ana L, Cali, Calle 5 Barrio Peñón, 320123, CC 102, ana@mail.com, Nequi' },
      { sender: 'client', content: 'Dale' },
      { sender: 'agent', content: 'Código de rastreo: 987654321' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 84,
    nombre: "Pedido en camino",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Necesito todo' },
      { sender: 'client', content: 'Laura G, Bucaramanga, Conjunto Cedros, 315123, CC 876, laura@mail.com, Anticipo' },
      { sender: 'client', content: 'Listo' },
      { sender: 'agent', content: 'Tu pedido está en camino! 🚚' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 85,
    nombre: "Guía MiPaquete confirmada",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Pedro M, Pereira, Urb Santa Mónica, 318987, CC 112, pedro@mail.com, Anticipado' },
      { sender: 'client', content: 'Ok' },
      { sender: 'agent', content: 'Guía generada: MIP-2024-001' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 86,
    nombre: "Ya despachado hoy",
    mensajes: [
      { sender: 'client', content: 'Me interesa' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Sofía R, Barranquilla, Torre Mar Apto 801, 320123, CC 554, sofia@mail.com, Transfer' },
      { sender: 'client', content: 'Confirmo' },
      { sender: 'agent', content: 'Fue despachado hoy mismo' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 87,
    nombre: "Número de guía proporcionado",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Datos completos' },
      { sender: 'client', content: 'Daniel T, Cúcuta, Sector San Luis, 310987, CC 778, daniel@mail.com, Contraent' },
      { sender: 'client', content: 'De una' },
      { sender: 'agent', content: 'Numero de guía: 111222333' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 88,
    nombre: "Pedido enviado con transportadora",
    mensajes: [
      { sender: 'client', content: 'Quiero comprar' },
      { sender: 'agent', content: 'Necesito datos' },
      { sender: 'client', content: 'Isabella M, Santa Marta, Corregimiento Bonda, 315123, CC 998, isa@mail.com, Nequi' },
      { sender: 'client', content: 'Sí' },
      { sender: 'agent', content: 'Tu guía MiPaquete: 444555666' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 89,
    nombre: "En camino confirmado",
    mensajes: [
      { sender: 'client', content: 'Lo compro' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Camila V, Manizales, Mz 10 Barrio Enea, 318987, CC 445, camila@mail.com, Anticipo' },
      { sender: 'client', content: 'Perfecto' },
      { sender: 'agent', content: 'Ya está en camino a tu ciudad!' }
    ],
    estadoEsperado: 'pedido-completo'
  },
  {
    id: 90,
    nombre: "Código de rastreo activo",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Andrés R, Ibagué, Diagonal 50 Centro, 320123, CC 334, andres@mail.com, Anticipado' },
      { sender: 'client', content: 'Listo' },
      { sender: 'agent', content: 'Código de rastreo activo: TRK789' }
    ],
    estadoEsperado: 'pedido-completo'
  },

  // ===== GRUPO 7: CASOS ESPECIALES Y EDGE CASES (10) =====
  {
    id: 91,
    nombre: "Cliente pregunta por garantía (no afecta estado)",
    mensajes: [
      { sender: 'client', content: 'Tienen garantía?' },
      { sender: 'agent', content: 'Sí, garantía de 6 meses' }
    ],
    estadoEsperado: 'pendiente-datos' // Mostró interés al preguntar garantía
  },
  {
    id: 92,
    nombre: "Cliente dice gracias (no progresa)",
    mensajes: [
      { sender: 'client', content: 'Gracias' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 93,
    nombre: "Cliente dice 'no' (no progresa)",
    mensajes: [
      { sender: 'client', content: 'No gracias' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 94,
    nombre: "Errores ortográficos múltiples",
    mensajes: [
      { sender: 'client', content: 'kiero el qollar' },
      { sender: 'agent', content: 'Ok' },
      { sender: 'client', content: 'maria fernanez, bogota, kalle 123 vario suba, 3001234567, cedula 123456, maria@gmail.com, transferensia' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 95,
    nombre: "Mensaje solo con emojis",
    mensajes: [
      { sender: 'client', content: '👋' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 96,
    nombre: "Cliente repite 'hola' varias veces",
    mensajes: [
      { sender: 'client', content: 'Hola' },
      { sender: 'client', content: 'Hola?' },
      { sender: 'client', content: 'Holaaaa' }
    ],
    estadoEsperado: 'por-contestar'
  },
  {
    id: 97,
    nombre: "Teléfono con espacios y paréntesis",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'María F, Bogotá, Calle 123 Barrio Suba, (300) 123-4567, CC 123456, maria@gmail.com, Transferencia' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 98,
    nombre: "Correo con mayúsculas",
    mensajes: [
      { sender: 'client', content: 'Lo quiero' },
      { sender: 'agent', content: 'Todo' },
      { sender: 'client', content: 'Carlos R, Medellín, Carr 80 Barrio Belén, 3109876543, CC 987654, CARLOS@GMAIL.COM, Contraentrega' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 99,
    nombre: "Ciudad con error ortográfico",
    mensajes: [
      { sender: 'client', content: 'Quiero' },
      { sender: 'agent', content: 'Datos' },
      { sender: 'client', content: 'Ana L, kali, Calle 5 Barrio Peñón, 3201234567, CC 1029384, ana@gmail.com, Nequi' }
    ],
    estadoEsperado: 'por-confirmar'
  },
  {
    id: 100,
    nombre: "Todos los datos en MAYÚSCULAS",
    mensajes: [
      { sender: 'client', content: 'QUIERO EL COLLAR' },
      { sender: 'agent', content: 'DATOS' },
      { sender: 'client', content: 'NOMBRE: LAURA GOMEZ, CIUDAD: BUCARAMANGA, DIRECCION: CONJUNTO LOS CEDROS, TEL: 3151234567, CC: 87654321, CORREO: LAURA@YAHOO.COM, TRANSFERENCIA' }
    ],
    estadoEsperado: 'por-confirmar'
  },
]

// Función de testing
function ejecutarTests() {
  console.log('🔬 INICIANDO SIMULACIÓN DE 100 CONVERSACIONES\n')
  console.log('=' .repeat(80))
  
  let exitosos = 0
  let fallidos = 0
  const fallos: Array<{ id: number; nombre: string; esperado: string; obtenido: string }> = []
  
  CONVERSACIONES_TEST.forEach((test) => {
    const estadoDetectado = analizarEstadoConversacion(test.mensajes)
    
    if (estadoDetectado === test.estadoEsperado) {
      exitosos++
      console.log(`✅ Test ${test.id}: ${test.nombre}`)
    } else {
      fallidos++
      console.log(`❌ Test ${test.id}: ${test.nombre}`)
      console.log(`   Esperado: ${test.estadoEsperado}`)
      console.log(`   Obtenido: ${estadoDetectado}`)
      fallos.push({
        id: test.id,
        nombre: test.nombre,
        esperado: test.estadoEsperado,
        obtenido: estadoDetectado
      })
    }
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RESULTADOS FINALES:')
  console.log(`✅ Exitosos: ${exitosos}/100 (${(exitosos/100*100).toFixed(1)}%)`)
  console.log(`❌ Fallidos: ${fallidos}/100 (${(fallidos/100*100).toFixed(1)}%)`)
  
  if (fallos.length > 0) {
    console.log('\n❌ CASOS QUE FALLARON:')
    fallos.forEach(f => {
      console.log(`\n  Test ${f.id}: ${f.nombre}`)
      console.log(`  - Esperado: ${f.esperado}`)
      console.log(`  - Obtenido: ${f.obtenido}`)
    })
  }
  
  // Test de extracción de datos
  console.log('\n' + '='.repeat(80))
  console.log('\n🔍 PRUEBA DE EXTRACCIÓN DE DATOS:\n')
  
  const testExtraccion = {
    mensajes: [
      { sender: 'client' as const, content: 'Quiero el collar' },
      { sender: 'agent' as const, content: 'Dame tus datos completos' },
      { sender: 'client' as const, content: 'Nombre: María Fernández González, Ciudad: Bogotá, Dirección: Calle 123 #45-67 Barrio Suba, Tel: 300-123-4567, CC: 1234567890, Correo: maria.fernandez@gmail.com, Método: Transferencia por Nequi' }
    ]
  }
  
  const datosExtraidos = extraerDatosCliente(testExtraccion.mensajes)
  console.log('Datos extraídos:')
  console.log(JSON.stringify(datosExtraidos, null, 2))
  
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ SIMULACIÓN COMPLETA\n')
}

// Ejecutar tests
ejecutarTests()
