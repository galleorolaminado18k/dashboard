-- Actualizar la función de generación de números de factura para empezar desde 10001

DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_invoice_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Cambiar la numeración para empezar desde 10001 en lugar de 0001
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'FAC-' || year_part || '-(.*)') AS INTEGER)), 10000) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'FAC-' || year_part || '-%';
  
  -- Usar 5 dígitos en lugar de 4 para acomodar números desde 10001
  new_invoice_number := 'FAC-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Eliminar datos de ejemplo antiguos
DELETE FROM public.invoice_items;
DELETE FROM public.invoices;

-- Crear nuevos datos de ejemplo con numeración desde 10001
INSERT INTO public.invoices (
  invoice_number,
  client_name,
  client_nit,
  client_email,
  client_phone,
  client_address,
  ciudad,
  barrio,
  issue_date,
  due_date,
  subtotal,
  tax_rate,
  tax_amount,
  total,
  status,
  payment_method,
  guia,
  transportadora,
  notes
) VALUES
-- Factura 1: PAGADO (Transferencia)
(
  'FAC-2025-10001',
  'María González',
  '900123456-7',
  'maria.gonzalez@email.com',
  '3001234567',
  'Calle 123 #45-67',
  'Bogotá',
  'Chapinero',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '23 days',
  210084.03,
  19.00,
  39915.97,
  250000.00,
  'PAGADO',
  'Transferencia',
  'GUIA-2025-001',
  'Servientrega',
  'Pago confirmado por transferencia bancaria'
),
-- Factura 2: PAGADO (Efectivo)
(
  'FAC-2025-10002',
  'Carlos Rodríguez',
  '900234567-8',
  'carlos.rodriguez@email.com',
  '3009876543',
  'Carrera 45 #12-34',
  'Cúcuta',
  'Centro',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '25 days',
  105042.02,
  19.00,
  19957.98,
  125000.00,
  'PAGADO',
  'Efectivo',
  'GUIA-2025-002',
  'Coordinadora',
  'Pago recibido en efectivo'
),
-- Factura 3: PENDIENTE PAGO (Contraentrega)
(
  'FAC-2025-10003',
  'Laura Martínez',
  '900345678-9',
  'laura.martinez@email.com',
  '3015551234',
  'Avenida 67 #89-12',
  'Medellín',
  'El Poblado',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '27 days',
  378151.26,
  19.00,
  71848.74,
  450000.00,
  'PENDIENTE PAGO',
  'Contraentrega',
  'GUIA-2025-003',
  'Interrapidisimo',
  'Pago pendiente - Contraentrega'
);

-- Insertar items de las facturas
INSERT INTO public.invoice_items (invoice_id, description, referencia, quantity, unit_price, total)
VALUES
-- Items de factura 10001
('FAC-2025-10001', 'Balín de Oro 18k', 'BAL-ORO-001', 1, 210084.03, 210084.03),

-- Items de factura 10002
('FAC-2025-10002', 'Anillo de Plata 925', 'ANI-PLA-002', 1, 105042.02, 105042.02),

-- Items de factura 10003
('FAC-2025-10003', 'Balín Premium', 'BAL-PRE-003', 1, 378151.26, 378151.26);

-- Actualizar las ventas para que coincidan con las nuevas facturas
DELETE FROM public.sales;

INSERT INTO public.sales (
  sale_id,
  client_name,
  client_nit,
  client_email,
  client_phone,
  client_address,
  sale_date,
  total_amount,
  status,
  payment_method,
  notes,
  transportadora,
  guia,
  invoice_number,
  seller_name
) VALUES
-- Venta 1: Asociada a FAC-2025-10001 (PAGADO)
(
  'VT-001',
  'María González',
  '900123456-7',
  'maria.gonzalez@email.com',
  '3001234567',
  'Calle 123 #45-67',
  NOW() - INTERVAL '7 days',
  250000.00,
  'PAGADO',
  'Transferencia',
  'Venta completada',
  'Servientrega',
  'GUIA-2025-001',
  'FAC-2025-10001',
  'Juan Pérez'
),
-- Venta 2: Asociada a FAC-2025-10002 (PAGADO)
(
  'VT-002',
  'Carlos Rodríguez',
  '900234567-8',
  'carlos.rodriguez@email.com',
  '3009876543',
  'Carrera 45 #12-34',
  NOW() - INTERVAL '5 days',
  125000.00,
  'PAGADO',
  'Efectivo',
  'Venta completada',
  'Coordinadora',
  'GUIA-2025-002',
  'FAC-2025-10002',
  'Ana López'
),
-- Venta 3: Asociada a FAC-2025-10003 (PENDIENTE PAGO)
(
  'VT-003',
  'Laura Martínez',
  '900345678-9',
  'laura.martinez@email.com',
  '3015551234',
  'Avenida 67 #89-12',
  NOW() - INTERVAL '3 days',
  450000.00,
  'PENDIENTE PAGO',
  'Contraentrega',
  'Pago pendiente',
  'Interrapidisimo',
  'GUIA-2025-003',
  'FAC-2025-10003',
  'Juan Pérez'
);
