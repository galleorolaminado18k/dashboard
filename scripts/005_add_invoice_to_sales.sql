-- Agregar columna invoice_number a la tabla sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS invoice_number TEXT REFERENCES public.invoices(invoice_number) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales(invoice_number);

-- Comentario para documentar la relación
COMMENT ON COLUMN public.sales.invoice_number IS 'Número de factura asociado a esta venta';
