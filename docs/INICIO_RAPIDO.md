# 🚀 INICIO RÁPIDO: Activar CRM Automático

## ⚡ GUÍA DE 5 MINUTOS

Esta guía te permitirá tener el CRM funcionando **en menos de 5 minutos**.

---

## ✅ PASO 1: EJECUTAR MIGRACIÓN DE BASE DE DATOS (2 min)

### 🎯 **Acción:**
Crear las tablas del CRM en Supabase

### 📝 **Cómo:**

1. **Abre Supabase:**
   - Ve a: https://supabase.com
   - Inicia sesión
   - Selecciona tu proyecto "dashboard"

2. **Abre el SQL Editor:**
   - Clic en **"SQL Editor"** 📝 en la barra lateral

3. **Copia y pega el script:**
   - Abre: `scripts/030_create_crm_tables.sql`
   - Selecciona TODO (Ctrl+A)
   - Copia (Ctrl+C)
   - Pega en el SQL Editor de Supabase (Ctrl+V)

4. **Ejecuta:**
   - Clic en **"RUN"** (▶️)
   - Espera 5-10 segundos
   - Verás: ✅ "Success. No rows returned"

### ✅ **Verificación:**
```
Ir a Table Editor → Ver que existen:
- clients
- conversations
- messages
```

---

## ✅ PASO 2: VERIFICAR CONFIGURACIÓN (30 seg)

### 🎯 **Acción:**
Asegurarte de que tu app puede conectarse a Supabase

### 📝 **Cómo:**

1. **Abre el archivo `.env.local`** en la raíz del proyecto

2. **Verifica que existan estas líneas:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Si NO existen o están vacías:**
   - Ve a Supabase → Settings → API
   - Copia "Project URL" y "anon public key"
   - Pégalas en `.env.local`

### ✅ **Verificación:**
```bash
# Reiniciar el servidor
pnpm run dev
```

---

## ✅ PASO 3: PROBAR EL CRM (1 min)

### 🎯 **Acción:**
Verificar que el CRM carga correctamente

### 📝 **Cómo:**

1. **Abre el navegador:**
   - Ve a: http://localhost:3000/crm

2. **Deberías ver:**
   - ✅ Lista de conversaciones en panel izquierdo
   - ✅ 3 conversaciones de ejemplo
   - ✅ Filtros de estado funcionando
   - ✅ Al hacer clic en una conversación, se muestra el chat

3. **Prueba enviar un mensaje:**
   - Haz clic en una conversación
   - Escribe: "Hola, me interesa la balinería"
   - Presiona Enter o clic en 📤

### ✅ **Verificación:**
```
El mensaje debe aparecer en el chat
El panel derecho debe mostrar:
- Estado detectado
- Sugerencias de IA
```

---

## ✅ PASO 4: PROBAR SISTEMA AUTOMÁTICO (1 min)

### 🎯 **Acción:**
Verificar que la detección automática funciona

### 📝 **Cómo:**

1. **Selecciona la conversación de "María González"**

2. **Envía este mensaje simulando al cliente:**
   ```
   Quiero comprar balinería. Mi nombre es María González, 
   vivo en Bogotá, dirección Calle 100 #50-20 barrio Chicó, 
   mi celular es 3001234567, cédula 1234567890, 
   correo maria@test.com, método de pago anticipado
   ```

3. **Observa el panel derecho:**
   - ✅ El estado debe cambiar automáticamente
   - ✅ Debe aparecer una tarjeta azul con "Datos Detectados":
     - Nombre: María González
     - Ciudad: Bogotá
     - Barrio: ✓ Chicó
     - Teléfono: 3001234567
     - Correo: maria@test.com
     - Documento: 1234567890
     - Método de Pago: 💳 Transferencia Anticipada
   - ✅ Debe mostrar sugerencias de IA en panel morado

4. **Envía un mensaje de confirmación:**
   ```
   Sí, confirmo
   ```

5. **Observa que el estado avanza:**
   - De `pendiente-datos` → `por-confirmar`
   - Aparece animación: "Estado avanzado desde: Pendiente Datos"

### ✅ **Verificación:**
```
✅ Estado se detecta automáticamente
✅ Datos se extraen correctamente
✅ Sugerencias aparecen
✅ Transiciones funcionan
```

---

## ✅ PASO 5: PROBAR ALERTA DE BARRIO (30 seg)

### 🎯 **Acción:**
Verificar que el sistema alerta cuando falta el barrio

### 📝 **Cómo:**

1. **Selecciona otra conversación o crea una nueva**

2. **Envía un mensaje SIN mencionar el barrio:**
   ```
   Quiero comprar. Mi nombre es Carlos Ramírez, 
   vivo en Medellín, dirección Carrera 50 #20-10, 
   celular 3009876543, cédula 9876543210, 
   correo carlos@test.com, pago contraentrega
   ```

3. **Observa el panel derecho:**
   - ❌ Debe aparecer una **ALERTA ROJA:**
     ```
     ⚠️ CRÍTICO: Falta el BARRIO para calcular 
     el valor del envío. Sin este dato no se 
     puede mostrar el resumen final.
     ```
   - ✅ Los demás datos SÍ deben aparecer en la tarjeta azul
   - ⚠️ El estado NO debe avanzar a `por-confirmar`

4. **Ahora envía el barrio:**
   ```
   El barrio es El Poblado
   ```

5. **Observa que:**
   - ✅ La alerta roja desaparece
   - ✅ Aparece "Barrio: ✓ El Poblado" en la tarjeta azul
   - ✅ El estado ahora SÍ puede avanzar

### ✅ **Verificación:**
```
✅ Sistema bloquea sin barrio
✅ Alerta roja aparece
✅ Cuando se proporciona barrio, permite avanzar
```

---

## 🎉 ¡LISTO! TU CRM ESTÁ FUNCIONANDO

### ✅ **Lo que acabas de lograr:**

- ✅ Base de datos creada en Supabase
- ✅ 3 tablas con relaciones y triggers
- ✅ Interfaz de CRM funcionando
- ✅ Detección automática de estados
- ✅ Extracción automática de datos
- ✅ Sugerencias de IA en tiempo real
- ✅ Validación estricta de barrio
- ✅ Sistema completo operativo

---

## 📚 SIGUIENTE PASO: DOCUMENTACIÓN COMPLETA

Para configuraciones avanzadas:

### 📖 **Documentos Disponibles:**

1. **`RESUMEN_EJECUTIVO_CRM.md`**
   - Visión completa del sistema
   - Arquitectura
   - Flujos de estados
   - Métricas esperadas

2. **`SUPABASE_SETUP_CRM.md`**
   - Guía detallada de Supabase
   - Verificaciones paso a paso
   - Troubleshooting
   - Políticas RLS para producción

3. **`CHATWOOT_SETUP.md`**
   - Configurar etiquetas en Chatwoot
   - Atributos personalizados
   - Macros de respuesta rápida
   - Automatizaciones

### 🔗 **Ubicación:**
```
docs/
├── RESUMEN_EJECUTIVO_CRM.md
├── SUPABASE_SETUP_CRM.md
└── CHATWOOT_SETUP.md
```

---

## 🎯 PRÓXIMOS PASOS OPCIONALES

### 1️⃣ **Integrar con Chatwoot** (20 min)
- Seguir: `docs/CHATWOOT_SETUP.md`
- Crear etiquetas, atributos y macros
- Configurar webhooks

### 2️⃣ **Conectar con BuilderBot** (30 min)
- Crear flujo en BuilderBot
- Webhook a `/api/chatwoot/webhook`
- Auto-respuestas basadas en sugerencias

### 3️⃣ **Activar Realtime** (5 min)
- Supabase → Database → Replication
- Habilitar en `conversations` y `messages`
- Mensajes aparecerán sin refrescar

### 4️⃣ **Dashboard de Métricas** (1 hora)
- Crear página `/crm/metrics`
- Mostrar conversiones por estado
- Tiempo promedio por estado
- Gráfico de embudo de ventas

### 5️⃣ **Políticas RLS para Producción** (15 min)
- Eliminar políticas permisivas
- Crear políticas basadas en `auth.uid()`
- Proteger datos de clientes

---

## 🆘 ¿PROBLEMAS?

### ❌ **No carga el CRM:**
- Verifica `.env.local`
- Reinicia servidor: `pnpm run dev`
- Revisa consola del navegador (F12)

### ❌ **Error 401 Unauthorized:**
- API Key incorrecta
- Regenera en Supabase → Settings → API

### ❌ **No aparecen conversaciones:**
- Verifica que ejecutaste el script SQL
- Revisa en Supabase → Table Editor
- Debe haber 3 conversaciones de ejemplo

### ❌ **Sistema automático no funciona:**
- Verifica que los imports están correctos
- Revisa consola del navegador por errores
- Verifica que `useEstadoAutomatico` se llama

---

## 📞 MÁS AYUDA

- **Docs:** `docs/SUPABASE_SETUP_CRM.md` → Sección "Troubleshooting"
- **Código:** Revisa comentarios en los archivos fuente
- **Logs:** Consola del navegador (F12) + Consola de Supabase

---

## 🎊 ¡FELICITACIONES!

Tienes un **CRM empresarial de última generación** con:
- ✅ Automatización inteligente
- ✅ Detección de intenciones con IA
- ✅ Extracción automática de datos
- ✅ Validaciones estrictas
- ✅ Sugerencias contextuales
- ✅ Interfaz moderna y fluida

**¡Ahora a cerrar ese 97% de conversiones! 🚀💰**

---

**Tiempo total de setup:** ~5 minutos  
**Dificultad:** ⭐⭐☆☆☆ (Fácil)  
**Resultado:** CRM completamente funcional
