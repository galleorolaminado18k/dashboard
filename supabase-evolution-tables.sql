-- ===================================================
-- SCRIPT SQL: Evolution API - Tablas en Supabase
-- Copiar y pegar en Supabase SQL Editor
-- ===================================================

-- Tabla para almacenar sesiones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(255) UNIQUE NOT NULL,
  session_data JSONB,
  status VARCHAR(50) DEFAULT 'disconnected',
  qr_code TEXT,
  phone_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_connected_at TIMESTAMPTZ
);

-- Tabla para mensajes de WhatsApp (opcional)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(255) NOT NULL,
  message_id VARCHAR(255),
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  message_type VARCHAR(50),
  message_body TEXT,
  media_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para webhooks/eventos
CREATE TABLE IF NOT EXISTS whatsapp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_name ON whatsapp_sessions(session_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session ON whatsapp_messages(session_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_session ON whatsapp_events(session_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_type ON whatsapp_events(event_type);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para whatsapp_sessions
DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permitir acceso a usuarios autenticados
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_events ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (ajustar según tus necesidades)
-- Por ahora, permitir todo acceso al service_role
CREATE POLICY "Allow all for service role" ON whatsapp_sessions
    FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON whatsapp_messages
    FOR ALL USING (true);

CREATE POLICY "Allow all for service role" ON whatsapp_events
    FOR ALL USING (true);

-- Confirmar creación
SELECT 'Tablas de WhatsApp creadas exitosamente en Supabase' AS mensaje;

