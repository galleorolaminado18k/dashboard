# 🎯 GUÍA AUTOMÁTICA: Ejecutar SQL en Supabase

## ✅ MÉTODO SIMPLE (RECOMENDADO) - 2 MINUTOS

Ya tengo tus credenciales configuradas. Ahora solo necesitas **copiar y pegar** el SQL.

---

## 📋 **PASO A PASO MUY SIMPLE:**

### 1️⃣ **Abre Supabase** (30 segundos)

1. Abre tu navegador
2. Ve a: https://supabase.com/dashboard/project/eyrdjtsgpubazdtgywiv
3. Si pide login, inicia sesión

### 2️⃣ **Abre el SQL Editor** (10 segundos)

1. En el menú lateral izquierdo busca **"SQL Editor"** 📝
2. Haz clic en **"SQL Editor"**
3. Verás un editor en blanco

### 3️⃣ **Copia el SQL** (20 segundos)

**OPCIÓN A - Desde el archivo:**
1. Abre el archivo: `scripts/030_create_crm_tables.sql`
2. Selecciona TODO (Ctrl+A)
3. Copia (Ctrl+C)

**OPCIÓN B - Desde aquí (copiar todo lo de abajo):**

```sql
-- ============================================
-- SCRIPT DE MIGRACIÓN CRM AUTOMÁTICO
-- Versión: 1.0
-- Fecha: Octubre 2025
-- ============================================

-- Crear enum para estados de conversación
CREATE TYPE conversation_status AS ENUM (
  'por-contestar',
  'pendiente-datos',
  'por-confirmar',
  'pendiente-guia',
  'pedido-completo'
);

-- Crear enum para tipo de remitente de mensaje
CREATE TYPE message_sender AS ENUM ('agent', 'client');

-- Tabla de clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  type TEXT CHECK (type IN ('nuevo', 'recurrente')),
  interest TEXT CHECK (interest IN ('balinería', 'joyería')),
  address TEXT,
  city TEXT,
  department TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de conversaciones
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status conversation_status DEFAULT 'por-contestar',
  canal TEXT CHECK (canal IN ('whatsapp', 'instagram', 'messenger', 'web', 'telefono')),
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender message_sender,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para clients
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar last_message en conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_message cuando se crea un mensaje
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Índices para mejorar rendimiento
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);

-- Políticas RLS (Row Level Security) - PERMISIVAS PARA DESARROLLO
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política permisiva para clients (permitir todo en desarrollo)
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON clients FOR DELETE USING (true);

-- Política permisiva para conversations
CREATE POLICY "Enable read access for all users" ON conversations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON conversations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON conversations FOR DELETE USING (true);

-- Política permisiva para messages
CREATE POLICY "Enable read access for all users" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON messages FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON messages FOR DELETE USING (true);

-- Datos de ejemplo
INSERT INTO clients (name, email, phone, type, interest, city, avatar_url) VALUES
  ('María González', 'maria@example.com', '3001234567', 'nuevo', 'balinería', 'Bogotá', '/diverse-woman-portrait.png'),
  ('Carlos Ramírez', 'carlos@example.com', '3009876543', 'recurrente', 'joyería', 'Medellín', '/man.jpg'),
  ('Ana Martínez', 'ana@example.com', '3005556789', 'nuevo', 'joyería', 'Cali', '/woman-2.jpg');

-- Crear conversaciones para los clientes de ejemplo
INSERT INTO conversations (client_id, status, canal, last_message, is_active)
SELECT 
  c.id,
  CASE 
    WHEN c.name = 'María González' THEN 'por-contestar'::conversation_status
    WHEN c.name = 'Carlos Ramírez' THEN 'pendiente-guia'::conversation_status
    ELSE 'por-confirmar'::conversation_status
  END,
  CASE 
    WHEN c.name = 'María González' THEN 'whatsapp'
    WHEN c.name = 'Carlos Ramírez' THEN 'instagram'
    ELSE 'web'
  END,
  CASE 
    WHEN c.name = 'María González' THEN 'Hola, quiero información sobre balinería'
    WHEN c.name = 'Carlos Ramírez' THEN '¿Cuándo llega mi pedido?'
    ELSE 'Perfecto, confirmo la compra'
  END,
  true
FROM clients c;

-- Crear mensajes de ejemplo
INSERT INTO messages (conversation_id, sender, content, is_read)
SELECT 
  conv.id,
  'client'::message_sender,
  CASE 
    WHEN c.name = 'María González' THEN 'Hola, quiero información sobre balinería'
    WHEN c.name = 'Carlos Ramírez' THEN '¿Cuándo llega mi pedido?'
    ELSE 'Perfecto, confirmo la compra'
  END,
  false
FROM conversations conv
JOIN clients c ON conv.client_id = c.id;
```

### 4️⃣ **Pega y Ejecuta** (30 segundos)

1. En el SQL Editor de Supabase, pega el código (Ctrl+V)
2. Haz clic en el botón **"RUN"** ▶️ (abajo a la derecha)
3. Espera 5-10 segundos

### 5️⃣ **Verifica el Resultado** (20 segundos)

✅ **Mensaje de éxito:**
```
Success. No rows returned
```

Si ves ese mensaje, ¡TODO SALIÓ PERFECTO! 🎉

---

## 🔍 **VERIFICACIÓN RÁPIDA**

### Ver las tablas creadas:

1. En Supabase, ve a **"Table Editor"** 📊
2. Deberías ver estas 3 tablas nuevas:
   - ✅ `clients` (con 3 filas)
   - ✅ `conversations` (con 3 filas)
   - ✅ `messages` (con 3 filas)

### Ver los datos de ejemplo:

1. Haz clic en la tabla **`clients`**
2. Deberías ver:
   - María González
   - Carlos Ramírez
   - Ana Martínez

---

## ❌ **SI ALGO SALE MAL**

### Error: "already exists"

Significa que ya ejecutaste el script antes. Solución:

1. En SQL Editor, ejecuta esto primero:
```sql
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TYPE IF EXISTS conversation_status CASCADE;
DROP TYPE IF EXISTS message_sender CASCADE;
```

2. Luego ejecuta el script principal de nuevo

---

## ✅ **SIGUIENTE PASO**

Una vez que veas el mensaje "Success":

1. Cierra el terminal si está corriendo
2. Ejecuta en el terminal de VS Code:
```bash
pnpm run dev
```

3. Abre el navegador en: http://localhost:3000/crm

4. ¡Deberías ver las 3 conversaciones de ejemplo! 🎉

---

## 📞 **¿NECESITAS AYUDA?**

Si ves algún error que no entiendes:
1. Copia el mensaje de error completo
2. Dímelo y yo te ayudo a resolverlo

---

**Tiempo total:** 2 minutos  
**Dificultad:** ⭐☆☆☆☆ (Muy fácil)

---

## 🛒 **PASO EXTRA: Historial de Compras (OPCIONAL)**

Si quieres ver el **historial de compras** de cada cliente:

### 1️⃣ **Ejecuta el segundo script:**

1. Abre de nuevo el SQL Editor en Supabase
2. Copia el contenido del archivo: `scripts/031_create_purchases_table.sql`
3. Pégalo en el editor
4. Haz clic en **"RUN"** ▶️

### 2️⃣ **Verifica:**

Deberías ver una nueva tabla: ✅ `purchases` (con 3 compras de ejemplo)

**Datos de ejemplo**:
- María González: Vestido Midi Floral ($320.000) + Aretes ($50.000)
- Carlos Ramírez: Shorts de Mezclilla ($560.000)
- Ana Martínez: Bolso de Hombro ($200.000)

---

**¿Para qué sirve?**
- Ver QUÉ compró cada cliente
- Calcular totales automáticamente
- Tracking de entregas con código de guía
- Analytics de ventas por cliente
