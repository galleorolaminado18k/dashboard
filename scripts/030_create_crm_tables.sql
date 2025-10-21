-- =====================================================
-- SCRIPT 030: Crear tablas para CRM (Gestión de Clientes)
-- =====================================================
-- Descripción: Crea las tablas necesarias para el módulo CRM:
--   - clients: Información de clientes
--   - conversations: Conversaciones con clientes
--   - messages: Mensajes de cada conversación
-- =====================================================

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  client_type VARCHAR(50) DEFAULT 'Nuevo', -- 'Nuevo' o 'Recurrente'
  interest VARCHAR(100), -- 'Joyería', 'Balinería', etc.
  address TEXT,
  city VARCHAR(100),
  department VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'por-contestar', -- Estados: por-contestar, pendiente-datos, por-confirmar, pendiente-guia, pedido-completo
  canal VARCHAR(50) NOT NULL, -- whatsapp, instagram, messenger, web, telefono
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Mensajes
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'client' o 'agent'
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_active ON conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar último mensaje en conversación
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.sender = 'client' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- RLS (Row Level Security) - Permitir todas las operaciones por ahora
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política permisiva para desarrollo (CAMBIAR EN PRODUCCIÓN)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);

-- =====================================================
-- DATOS DE EJEMPLO PARA PRUEBAS
-- =====================================================

-- Insertar clientes de ejemplo
INSERT INTO clients (id, name, email, phone, avatar_url, client_type, interest, city, department) VALUES
  ('11111111-1111-1111-1111-111111111111', 'María González', 'maria.gonzalez@email.com', '+57 300 123 4567', '/diverse-woman-portrait.png', 'Nuevo', 'Balinería', 'Bogotá', 'Cundinamarca'),
  ('22222222-2222-2222-2222-222222222222', 'Carlos Ramírez', 'carlos.ramirez@email.com', '+57 301 234 5678', '/man.jpg', 'Recurrente', 'Joyería', 'Medellín', 'Antioquia'),
  ('33333333-3333-3333-3333-333333333333', 'Ana Martínez', 'ana.martinez@email.com', '+57 302 345 6789', '/woman-2.jpg', 'Nuevo', 'Balinería', 'Cali', 'Valle del Cauca')
ON CONFLICT (id) DO NOTHING;

-- Insertar conversaciones de ejemplo
INSERT INTO conversations (id, client_id, status, canal, last_message, unread_count) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'por-contestar', 'whatsapp', 'Hola, quiero información sobre balinería', 2),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'pendiente-guia', 'instagram', '¿Cuándo llega mi pedido?', 0),
  ('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'por-confirmar', 'web', 'Perfecto, confirmo la compra', 0)
ON CONFLICT (id) DO NOTHING;

-- Insertar mensajes de ejemplo
INSERT INTO messages (conversation_id, sender, content, is_read) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'client', 'Hola, quiero información sobre balinería', false),
  ('aaaa1111-1111-1111-1111-111111111111', 'agent', '¡Hola María! Claro, con gusto te ayudo. Tenemos una hermosa colección de balinería disponible. ¿Qué tipo de pieza estás buscando?', true),
  ('aaaa1111-1111-1111-1111-111111111111', 'client', 'Me interesan los aretes y collares. ¿Cuáles son los precios?', false),
  ('bbbb2222-2222-2222-2222-222222222222', 'client', '¿Cuándo llega mi pedido?', true),
  ('bbbb2222-2222-2222-2222-222222222222', 'agent', 'Hola Carlos, tu pedido ya fue despachado y llegará en 2-3 días hábiles.', true),
  ('cccc3333-3333-3333-3333-333333333333', 'client', 'Me interesa este collar', false),
  ('cccc3333-3333-3333-3333-333333333333', 'agent', 'Excelente elección Ana, el collar está disponible. El precio es $250.000 COP', true),
  ('cccc3333-3333-3333-3333-333333333333', 'client', 'Perfecto, confirmo la compra', false);

COMMENT ON TABLE clients IS 'Información de clientes del CRM';
COMMENT ON TABLE conversations IS 'Conversaciones activas con clientes';
COMMENT ON TABLE messages IS 'Mensajes de cada conversación';
