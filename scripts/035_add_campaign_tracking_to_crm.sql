-- =====================================================
-- SCRIPT 035: Agregar tracking de campañas al CRM
-- =====================================================
-- Descripción: Agrega campos para rastrear de qué campaña/anuncio
--              proviene cada conversación, permitiendo calcular
--              métricas reales de conversión y ROI
-- =====================================================

-- 1. Agregar campos de tracking a la tabla conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS adset_id TEXT,
ADD COLUMN IF NOT EXISTS ad_id TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- 2. Crear índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_conversations_campaign_id ON conversations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversations_adset_id ON conversations(adset_id);
CREATE INDEX IF NOT EXISTS idx_conversations_ad_id ON conversations(ad_id);
CREATE INDEX IF NOT EXISTS idx_conversations_utm_campaign ON conversations(utm_campaign);

-- 3. Comentarios para documentar
COMMENT ON COLUMN conversations.campaign_id IS 'ID de la campaña de Meta Ads que generó esta conversación';
COMMENT ON COLUMN conversations.adset_id IS 'ID del conjunto de anuncios de Meta Ads';
COMMENT ON COLUMN conversations.ad_id IS 'ID del anuncio específico de Meta Ads';
COMMENT ON COLUMN conversations.utm_source IS 'Fuente UTM (facebook, instagram, etc.)';
COMMENT ON COLUMN conversations.utm_medium IS 'Medio UTM (cpc, social, etc.)';
COMMENT ON COLUMN conversations.utm_campaign IS 'Nombre de la campaña UTM';
COMMENT ON COLUMN conversations.utm_content IS 'Contenido UTM (variante del anuncio)';
COMMENT ON COLUMN conversations.utm_term IS 'Término UTM (palabra clave)';

-- 4. Actualizar ventas existentes con campaign_id desde conversations
-- (solo si hay campaign_id en conversations)
UPDATE sales s
SET campaign_id = c.campaign_id
FROM conversations c
WHERE s.client_phone = (
  SELECT cl.phone
  FROM clients cl
  WHERE cl.id = c.client_id
)
AND c.campaign_id IS NOT NULL
AND s.campaign_id IS NULL;


