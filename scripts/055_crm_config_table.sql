-- Migration: 055_crm_config_table.sql
-- Descripción: Tabla para almacenar la configuración del CRM y integraciones
-- Fecha: 2025-11-06
-- Ejecutar en: Supabase SQL Editor

-- Crear tabla para configuración del CRM
CREATE TABLE IF NOT EXISTS crm_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_config CHECK (id = 1)
);

-- Comentarios de la tabla
COMMENT ON TABLE crm_config IS 'Configuración del CRM y integraciones (WhatsApp, MiPaquete, Supabase, etc)';
COMMENT ON COLUMN crm_config.id IS 'ID fijo = 1 para garantizar una sola fila de configuración';
COMMENT ON COLUMN crm_config.config IS 'JSON con toda la configuración del CRM';

-- Row Level Security (RLS)
ALTER TABLE crm_config ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de configuración"
  ON crm_config
  FOR SELECT
  USING (true);

-- Política: Permitir actualización a todos los usuarios autenticados
CREATE POLICY "Permitir actualización de configuración"
  ON crm_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Permitir inserción solo si no existe
CREATE POLICY "Permitir inserción de configuración inicial"
  ON crm_config
  FOR INSERT
  WITH CHECK (id = 1 AND NOT EXISTS (SELECT 1 FROM crm_config WHERE id = 1));

-- Índice para búsquedas en el JSON
CREATE INDEX IF NOT EXISTS idx_crm_config_jsonb ON crm_config USING GIN (config);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_crm_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_crm_config_updated_at_trigger ON crm_config;
CREATE TRIGGER update_crm_config_updated_at_trigger
  BEFORE UPDATE ON crm_config
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_config_updated_at();

-- Insertar configuración inicial por defecto (opcional)
INSERT INTO crm_config (id, config)
VALUES (1, '{
  "whatsappBusinessPhone": "",
  "whatsappQRCode": "",
  "apiKeyMiPaquete": "",
  "sessionTrackerMiPaquete": "",
  "supabaseUrl": "",
  "supabaseAnonKey": "",
  "emailNotifications": "",
  "webhookUrl": "",
  "companyName": "Comercializadora Gale18k",
  "companyLogo": ""
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Verificar que la tabla se creó correctamente
SELECT
  'crm_config' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('crm_config')) as tamaño
FROM crm_config;

