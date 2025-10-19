-- Agregar columnas de guía y transportadora a la tabla de facturas
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS guia TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS transportadora TEXT NOT NULL DEFAULT '';

-- Actualizar facturas existentes con datos de ejemplo
UPDATE public.invoices
SET 
  guia = CASE 
    WHEN invoice_number = 'FAC-2025-0001' THEN 'GUIA-2025-001'
    WHEN invoice_number = 'FAC-2025-0002' THEN 'GUIA-2025-002'
    WHEN invoice_number = 'FAC-2025-0003' THEN 'GUIA-2025-003'
    ELSE 'GUIA-' || SUBSTRING(invoice_number FROM 9)
  END,
  transportadora = CASE 
    WHEN invoice_number = 'FAC-2025-0001' THEN 'Servientrega'
    WHEN invoice_number = 'FAC-2025-0002' THEN 'Coordinadora'
    WHEN invoice_number = 'FAC-2025-0003' THEN 'Interrapidisimo'
    ELSE 'Coordinadora'
  END
WHERE guia = '' OR transportadora = '';

-- Crear índice para búsquedas por guía
CREATE INDEX IF NOT EXISTS idx_invoices_guia ON public.invoices(guia);
CREATE INDEX IF NOT EXISTS idx_invoices_transportadora ON public.invoices(transportadora);
