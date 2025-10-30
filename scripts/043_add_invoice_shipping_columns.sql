-- Script para agregar columnas faltantes a la tabla invoices
-- Fecha: 2025-10-29
-- Propósito: Agregar campos de envío, ubicación y evidencia

-- Agregar columnas de ubicación
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS barrio TEXT;

-- Agregar columnas de envío
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS guia TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS vendedor TEXT DEFAULT 'Sistema';

-- Agregar columna de evidencia fotográfica
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS evidencia TEXT;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_invoices_ciudad ON public.invoices(ciudad);
CREATE INDEX IF NOT EXISTS idx_invoices_guia ON public.invoices(guia);
CREATE INDEX IF NOT EXISTS idx_invoices_transportadora ON public.invoices(transportadora);

-- Comentarios para documentación
COMMENT ON COLUMN public.invoices.ciudad IS 'Ciudad de entrega del pedido';
COMMENT ON COLUMN public.invoices.barrio IS 'Barrio de entrega del pedido';
COMMENT ON COLUMN public.invoices.guia IS 'Número de guía de envío';
COMMENT ON COLUMN public.invoices.transportadora IS 'Empresa transportadora';
COMMENT ON COLUMN public.invoices.vendedor IS 'Vendedor que procesó la factura';
COMMENT ON COLUMN public.invoices.evidencia IS 'URL de la evidencia fotográfica de entrega';

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
  AND column_name IN ('ciudad', 'barrio', 'guia', 'transportadora', 'vendedor', 'evidencia')
ORDER BY column_name;

