-- Actualizar los estados del sistema a: PAGADO, PENDIENTE PAGO, DEVOLUCION
-- Este script actualiza la restricción de estados y migra los datos existentes

-- 1. Eliminar la restricción anterior de estados
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- 2. Agregar la nueva restricción con los 3 estados correctos
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('PAGADO', 'PENDIENTE PAGO', 'DEVOLUCION'));

ALTER TABLE sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('PAGADO', 'PENDIENTE PAGO', 'DEVOLUCION'));

-- 3. Migrar los estados existentes
UPDATE invoices SET status = 'DEVOLUCION' WHERE LOWER(status) IN ('entregado', 'devolucion', 'devolución');
UPDATE invoices SET status = 'PAGADO' WHERE LOWER(status) = 'pagado';
UPDATE invoices SET status = 'PENDIENTE PAGO' WHERE LOWER(status) IN ('pendiente pago', 'pendiente');

UPDATE sales SET status = 'DEVOLUCION' WHERE LOWER(status) IN ('entregado', 'devolucion', 'devolución') OR is_return = true;
UPDATE sales SET status = 'PAGADO' WHERE LOWER(status) = 'pagado';
UPDATE sales SET status = 'PENDIENTE PAGO' WHERE LOWER(status) IN ('pendiente pago', 'pendiente', 'completada');

-- 4. Actualizar el trigger para sincronizar estados entre facturas y ventas
CREATE OR REPLACE FUNCTION sync_invoice_status_to_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la factura tiene una venta asociada, actualizar el estado de la venta
  IF NEW.sale_id IS NOT NULL THEN
    UPDATE sales 
    SET status = NEW.status
    WHERE id = NEW.sale_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_sync_invoice_status ON invoices;
CREATE TRIGGER trigger_sync_invoice_status
  AFTER INSERT OR UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_status_to_sale();

-- 5. Comentario explicativo
COMMENT ON CONSTRAINT invoices_status_check ON invoices IS 
  'Estados válidos: PAGADO (ya se recibió el pago), PENDIENTE PAGO (contraentrega/crédito), DEVOLUCION (producto devuelto)';

COMMENT ON CONSTRAINT sales_status_check ON sales IS 
  'Estados válidos: PAGADO (ya se recibió el pago), PENDIENTE PAGO (contraentrega/crédito), DEVOLUCION (producto devuelto)';
