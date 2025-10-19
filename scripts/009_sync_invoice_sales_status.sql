-- Actualizar la tabla de ventas para usar los mismos 3 estados que las facturas
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;

ALTER TABLE public.sales ADD CONSTRAINT sales_status_check 
CHECK (status IN ('PAGADO', 'PENDIENTE', 'DEVOLUCION'));

-- Migrar los estados existentes de ventas a los nuevos estados
UPDATE public.sales 
SET status = CASE 
  WHEN LOWER(status) IN ('completada', 'entregado') THEN 'PAGADO'
  WHEN LOWER(status) IN ('pendiente', 'procesando') THEN 'PENDIENTE'
  WHEN LOWER(status) IN ('cancelada', 'devolucion', 'novedad') THEN 'DEVOLUCION'
  ELSE 'PENDIENTE'
END;

-- Crear función para sincronizar el estado de la factura con la venta
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

-- Crear trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS sync_invoice_to_sale_trigger ON public.invoices;
CREATE TRIGGER sync_invoice_to_sale_trigger
AFTER UPDATE OF status ON public.invoices
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_invoice_status_to_sale();

-- Sincronizar estados actuales de facturas a ventas
UPDATE public.sales s
SET status = i.status
FROM public.invoices i
WHERE s.invoice_number = i.invoice_number
AND s.status != i.status;
