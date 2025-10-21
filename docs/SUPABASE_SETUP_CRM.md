# 🗄️ GUÍA COMPLETA: Configurar Base de Datos CRM en Supabase

## 📋 RESUMEN

Esta guía te llevará paso a paso para crear las tablas del CRM en Supabase, ejecutar la migración SQL, verificar que todo funcione correctamente y habilitar las políticas de seguridad.

---

## 🎯 PASO 1: ACCEDER A SUPABASE

### 1️⃣ **Ir al Dashboard de Supabase**

1. Abre tu navegador y ve a: https://supabase.com
2. Haz clic en **"Sign In"** (arriba a la derecha)
3. Inicia sesión con tu cuenta (GitHub, Google, o email)

### 2️⃣ **Seleccionar tu Proyecto**

1. En el dashboard, verás la lista de tus proyectos
2. Haz clic en el proyecto **"dashboard"** o el nombre que le hayas dado
3. Espera a que cargue el proyecto (puede tardar unos segundos)

---

## 🗃️ PASO 2: CREAR LAS TABLAS DEL CRM

### 1️⃣ **Abrir el Editor SQL**

1. En la barra lateral izquierda, busca el icono de **"SQL Editor"** 📝
2. Haz clic en **"SQL Editor"**
3. Verás un editor de código SQL en blanco

### 2️⃣ **Copiar el Script de Migración**

1. Abre el archivo: `scripts/030_create_crm_tables.sql`
2. Copia **TODO EL CONTENIDO** del archivo (Ctrl+A, Ctrl+C)

### 3️⃣ **Pegar y Ejecutar el Script**

1. En el editor SQL de Supabase, pega el contenido copiado (Ctrl+V)
2. Verás el código SQL completo (aproximadamente 150 líneas)
3. Haz clic en el botón **"RUN"** (▶️) en la esquina inferior derecha
4. Espera a que se ejecute (puede tardar 5-10 segundos)

### 4️⃣ **Verificar que se Ejecutó Correctamente**

✅ **Mensaje de Éxito:**
```
Success. No rows returned
```

❌ **Si hay un Error:**
- Lee el mensaje de error cuidadosamente
- Verifica que no haya tablas con el mismo nombre ya creadas
- Si dice "already exists", elimina las tablas antiguas primero (ver sección de troubleshooting)

---

## 🔍 PASO 3: VERIFICAR LAS TABLAS CREADAS

### 1️⃣ **Ir al Table Editor**

1. En la barra lateral izquierda, haz clic en **"Table Editor"** 📊
2. Verás la lista de todas tus tablas

### 2️⃣ **Verificar que Existan las 3 Tablas del CRM:**

Deberías ver estas tablas nuevas:

#### ✅ **Tabla 1: `clients`**
- **Propósito:** Almacenar información de clientes
- **Columnas clave:**
  - `id` (UUID, clave primaria)
  - `name` (TEXT, nombre del cliente)
  - `email` (TEXT, correo)
  - `phone` (TEXT, teléfono)
  - `avatar_url` (TEXT, URL de la foto)
  - `type` (TEXT, tipo de cliente: "nuevo" o "recurrente")
  - `interest` (TEXT, interés: "balinería" o "joyería")
  - `address` (TEXT, dirección completa)
  - `city` (TEXT, ciudad)
  - `department` (TEXT, departamento)
  - `notes` (TEXT, notas adicionales)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

#### ✅ **Tabla 2: `conversations`**
- **Propósito:** Gestionar conversaciones del CRM
- **Columnas clave:**
  - `id` (UUID, clave primaria)
  - `client_id` (UUID, referencia a `clients`)
  - `status` (ENUM, estado de la conversación)
  - `canal` (TEXT, canal de comunicación)
  - `last_message` (TEXT, último mensaje)
  - `unread_count` (INTEGER, mensajes sin leer)
  - `is_active` (BOOLEAN, si está activa)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

#### ✅ **Tabla 3: `messages`**
- **Propósito:** Almacenar mensajes individuales
- **Columnas clave:**
  - `id` (UUID, clave primaria)
  - `conversation_id` (UUID, referencia a `conversations`)
  - `sender` (ENUM, quién envió: "agent" o "client")
  - `content` (TEXT, contenido del mensaje)
  - `is_read` (BOOLEAN, si fue leído)
  - `created_at` (TIMESTAMP)

### 3️⃣ **Verificar el Enum de Estados**

1. En el menú lateral, ve a **"Database"** → **"Types"**
2. Busca el tipo llamado **`conversation_status`**
3. Debe tener estos valores:
   - `por-contestar`
   - `pendiente-datos`
   - `por-confirmar`
   - `pendiente-guia`
   - `pedido-completo`

### 4️⃣ **Verificar el Enum de Sender**

1. En **"Database"** → **"Types"**
2. Busca el tipo llamado **`message_sender`**
3. Debe tener estos valores:
   - `agent`
   - `client`

---

## 🔐 PASO 4: CONFIGURAR ROW LEVEL SECURITY (RLS)

### ⚠️ **IMPORTANTE: Modo Desarrollo vs Producción**

El script que ejecutaste ya creó políticas **PERMISIVAS** para desarrollo. Esto significa que **CUALQUIER USUARIO PUEDE VER Y EDITAR TODO**.

### 📋 **Verificar Políticas Actuales:**

1. Ve a **"Authentication"** → **"Policies"**
2. Selecciona la tabla **`clients`**
3. Deberías ver estas políticas:
   - ✅ **Enable read access for all users**
   - ✅ **Enable insert access for all users**
   - ✅ **Enable update access for all users**
   - ✅ **Enable delete access for all users**

4. Repite para las tablas **`conversations`** y **`messages`**

### 🔒 **Para PRODUCCIÓN (cuando tengas usuarios reales):**

Cuando tu app esté lista para producción, deberás **ELIMINAR** estas políticas permisivas y crear políticas más restrictivas:

#### 🛡️ **Política de Ejemplo para Producción:**

```sql
-- Solo permitir ver conversaciones del usuario autenticado
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Solo permitir insertar mensajes en conversaciones propias
CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

**🚨 NO EJECUTES ESTO AHORA** - Solo cuando vayas a lanzar en producción.

---

## 🗂️ PASO 5: VERIFICAR DATOS DE EJEMPLO

### 1️⃣ **Ver Clientes de Ejemplo**

1. Ve a **"Table Editor"**
2. Haz clic en la tabla **`clients`**
3. Deberías ver **3 clientes de ejemplo:**
   - María González (nueva, balinería)
   - Carlos Ramírez (recurrente, joyería)
   - Ana Martínez (nueva, joyería)

### 2️⃣ **Ver Conversaciones de Ejemplo**

1. Haz clic en la tabla **`conversations`**
2. Deberías ver **3 conversaciones:**
   - Conversación de María (estado: `por-contestar`)
   - Conversación de Carlos (estado: `pendiente-guia`)
   - Conversación de Ana (estado: `por-confirmar`)

### 3️⃣ **Ver Mensajes de Ejemplo**

1. Haz clic en la tabla **`messages`**
2. Deberías ver varios mensajes de prueba

### 🗑️ **Eliminar Datos de Ejemplo (Opcional):**

Si quieres empezar con la base de datos limpia:

```sql
-- Ejecuta esto en el SQL Editor
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM clients;
```

**⚠️ CUIDADO:** Esto elimina TODOS los datos de las tablas.

---

## 🔧 PASO 6: CONFIGURAR TRIGGERS Y FUNCIONES

### ✅ **Verificar que los Triggers Existen:**

1. Ve a **"Database"** → **"Functions"**
2. Deberías ver estas funciones:
   - **`update_updated_at_column`**: Actualiza automáticamente el campo `updated_at`
   - **`update_conversation_last_message`**: Actualiza el último mensaje de la conversación

3. Ve a **"Database"** → **"Triggers"**
4. Deberías ver estos triggers:
   - **`update_clients_updated_at`** en tabla `clients`
   - **`update_conversations_updated_at`** en tabla `conversations`
   - **`update_conversation_last_message_trigger`** en tabla `messages`

### 🧪 **Probar los Triggers:**

Ejecuta esto en el SQL Editor para probar:

```sql
-- Insertar un nuevo cliente
INSERT INTO clients (name, email, phone, type, interest)
VALUES ('Prueba Trigger', 'prueba@test.com', '3001234567', 'nuevo', 'balinería')
RETURNING id, created_at, updated_at;

-- Verificar que updated_at se creó correctamente
SELECT id, name, created_at, updated_at FROM clients WHERE name = 'Prueba Trigger';

-- Eliminar el cliente de prueba
DELETE FROM clients WHERE name = 'Prueba Trigger';
```

---

## 🔗 PASO 7: CONFIGURAR LA CONEXIÓN EN TU APP

### 1️⃣ **Obtener las Credenciales de Supabase**

1. En Supabase, ve a **"Settings"** (⚙️) → **"API"**
2. Copia estos valores:

#### 📋 **Project URL:**
```
https://[tu-proyecto].supabase.co
```

#### 🔑 **API Key (anon public):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2️⃣ **Actualizar el Archivo `.env.local`**

1. En tu proyecto, abre el archivo `.env.local` (si no existe, créalo en la raíz)
2. Agrega o actualiza estas variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Guarda el archivo

### 3️⃣ **Verificar que tu App se Conecta Correctamente**

1. Detén el servidor de desarrollo si está corriendo (Ctrl+C)
2. Reinicia el servidor:
   ```bash
   pnpm run dev
   ```
3. Ve a: http://localhost:3000/crm
4. Deberías ver las conversaciones de ejemplo cargadas desde Supabase

---

## 📊 PASO 8: CREAR ÍNDICES PARA RENDIMIENTO

### 1️⃣ **Verificar que los Índices Existen**

Los índices deberían haberse creado automáticamente con el script. Para verificar:

1. Ve a **"Database"** → **"Indexes"**
2. Deberías ver estos índices:

#### 📇 **Índices en `conversations`:**
- `idx_conversations_client_id` (en columna `client_id`)
- `idx_conversations_status` (en columna `status`)
- `idx_conversations_updated_at` (en columna `updated_at`)

#### 📇 **Índices en `messages`:**
- `idx_messages_conversation_id` (en columna `conversation_id`)
- `idx_messages_created_at` (en columna `created_at`)

#### 📇 **Índices en `clients`:**
- `idx_clients_email` (en columna `email`)
- `idx_clients_phone` (en columna `phone`)

### 🚀 **¿Por qué son Importantes?**

Los índices **aceleran las consultas** hasta 100x. Sin índices, Supabase tiene que leer TODA la tabla para encontrar datos. Con índices, encuentra datos instantáneamente.

---

## 🧪 PASO 9: PROBAR EL SISTEMA COMPLETO

### 1️⃣ **Probar Inserción de Cliente**

Ejecuta en SQL Editor:

```sql
-- Insertar nuevo cliente
INSERT INTO clients (name, email, phone, type, interest, city, address)
VALUES (
  'Cliente de Prueba',
  'prueba@galle.com',
  '3001234567',
  'nuevo',
  'balinería',
  'Bogotá',
  'Calle 100 #50-20'
)
RETURNING *;
```

### 2️⃣ **Probar Creación de Conversación**

```sql
-- Crear conversación para el nuevo cliente
-- Reemplaza [CLIENT_ID] con el ID del cliente que acabas de crear
INSERT INTO conversations (client_id, status, canal, is_active)
VALUES (
  '[CLIENT_ID]',
  'por-contestar',
  'whatsapp',
  true
)
RETURNING *;
```

### 3️⃣ **Probar Envío de Mensaje**

```sql
-- Enviar mensaje en la conversación
-- Reemplaza [CONVERSATION_ID] con el ID de la conversación que creaste
INSERT INTO messages (conversation_id, sender, content, is_read)
VALUES (
  '[CONVERSATION_ID]',
  'client',
  'Hola, quiero información sobre balinería',
  false
)
RETURNING *;
```

### 4️⃣ **Verificar que el Trigger Actualizó la Conversación**

```sql
-- Ver que last_message se actualizó automáticamente
SELECT id, last_message, updated_at
FROM conversations
WHERE id = '[CONVERSATION_ID]';
```

✅ **Resultado Esperado:** `last_message` debe mostrar "Hola, quiero información sobre balinería"

---

## 🔄 PASO 10: CONFIGURAR REALTIME (OPCIONAL)

### 📡 **Habilitar Actualizaciones en Tiempo Real**

Si quieres que tu CRM se actualice automáticamente cuando llegan nuevos mensajes:

1. Ve a **"Database"** → **"Replication"**
2. En la lista de tablas, busca:
   - `conversations`
   - `messages`
3. Haz clic en el botón junto a cada tabla para **habilitar Realtime**
4. El icono cambiará de rojo 🔴 a verde 🟢

### 🧪 **Probar Realtime:**

Abre dos ventanas del navegador:
1. Ventana 1: http://localhost:3000/crm
2. Ventana 2: Supabase Table Editor → tabla `messages`

En la ventana 2, inserta un mensaje manualmente.
En la ventana 1, el mensaje debería aparecer automáticamente en 1-2 segundos.

---

## 🛠️ TROUBLESHOOTING: SOLUCIÓN DE PROBLEMAS

### ❌ **Error: "relation already exists"**

**Problema:** Las tablas ya existen en la base de datos.

**Solución:**
```sql
-- Ejecutar esto primero para eliminar todo
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TYPE IF EXISTS conversation_status CASCADE;
DROP TYPE IF EXISTS message_sender CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- Luego ejecutar de nuevo el script 030_create_crm_tables.sql
```

### ❌ **Error: "permission denied"**

**Problema:** No tienes permisos de administrador en Supabase.

**Solución:**
1. Verifica que iniciaste sesión con la cuenta correcta
2. Asegúrate de que eres el dueño del proyecto
3. Si es un proyecto compartido, pide permisos de admin

### ❌ **Error: "function does not exist"**

**Problema:** Las funciones de triggers no se crearon.

**Solución:**
```sql
-- Crear la función manualmente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### ❌ **Error: "RLS enabled but no policies exist"**

**Problema:** RLS está habilitado pero no hay políticas.

**Solución temporal (solo desarrollo):**
```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

**⚠️ NO USES ESTO EN PRODUCCIÓN**

### ❌ **La app no carga datos**

**Problema:** La conexión a Supabase no está configurada.

**Checklist:**
- ✅ Verificar que `.env.local` existe
- ✅ Verificar que `NEXT_PUBLIC_SUPABASE_URL` es correcta
- ✅ Verificar que `NEXT_PUBLIC_SUPABASE_ANON_KEY` es correcta
- ✅ Reiniciar el servidor (`pnpm run dev`)
- ✅ Revisar la consola del navegador (F12) por errores

### ❌ **Error 401: Unauthorized**

**Problema:** La API Key es incorrecta o expiró.

**Solución:**
1. Ve a Supabase → Settings → API
2. Regenera la API Key (botón "Regenerate API Key")
3. Actualiza el `.env.local` con la nueva key
4. Reinicia el servidor

---

## ✅ CHECKLIST FINAL

Antes de continuar, verifica que completaste todo:

### 📋 **Base de Datos:**
- [ ] Las 3 tablas existen (`clients`, `conversations`, `messages`)
- [ ] Los 2 enums existen (`conversation_status`, `message_sender`)
- [ ] Los índices están creados
- [ ] Las políticas RLS están activas
- [ ] Los triggers funcionan correctamente
- [ ] Hay datos de ejemplo (o limpiaste la BD)

### 📋 **Configuración de la App:**
- [ ] El archivo `.env.local` existe
- [ ] Las variables de Supabase están configuradas
- [ ] El servidor se reinició después de cambiar `.env.local`
- [ ] La página `/crm` carga sin errores
- [ ] Las conversaciones se muestran correctamente

### 📋 **Funcionalidad:**
- [ ] Puedes ver las conversaciones
- [ ] Puedes hacer clic en una conversación y ver los mensajes
- [ ] Puedes enviar un mensaje nuevo
- [ ] El sistema automático detecta estados
- [ ] Las sugerencias de IA se muestran
- [ ] Las alertas de datos faltantes aparecen

---

## 🚀 SIGUIENTE PASO

Una vez que completaste todo esto, ya tienes el CRM funcionando con:

✅ Base de datos en Supabase
✅ Sistema automático de estados de Karla García
✅ Detección inteligente de intenciones
✅ Extracción automática de datos de clientes
✅ Sugerencias de IA en tiempo real
✅ Alertas de datos críticos faltantes

### 🎯 **Ahora Puedes:**

1. **Probar el flujo completo** enviando mensajes en el CRM
2. **Ver cómo el sistema detecta automáticamente** el estado de cada conversación
3. **Recibir sugerencias inteligentes** sobre qué responder
4. **Integrar con Chatwoot** usando la guía `CHATWOOT_SETUP.md`
5. **Conectar con BuilderBot** para automatizar respuestas

---

## 📚 RECURSOS ADICIONALES

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Realtime en Supabase](https://supabase.com/docs/guides/realtime)

---

## 🆘 ¿NECESITAS AYUDA?

Si tienes problemas:

1. Revisa la sección de **Troubleshooting** arriba
2. Verifica la consola del navegador (F12) por errores
3. Revisa los logs de Supabase en el dashboard
4. Consulta la documentación oficial de Supabase

---

**¡Felicitaciones! 🎉 Tu CRM con sistema automático de Karla García está listo para usar.**
