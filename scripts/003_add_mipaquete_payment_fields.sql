-- Agregar campo para marcar ventas de contraentrega como pagadas por MiPaquete
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS paid_by_mipaquete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Índice para mejorar consultas de pagos de MiPaquete
CREATE INDEX IF NOT EXISTS idx_sales_paid_by_mipaquete ON public.sales(paid_by_mipaquete);
CREATE INDEX IF NOT EXISTS idx_sales_payment_date ON public.sales(payment_date);
