-- Cambiar el formato de número de factura a formato simple: 100001, 100002, etc.

-- Eliminar la función anterior
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

-- Crear nueva función para generar números simples empezando desde 100001
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  sequence_num INTEGER;
  new_invoice_number TEXT;
BEGIN
  -- Obtener el número más alto actual y sumarle 1
  -- Si no hay facturas, empezar desde 100001
  SELECT COALESCE(MAX(CAST(invoice_number AS INTEGER)), 100000) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number ~ '^\d+$'; -- Solo números
  
  new_invoice_number := sequence_num::TEXT;
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Eliminar datos de ejemplo antiguos
DELETE FROM public.invoice_items;
DELETE FROM public.invoices;

-- Insertar nuevos datos de ejemplo con el formato correcto
INSERT INTO public.invoices (invoice_number, client_name, client_nit, client_email, client_phone, issue_date, due_date, subtotal, tax_amount, total, status, payment_method)
VALUES 
  ('100001', 'María González', '900123456-7', 'maria@example.com', '3001234567', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 250000, 47500, 297500, 'PAGADO', 'transferencia'),
  ('100002', 'Carlos Rodríguez', '900234567-8', 'carlos@example.com', '3002345678', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 180000, 34200, 214200, 'PENDIENTE PAGO', 'contraentrega'),
  ('100003', 'Laura Martínez', '900345678-9', 'laura@example.com', '3003456789', NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', 420000, 79800, 499800, 'PENDIENTE PAGO', 'contraentrega');

-- Insertar items de ejemplo
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
VALUES 
  ('100001', 'Anillo de Plata', 2, 125000, 250000),
  ('100002', 'Cadena de Oro 18k', 1, 180000, 180000),
  ('100003', 'Aretes de Oro', 1, 420000, 420000);
