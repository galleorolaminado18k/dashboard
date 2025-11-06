-- Migration: 056_dashboard_config_table.sql
-- Descripción: Tabla para configuración avanzada del dashboard (WAHA, integraciones)
-- Fecha: 2025-11-06
-- Ejecutar en: Supabase SQL Editor

-- Crear tabla para configuración avanzada del dashboard
CREATE TABLE IF NOT EXISTS dashboard_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_dashboard_config CHECK (id = 1)
);

-- Comentarios
COMMENT ON TABLE dashboard_config IS 'Configuración avanzada del dashboard (WAHA WhatsApp, integraciones)';
COMMENT ON COLUMN dashboard_config.id IS 'ID fijo = 1 para una sola configuración';
COMMENT ON COLUMN dashboard_config.config IS 'JSON con configuración: WAHA, MiPaquete, Supabase, etc';

-- RLS
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Permitir lectura dashboard_config"
  ON dashboard_config
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir actualización dashboard_config"
  ON dashboard_config
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir inserción dashboard_config inicial"
  ON dashboard_config
  FOR INSERT
  WITH CHECK (id = 1 AND NOT EXISTS (SELECT 1 FROM dashboard_config WHERE id = 1));

-- Índice
CREATE INDEX IF NOT EXISTS idx_dashboard_config_jsonb ON dashboard_config USING GIN (config);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_dashboard_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboard_config_updated_at_trigger ON dashboard_config;
CREATE TRIGGER update_dashboard_config_updated_at_trigger
  BEFORE UPDATE ON dashboard_config
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_config_updated_at();

-- Insertar configuración inicial
INSERT INTO dashboard_config (id, config)
VALUES (1, '{
  "wahaEnabled": false,
  "wahaApiKey": "",
  "wahaUrl": "http://localhost:3000",
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

-- Verificar
SELECT
  'dashboard_config' as tabla,
  COUNT(*) as registros,
  pg_size_pretty(pg_total_relation_size('dashboard_config')) as tamaño
FROM dashboard_config;

