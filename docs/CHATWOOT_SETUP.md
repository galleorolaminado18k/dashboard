# 🏷️ GUÍA: Configurar Estados de Karla García en Chatwoot

## PASO A PASO PARA CONFIGURAR CHATWOOT

### 1️⃣ ACCEDER AL DASHBOARD DE CHATWOOT

1. Ir a tu instancia de Chatwoot: `https://[tu-dominio].chatwoot.com`
2. Iniciar sesión con tu cuenta de administrador
3. Ir a **Settings** (⚙️) en la barra lateral

---

### 2️⃣ CREAR ETIQUETAS PERSONALIZADAS (LABELS)

**Ubicación:** Settings → Labels → Add Label

Crear las siguientes 5 etiquetas según el flujo de Karla:

#### ✅ **Etiqueta 1: Por Contestar**
```
Nombre: por-contestar
Descripción: Cliente escribió, esperando primera respuesta
Color: #3B82F6 (Azul)
```

#### ✅ **Etiqueta 2: Pendiente Datos**
```
Nombre: pendiente-datos
Descripción: Mostró interés, faltan datos completos para pedido
Color: #FBBF24 (Amarillo)
```

#### ✅ **Etiqueta 3: Por Confirmar**
```
Nombre: por-confirmar
Descripción: Datos completos, esperando confirmación de pedido
Color: #A855F7 (Morado)
```

#### ✅ **Etiqueta 4: Pendiente Guía**
```
Nombre: pendiente-guia
Descripción: Pedido confirmado, esperando guía de envío
Color: #F97316 (Naranja)
```

#### ✅ **Etiqueta 5: Pedido Completo**
```
Nombre: pedido-completo
Descripción: Guía enviada, pedido en tránsito o completado
Color: #10B981 (Verde)
```

---

### 3️⃣ CREAR ATRIBUTOS PERSONALIZADOS (CUSTOM ATTRIBUTES)

**Ubicación:** Settings → Custom Attributes → Conversation Attributes

Estos atributos almacenarán información adicional del cliente:

#### 📱 **Atributo 1: Teléfono**
```
Display Name: Teléfono
Key: telefono
Type: Text
Description: Número de celular del cliente (10 dígitos)
```

#### 🏙️ **Atributo 2: Ciudad**
```
Display Name: Ciudad
Key: ciudad
Type: Text
Description: Ciudad de entrega del pedido
```

#### 📍 **Atributo 3: Barrio**
```
Display Name: Barrio
Key: barrio
Type: Text
Description: Barrio de la dirección (CRÍTICO para calcular envío)
```

#### 📧 **Atributo 4: Correo**
```
Display Name: Correo
Key: correo
Type: Text
Description: Correo electrónico del cliente
```

#### 🆔 **Atributo 5: Documento**
```
Display Name: Documento
Key: documento
Type: Text
Description: Cédula o documento de identidad
```

#### 💳 **Atributo 6: Método de Pago**
```
Display Name: Método de Pago
Key: metodo_pago
Type: List
Values: anticipado, contraentrega
Description: Forma de pago elegida por el cliente
```

#### 📦 **Atributo 7: Producto**
```
Display Name: Producto
Key: producto
Type: Text
Description: Producto(s) que el cliente quiere comprar
```

#### 💰 **Atributo 8: Total Pedido**
```
Display Name: Total Pedido
Key: total_pedido
Type: Number
Description: Valor total del pedido (producto + envío)
```

---

### 4️⃣ CREAR MACROS (MENSAJES PREDEFINIDOS)

**Ubicación:** Settings → Macros → Add Macro

Crear macros para las respuestas del flujo de Karla:

#### 📬 **Macro 1: Saludo Inicial**
```
Name: saludo_inicial
Action: Send Message
Message:
¡Buenos días! 👋
Soy Karla García, tu asesora en Galle Oro Laminado 18K. ¡Qué gusto tenerte! 😊

¿Qué te gustaría ver hoy?

1️⃣ Balinería Premium 💎
2️⃣ Joyería Exclusiva 💍

Labels to add: por-contestar
```

#### 📋 **Macro 2: Solicitar Datos Completos**
```
Name: solicitar_datos
Action: Send Message
Message:
¡Genial! Para alistar tu pedido, confirma por favor: ✨

1️⃣ Nombre completo
2️⃣ Ciudad de entrega
3️⃣ Dirección completa + barrio (ej: Calle 10 #5-20, barrio La Riviera) 🏘️
4️⃣ Celular (10 dígitos) 📱
5️⃣ Documento de identidad 🆔
6️⃣ Correo electrónico 📧
7️⃣ Método de pago: ¿Transferencia anticipada 💳 o Contraentrega 📦?

¡Listo, te leo! 💫

Labels to add: pendiente-datos
```

#### ⚠️ **Macro 3: Solicitar Barrio (CRÍTICO)**
```
Name: solicitar_barrio
Action: Send Message
Message:
Perfecto {{contact.name}}, ya tengo casi todo 👍
Solo me falta un dato importante para tu envío:
¿De qué barrio es la dirección en {{custom_attribute.ciudad}}? 🏘️
Es necesario para calcular el envío exacto y darte el total 😊

Labels to add: pendiente-datos
```

#### ✅ **Macro 4: Confirmar Pedido**
```
Name: confirmar_pedido
Action: Send Message
Message:
¿Confirmas para despacho HOY? ✅

Labels to add: por-confirmar
```

#### 🚚 **Macro 5: Pedido en Proceso**
```
Name: pedido_proceso
Action: Send Message
Message:
¡Pedido confirmado! 🎉 Estamos preparando tu envío 📦
Te envío la guía de envío en los próximos minutos ⏰

Labels to add: pendiente-guia
```

---

### 5️⃣ CONFIGURAR AUTOMATIZACIONES (AUTOMATION RULES)

**Ubicación:** Settings → Automation → Add Automation Rule

#### 🤖 **Automatización 1: Auto-etiquetar nuevas conversaciones**
```
Name: Nuevas conversaciones → Por Contestar
Event: Conversation Created
Conditions:
  - Conversation Status is Open
Actions:
  - Add Label: por-contestar
```

#### 🤖 **Automatización 2: Detectar datos completos**
```
Name: Datos completos → Por Confirmar
Event: Message Created
Conditions:
  - Message contains: nombre AND ciudad AND dirección AND celular AND documento AND correo
Actions:
  - Remove Label: pendiente-datos
  - Add Label: por-confirmar
  - Send Message: "¡Perfecto! Ya tengo todos tus datos. ¿Confirmas para despacho HOY? ✅"
```

#### 🤖 **Automatización 3: Detectar confirmación**
```
Name: Confirmación → Pendiente Guía
Event: Message Created
Conditions:
  - Message contains any: sí, si, dale, listo, confirmo, ok, ✅
  - Conversation has label: por-confirmar
Actions:
  - Remove Label: por-confirmar
  - Add Label: pendiente-guia
  - Send Message: "¡Excelente! Tu pedido saldrá HOY mismo 🚀"
```

---

### 6️⃣ CONFIGURAR WEBHOOKS (OPCIONAL - PARA INTEGRACIÓN)

**Ubicación:** Settings → Integrations → Webhooks → Add Webhook

Si quieres integrar con tu dashboard o sistemas externos:

```
URL: https://tu-dominio.com/api/chatwoot/webhook
Events to subscribe:
  - conversation_created
  - conversation_updated
  - message_created
  - conversation_status_changed
```

---

### 7️⃣ CREAR VISTA PERSONALIZADA (SAVED FILTERS)

Crear filtros rápidos para cada estado:

#### 🔵 **Vista 1: Por Contestar**
```
Filter: Labels → por-contestar
Sort: Last Activity (Oldest First)
```

#### 🟡 **Vista 2: Pendiente Datos**
```
Filter: Labels → pendiente-datos
Sort: Last Activity (Oldest First)
```

#### 🟣 **Vista 3: Por Confirmar**
```
Filter: Labels → por-confirmar
Sort: Last Activity (Newest First)
```

#### 🟠 **Vista 4: Pendiente Guía**
```
Filter: Labels → pendiente-guia
Sort: Last Activity (Newest First)
```

#### 🟢 **Vista 5: Pedido Completo**
```
Filter: Labels → pedido-completo
Sort: Last Activity (Newest First)
```

---

## 🎯 RESUMEN DE CONFIGURACIÓN

### ✅ Checklist de Configuración

- [ ] 5 etiquetas personalizadas creadas
- [ ] 8 atributos personalizados creados
- [ ] 5 macros de respuesta rápida creadas
- [ ] 3 automatizaciones configuradas
- [ ] 5 vistas guardadas para filtros rápidos
- [ ] Webhook configurado (opcional)

---

## 📊 FLUJO VISUAL EN CHATWOOT

```
NUEVA CONVERSACIÓN
       ↓
[por-contestar] (Azul)
       ↓ (Cliente muestra interés)
[pendiente-datos] (Amarillo)
       ↓ (Datos completos + barrio)
[por-confirmar] (Morado)
       ↓ (Cliente confirma: sí/listo/ok)
[pendiente-guia] (Naranja)
       ↓ (Guía enviada)
[pedido-completo] (Verde)
```

---

## 🔗 INTEGRACIÓN CON TU DASHBOARD

Una vez configurado Chatwoot, podrás:

1. Conectar via API de Chatwoot
2. Sincronizar estados entre Chatwoot y tu CRM
3. Actualizar atributos automáticamente
4. Enviar mensajes programáticamente
5. Recibir webhooks de eventos

**API Key:** Settings → Profile Settings → Access Token

---

## 📝 NOTAS IMPORTANTES

⚠️ **CRÍTICO:** El barrio es OBLIGATORIO antes de mostrar resumen final
💡 **TIP:** Usa las macros con atajos de teclado para responder más rápido
🎯 **META:** Lograr que cada conversación en "por-contestar" avance a "pedido-completo"
📊 **MÉTRICA:** Medir tasa de conversión = (pedido-completo / total) * 100

---

## 🆘 SOPORTE

Si tienes dudas sobre la configuración de Chatwoot:
- Documentación oficial: https://www.chatwoot.com/docs
- API Reference: https://www.chatwoot.com/developers/api
