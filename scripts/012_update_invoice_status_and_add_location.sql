-- Actualizar estados de facturas a ENTREGADO, PENDIENTE PAGO, PAGADO
-- Agregar campos de ciudad y barrio

-- Agregar columnas de ciudad y barrio
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS barrio TEXT;

-- Actualizar el constraint de status para los nuevos estados
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('ENTREGADO', 'PENDIENTE PAGO', 'PAGADO'));

-- Migrar estados existentes a los nuevos
UPDATE public.invoices 
SET status = CASE 
  WHEN status IN ('paid', 'PAGADO') THEN 'PAGADO'
  WHEN status IN ('pending', 'PENDIENTE', 'overdue') THEN 'PENDIENTE PAGO'
  WHEN status IN ('cancelled', 'DEVOLUCION') THEN 'PENDIENTE PAGO'
  ELSE 'PENDIENTE PAGO'
END;

-- Actualizar facturas de ejemplo con datos de ciudad y barrio
UPDATE public.invoices 
SET ciudad = 'Cúcuta', barrio = 'Centro'
WHERE invoice_number = 'FAC-2025-0001';

UPDATE public.invoices 
SET ciudad = 'Villa del Rosario', barrio = 'Lomitas del Trapiche'
WHERE invoice_number = 'FAC-2025-0002';

UPDATE public.invoices 
SET ciudad = 'Cúcuta', barrio = 'La Libertad'
WHERE invoice_number = 'FAC-2025-0003';

-- Actualizar la tabla de ventas para usar los mismos estados
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_status_check;

ALTER TABLE public.sales 
ADD CONSTRAINT sales_status_check 
CHECK (status IN ('ENTREGADO', 'PENDIENTE PAGO', 'PAGADO'));

-- Migrar estados de ventas
UPDATE public.sales 
SET status = CASE 
  WHEN status IN ('Completada', 'Entregado', 'ENTREGADO') THEN 'ENTREGADO'
  WHEN status IN ('Pendiente', 'PENDIENTE') THEN 'PENDIENTE PAGO'
  WHEN status IN ('PAGADO') THEN 'PAGADO'
  ELSE 'PENDIENTE PAGO'
END;

-- Actualizar el trigger para sincronizar estados entre facturas y ventas
DROP TRIGGER IF EXISTS sync_invoice_status_to_sale ON public.invoices;
DROP FUNCTION IF EXISTS sync_invoice_status_to_sale();

CREATE OR REPLACE FUNCTION sync_invoice_status_to_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el estado de la venta asociada cuando cambia el estado de la factura
  UPDATE public.sales
  SET status = NEW.status
  WHERE invoice_number = NEW.invoice_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_invoice_status_to_sale
AFTER UPDATE OF status ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_status_to_sale();
