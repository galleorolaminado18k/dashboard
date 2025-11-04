-- ============================================================================
-- Migration 052: Agregar columnas faltantes a invoices para sync con MiPaquete
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- ============================================================================

-- Agregar columnas faltantes a la tabla invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS products JSONB,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invoices_guia ON public.invoices(guia) WHERE guia IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_campaign_id ON public.invoices(campaign_id) WHERE campaign_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.invoices.shipping_cost IS 'Costo de envío (sin IVA)';
COMMENT ON COLUMN public.invoices.products IS 'Productos en formato JSONB para sincronización con sales';
COMMENT ON COLUMN public.invoices.guia IS 'Número de guía de envío (para tracking con MiPaquete)';
COMMENT ON COLUMN public.invoices.campaign_id IS 'ID de campaña de marketing asociada';

-- Verificar columnas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'invoices'
AND column_name IN ('shipping_cost', 'products', 'guia', 'ciudad', 'campaign_id')
ORDER BY ordinal_position;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- shipping_cost | numeric      | YES | 0
-- products      | jsonb        | YES | NULL
-- guia          | text         | YES | NULL
-- ciudad        | text         | YES | NULL
-- campaign_id   | text         | YES | NULL

