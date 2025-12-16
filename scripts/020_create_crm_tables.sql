-- =====================================================
-- Migración: Crear tablas CRM para WhatsApp
-- Fecha: 2024-12-16
-- Descripción: Tablas para gestionar conversaciones y
--              mensajes de WhatsApp en el CRM
-- =====================================================

-- Tabla de conversaciones del CRM
CREATE TABLE IF NOT EXISTS crm_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    last_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    unread INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'por-contestar',
    canal VARCHAR(50) DEFAULT 'whatsapp',
    avatar TEXT,
    client_type VARCHAR(20) DEFAULT 'Nuevo',
    interest VARCHAR(100),
    assigned_agent UUID,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Índices para búsquedas rápidas
    CONSTRAINT unique_phone UNIQUE (phone)
);

-- Índices para crm_conversations
CREATE INDEX IF NOT EXISTS idx_crm_conversations_status ON crm_conversations(status);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_canal ON crm_conversations(canal);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_timestamp ON crm_conversations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_phone ON crm_conversations(phone);

-- Tabla de mensajes del CRM
CREATE TABLE IF NOT EXISTS crm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('client', 'agent')),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio', 'video', 'document')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para crm_messages
CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation ON crm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_timestamp ON crm_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_sender ON crm_messages(sender);

-- Tabla para configuración de filtros y reglas del CRM
CREATE TABLE IF NOT EXISTS crm_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para agentes del CRM
CREATE TABLE IF NOT EXISTS crm_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar TEXT,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
    max_conversations INTEGER DEFAULT 10,
    current_conversations INTEGER DEFAULT 0,
    skills TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para historial de asignaciones
CREATE TABLE IF NOT EXISTS crm_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES crm_agents(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    reason TEXT
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_crm_conversations_updated_at ON crm_conversations;
CREATE TRIGGER update_crm_conversations_updated_at
    BEFORE UPDATE ON crm_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_filters_updated_at ON crm_filters;
CREATE TRIGGER update_crm_filters_updated_at
    BEFORE UPDATE ON crm_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_agents_updated_at ON crm_agents;
CREATE TRIGGER update_crm_agents_updated_at
    BEFORE UPDATE ON crm_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todo para usuarios autenticados por ahora)
CREATE POLICY "Allow all for authenticated users" ON crm_conversations
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON crm_messages
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON crm_filters
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON crm_agents
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON crm_assignments
    FOR ALL USING (true);

-- Insertar filtros predeterminados
INSERT INTO crm_filters (name, description, conditions, actions, priority) VALUES
(
    'Auto-asignar Balinería',
    'Asigna automáticamente conversaciones sobre balinería',
    '{"interest": "Balinería"}',
    '{"assign_to": "balineria_team", "set_status": "por-contestar"}',
    10
),
(
    'Auto-asignar Joyería',
    'Asigna automáticamente conversaciones sobre joyería',
    '{"interest": "Joyería"}',
    '{"assign_to": "joyeria_team", "set_status": "por-contestar"}',
    10
),
(
    'Priorizar Devoluciones',
    'Marca devoluciones como alta prioridad',
    '{"status": "devolucion"}',
    '{"priority": "high", "notify": true}',
    20
),
(
    'Clientes Recurrentes',
    'Marca clientes recurrentes para atención especial',
    '{"client_type": "Recurrente"}',
    '{"tag": "vip", "priority": "medium"}',
    5
)
ON CONFLICT DO NOTHING;

-- Comentarios
COMMENT ON TABLE crm_conversations IS 'Conversaciones del CRM desde WhatsApp y otros canales';
COMMENT ON TABLE crm_messages IS 'Mensajes individuales de cada conversación';
COMMENT ON TABLE crm_filters IS 'Reglas de filtrado y distribución automática';
COMMENT ON TABLE crm_agents IS 'Agentes del equipo de atención';
COMMENT ON TABLE crm_assignments IS 'Historial de asignaciones de conversaciones';

