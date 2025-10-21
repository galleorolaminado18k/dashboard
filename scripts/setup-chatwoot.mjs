/**
 * Script automático para configurar Chatwoot con los estados del CRM
 * Crea etiquetas, atributos personalizados y macros automáticamente
 */

const CHATWOOT_CONFIG = {
  accountId: 138167,
  apiToken: 'ns4cHziQpFihHzLJvA4NcQor',
  baseUrl: 'https://app.chatwoot.com'
}

// Configuración de headers para la API
const headers = {
  'Content-Type': 'application/json',
  'api_access_token': CHATWOOT_CONFIG.apiToken
}

// Función helper para hacer peticiones a la API
async function chatwootAPI(endpoint, method = 'GET', body = null) {
  const url = `${CHATWOOT_CONFIG.baseUrl}/api/v1/accounts/${CHATWOOT_CONFIG.accountId}${endpoint}`
  
  const options = {
    method,
    headers,
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    
    if (!response.ok) {
      console.error(`❌ Error en ${endpoint}:`, data)
      return null
    }
    
    return data
  } catch (error) {
    console.error(`❌ Error de conexión en ${endpoint}:`, error.message)
    return null
  }
}

// 1️⃣ CREAR ETIQUETAS PERSONALIZADAS
async function crearEtiquetas() {
  console.log('\n📋 Creando etiquetas del flujo de Karla García...\n')
  
  const etiquetas = [
    { title: 'por-contestar', description: 'Cliente escribió, esperando primera respuesta', color: '#3B82F6' },
    { title: 'pendiente-datos', description: 'Mostró interés, faltan datos completos para pedido', color: '#FBBF24' },
    { title: 'por-confirmar', description: 'Datos completos, esperando confirmación de pedido', color: '#A855F7' },
    { title: 'pendiente-guia', description: 'Pedido confirmado, esperando guía de envío', color: '#F97316' },
    { title: 'pedido-completo', description: 'Guía enviada, pedido en tránsito o completado', color: '#10B981' }
  ]
  
  for (const etiqueta of etiquetas) {
    const resultado = await chatwootAPI('/labels', 'POST', etiqueta)
    if (resultado) {
      console.log(`   ✅ Etiqueta creada: ${etiqueta.title}`)
    } else {
      console.log(`   ⚠️  Etiqueta "${etiqueta.title}" puede que ya exista`)
    }
  }
}

// 2️⃣ CREAR ATRIBUTOS PERSONALIZADOS
async function crearAtributos() {
  console.log('\n📊 Creando atributos personalizados...\n')
  
  const atributos = [
    {
      attribute_display_name: 'Teléfono',
      attribute_display_type: 'text',
      attribute_description: 'Número de celular del cliente (10 dígitos)',
      attribute_key: 'telefono',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Ciudad',
      attribute_display_type: 'text',
      attribute_description: 'Ciudad de entrega del pedido',
      attribute_key: 'ciudad',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Barrio',
      attribute_display_type: 'text',
      attribute_description: 'Barrio de la dirección (CRÍTICO para calcular envío)',
      attribute_key: 'barrio',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Correo',
      attribute_display_type: 'text',
      attribute_description: 'Correo electrónico del cliente',
      attribute_key: 'correo',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Documento',
      attribute_display_type: 'text',
      attribute_description: 'Cédula o documento de identidad',
      attribute_key: 'documento',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Método de Pago',
      attribute_display_type: 'list',
      attribute_description: 'Forma de pago elegida por el cliente',
      attribute_key: 'metodo_pago',
      attribute_model: 'conversation_attribute',
      attribute_values: ['anticipado', 'contraentrega']
    },
    {
      attribute_display_name: 'Producto',
      attribute_display_type: 'text',
      attribute_description: 'Producto(s) que el cliente quiere comprar',
      attribute_key: 'producto',
      attribute_model: 'conversation_attribute'
    },
    {
      attribute_display_name: 'Total Pedido',
      attribute_display_type: 'number',
      attribute_description: 'Valor total del pedido (producto + envío)',
      attribute_key: 'total_pedido',
      attribute_model: 'conversation_attribute'
    }
  ]
  
  for (const atributo of atributos) {
    const resultado = await chatwootAPI('/custom_attribute_definitions', 'POST', atributo)
    if (resultado) {
      console.log(`   ✅ Atributo creado: ${atributo.attribute_display_name}`)
    } else {
      console.log(`   ⚠️  Atributo "${atributo.attribute_display_name}" puede que ya exista`)
    }
  }
}

// 3️⃣ CREAR MACROS (RESPUESTAS PREDEFINIDAS)
async function crearMacros() {
  console.log('\n💬 Creando macros de respuesta rápida...\n')
  
  const macros = [
    {
      name: 'Saludo Inicial - Karla',
      actions: [
        {
          action_name: 'send_message',
          action_params: [
            '¡Buenos días! 👋\nSoy Karla García, tu asesora en Galle Oro Laminado 18K. ¡Qué gusto tenerte! 😊\n\n¿Qué te gustaría ver hoy?\n\n1️⃣ Balinería Premium 💎\n2️⃣ Joyería Exclusiva 💍'
          ]
        },
        {
          action_name: 'add_label',
          action_params: ['por-contestar']
        }
      ],
      visibility: 'global'
    },
    {
      name: 'Solicitar Datos Completos',
      actions: [
        {
          action_name: 'send_message',
          action_params: [
            '¡Genial! Para alistar tu pedido, confirma por favor: ✨\n\n1️⃣ Nombre completo\n2️⃣ Ciudad de entrega\n3️⃣ Dirección completa + barrio (ej: Calle 10 #5-20, barrio La Riviera) 🏘️\n4️⃣ Celular (10 dígitos) 📱\n5️⃣ Documento de identidad 🆔\n6️⃣ Correo electrónico 📧\n7️⃣ Método de pago: ¿Transferencia anticipada 💳 o Contraentrega 📦?\n\n¡Listo, te leo! 💫'
          ]
        },
        {
          action_name: 'add_label',
          action_params: ['pendiente-datos']
        }
      ],
      visibility: 'global'
    },
    {
      name: 'Solicitar Barrio CRÍTICO',
      actions: [
        {
          action_name: 'send_message',
          action_params: [
            'Perfecto, ya tengo casi todo 👍\nSolo me falta un dato importante para tu envío:\n¿De qué barrio es la dirección? 🏘️\nEs necesario para calcular el envío exacto y darte el total 😊'
          ]
        }
      ],
      visibility: 'global'
    },
    {
      name: 'Confirmar Pedido',
      actions: [
        {
          action_name: 'send_message',
          action_params: ['¿Confirmas para despacho HOY? ✅']
        },
        {
          action_name: 'add_label',
          action_params: ['por-confirmar']
        }
      ],
      visibility: 'global'
    },
    {
      name: 'Pedido en Proceso',
      actions: [
        {
          action_name: 'send_message',
          action_params: [
            '¡Pedido confirmado! 🎉 Estamos preparando tu envío 📦\nTe envío la guía de envío en los próximos minutos ⏰'
          ]
        },
        {
          action_name: 'add_label',
          action_params: ['pendiente-guia']
        }
      ],
      visibility: 'global'
    }
  ]
  
  for (const macro of macros) {
    const resultado = await chatwootAPI('/macros', 'POST', macro)
    if (resultado) {
      console.log(`   ✅ Macro creada: ${macro.name}`)
    } else {
      console.log(`   ⚠️  Macro "${macro.name}" puede que ya exista`)
    }
  }
}

// 4️⃣ RESUMEN Y VERIFICACIÓN
async function verificarConfiguracion() {
  console.log('\n🔍 Verificando configuración...\n')
  
  // Obtener etiquetas
  const etiquetas = await chatwootAPI('/labels', 'GET')
  if (etiquetas) {
    console.log(`   ✅ ${etiquetas.length} etiquetas configuradas`)
  }
  
  // Obtener atributos
  const atributos = await chatwootAPI('/custom_attribute_definitions', 'GET')
  if (atributos) {
    console.log(`   ✅ ${atributos.length} atributos personalizados`)
  }
  
  // Obtener macros
  const macros = await chatwootAPI('/macros', 'GET')
  if (macros) {
    console.log(`   ✅ ${macros.length} macros de respuesta rápida`)
  }
}

// EJECUTAR TODO
async function configurarChatwoot() {
  console.log('🚀 Iniciando configuración automática de Chatwoot...')
  console.log(`📍 Account ID: ${CHATWOOT_CONFIG.accountId}`)
  console.log(`🔗 URL: ${CHATWOOT_CONFIG.baseUrl}\n`)
  
  await crearEtiquetas()
  await crearAtributos()
  await crearMacros()
  await verificarConfiguracion()
  
  console.log('\n🎉 ¡Configuración de Chatwoot completada!\n')
  console.log('📋 Próximos pasos:')
  console.log('   1. Ve a Chatwoot → Settings → Labels')
  console.log('   2. Verifica que las 5 etiquetas estén creadas')
  console.log('   3. Ve a Settings → Custom Attributes')
  console.log('   4. Verifica los 8 atributos personalizados')
  console.log('   5. Ve a Settings → Macros')
  console.log('   6. Verifica las 5 macros de respuesta\n')
  console.log('✨ Tu CRM está 100% configurado y listo para usar!\n')
}

// Ejecutar
configurarChatwoot().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
