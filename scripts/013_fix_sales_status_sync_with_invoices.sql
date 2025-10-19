-- Script para sincronizar correctamente los estados entre ventas y facturas
-- Los nuevos estados son: ENTREGADO, PENDIENTE PAGO, PAGADO

-- Paso 1: Actualizar los estados de las ventas que tienen facturas asociadas
-- El estado de la venta debe ser el mismo que el de su factura
UPDATE public.sales s
SET status = i.status
FROM public.invoices i
WHERE s.invoice_id = i.invoice_id
AND s.status != i.status;

-- Paso 2: Para las ventas sin factura, asignar estado basado en el método de pago
-- Si es efectivo o transferencia -> PAGADO
-- Si es contraentrega -> PENDIENTE PAGO
UPDATE public.sales
SET status = CASE 
  WHEN payment_method IN ('efectivo', 'transferencia') THEN 'PAGADO'
  WHEN payment_method = 'contraentrega' THEN 'PENDIENTE PAGO'
  ELSE status
END
WHERE invoice_id IS NULL;

-- Paso 3: Actualizar datos de ejemplo para que coincidan con las facturas
-- VT-001 tiene factura FAC-2025-0001
UPDATE public.sales 
SET status = (SELECT status FROM public.invoices WHERE invoice_number = 'FAC-2025-0001')
WHERE sale_id = 'VT-001';

-- VT-002 tiene factura FAC-2025-0002
UPDATE public.sales 
SET status = (SELECT status FROM public.invoices WHERE invoice_number = 'FAC-2025-0002')
WHERE sale_id = 'VT-002';

-- VT-003 tiene factura FAC-2025-0003
UPDATE public.sales 
SET status = (SELECT status FROM public.invoices WHERE invoice_number = 'FAC-2025-0003')
WHERE sale_id = 'VT-003';

-- Paso 4: Recrear el trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_invoice_status_to_sale ON public.invoices;
DROP FUNCTION IF EXISTS sync_invoice_status_to_sale();

CREATE OR REPLACE FUNCTION sync_invoice_status_to_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el estado de una factura, actualizar el estado de la venta asociada
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.sales
    SET status = NEW.status
    WHERE invoice_id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_invoice_status_to_sale
AFTER UPDATE OF status ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_status_to_sale();

-- Paso 5: Crear trigger para asignar estado inicial al crear factura
DROP TRIGGER IF EXISTS set_initial_invoice_status ON public.invoices;
DROP FUNCTION IF EXISTS set_initial_invoice_status();

CREATE OR REPLACE FUNCTION set_initial_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se especifica un estado, asignarlo basado en el método de pago
  IF NEW.status IS NULL THEN
    NEW.status = CASE 
      WHEN NEW.payment_method IN ('efectivo', 'transferencia') THEN 'PAGADO'
      WHEN NEW.payment_method = 'contraentrega' THEN 'PENDIENTE PAGO'
      ELSE 'PENDIENTE PAGO'
    END;
  END IF;
  
  -- Actualizar el estado de la venta asociada si existe
  IF NEW.sale_id IS NOT NULL THEN
    UPDATE public.sales
    SET status = NEW.status
    WHERE sale_id = NEW.sale_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_initial_invoice_status
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION set_initial_invoice_status();
