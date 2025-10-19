-- Script definitivo para corregir TODOS los estados del sistema
-- Solo existen 3 estados válidos: ENTREGADO, PENDIENTE PAGO, PAGADO

-- PASO 1: Actualizar la tabla de ventas para usar SOLO los 3 estados válidos
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('entregado', 'pendiente pago', 'pagado'));

-- PASO 2: Actualizar TODAS las ventas existentes a los nuevos estados
-- Mapeo de estados antiguos a nuevos:
-- 'completada' -> 'entregado'
-- 'pendiente' -> 'pendiente pago'
-- 'entregada' -> 'entregado'
-- cualquier otro -> 'pendiente pago'

UPDATE public.sales
SET status = CASE 
  WHEN LOWER(status) IN ('completada', 'entregada', 'entregado') THEN 'entregado'
  WHEN LOWER(status) IN ('pendiente', 'pendiente pago') THEN 'pendiente pago'
  WHEN LOWER(status) IN ('pagado', 'pagada') THEN 'pagado'
  ELSE 'pendiente pago'
END;

-- PASO 3: Sincronizar estados de ventas con sus facturas (si existen)
-- El estado de la factura es el estado maestro
UPDATE public.sales s
SET status = i.status
FROM public.invoices i
WHERE s.sale_id = i.sale_id
  AND i.status IS NOT NULL;

-- PASO 4: Recrear el trigger para mantener sincronización automática
DROP TRIGGER IF EXISTS sync_invoice_status_to_sale ON public.invoices;
DROP FUNCTION IF EXISTS sync_invoice_status_to_sale();

CREATE OR REPLACE FUNCTION sync_invoice_status_to_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el estado de una factura, actualizar la venta asociada
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.sales
    SET status = NEW.status
    WHERE sale_id = NEW.sale_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_invoice_status_to_sale
AFTER UPDATE OF status ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_status_to_sale();

-- PASO 5: Actualizar datos de ejemplo para que coincidan con facturas
-- VT-001 tiene factura FAC-2025-0001
-- VT-002 tiene factura FAC-2025-0002  
-- VT-003 tiene factura FAC-2025-0003

-- Verificar y actualizar basado en las facturas existentes
UPDATE public.sales s
SET status = (
  SELECT i.status 
  FROM public.invoices i 
  WHERE i.sale_id = s.sale_id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM public.invoices i WHERE i.sale_id = s.sale_id
);
