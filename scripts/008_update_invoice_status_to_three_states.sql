-- Actualizar la tabla de facturas para usar solo 3 estados: PAGADO, PENDIENTE, DEVOLUCION
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Actualizar estados existentes
UPDATE public.invoices SET status = 'PENDIENTE' WHERE status IN ('pending', 'overdue');
UPDATE public.invoices SET status = 'PAGADO' WHERE status = 'paid';
UPDATE public.invoices SET status = 'DEVOLUCION' WHERE status = 'cancelled';

-- Agregar nueva restricción con solo 3 estados
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('PAGADO', 'PENDIENTE', 'DEVOLUCION'));

-- Actualizar el valor por defecto
ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT 'PENDIENTE';
