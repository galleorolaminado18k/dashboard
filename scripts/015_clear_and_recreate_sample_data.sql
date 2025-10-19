-- Limpiar todos los datos de ejemplo existentes
DELETE FROM public.invoice_items;
DELETE FROM public.invoices;
DELETE FROM public.sales;

-- Reiniciar las secuencias si existen
-- (Esto asegura que los IDs comiencen desde 1 nuevamente)

-- Crear facturas de ejemplo con la lógica correcta de estados
-- REGLA: 
-- - Efectivo o Transferencia → Estado: PAGADO (porque ya se pagó)
-- - Contraentrega → Estado: PENDIENTE PAGO (porque se paga al recibir)

INSERT INTO public.invoices (
  invoice_number, 
  sale_id, 
  client_name, 
  client_nit, 
  client_email, 
  client_phone, 
  client_address,
  city,
  neighborhood,
  issue_date, 
  due_date, 
  subtotal, 
  tax, 
  total, 
  status, 
  payment_method,
  tracking_number,
  shipping_company,
  notes
) VALUES
-- Factura 1: Transferencia → PAGADO
('FAC-2025-0001', 'VT-001', 'María González', '1234567890', 'maria.gonzalez@email.com', '3001234567', 
 'Calle 45 #23-10', 'Bogotá', 'Chapinero', 
 '2025-01-07', '2025-01-22', 285000, 0, 285000, 
 'pagado', 'transferencia', 'SERV-2025-001', 'Servientrega', 
 'Cliente frecuente - Entrega prioritaria'),

-- Factura 2: Efectivo → PAGADO
('FAC-2025-0002', 'VT-002', 'Carlos Rodríguez', '9876543210', 'carlos.rodriguez@email.com', '3009876543',
 'Carrera 15 #67-89', 'Medellín', 'El Poblado',
 '2025-01-07', '2025-01-22', 125000, 0, 125000,
 'pagado', 'efectivo', 'COORD-2025-001', 'Coordinadora',
 'Pago en efectivo recibido'),

-- Factura 3: Contraentrega → PENDIENTE PAGO
('FAC-2025-0003', 'VT-003', 'Laura Martínez', '5555666677', 'laura.martinez@email.com', '3015551234',
 'Avenida 68 #45-12', 'Cali', 'Ciudad Jardín',
 '2025-01-06', '2025-01-21', 450000, 0, 450000,
 'pendiente pago', 'contraentrega', 'INTER-2025-001', 'Interrapidisimo',
 'Pago contra entrega - Verificar al entregar'),

-- Factura 4: Transferencia → PAGADO (ya entregado)
('FAC-2025-0004', 'VT-004', 'Pedro Sánchez', '1122334455', 'pedro.sanchez@email.com', '3007778888',
 'Calle 100 #15-20', 'Barranquilla', 'El Prado',
 '2025-01-06', '2025-01-21', 320000, 0, 320000,
 'entregado', 'transferencia', 'SERV-2025-002', 'Servientrega',
 'Entrega confirmada - Cliente satisfecho'),

-- Factura 5: Efectivo → PAGADO
('FAC-2025-0005', 'VT-005', 'Sofía Ramírez', '9988776655', 'sofia.ramirez@email.com', '3012223333',
 'Carrera 7 #32-41', 'Cartagena', 'Bocagrande',
 '2025-01-05', '2025-01-20', 190000, 0, 190000,
 'pagado', 'efectivo', 'COORD-2025-002', 'Coordinadora',
 'Pago en efectivo - Factura entregada'),

-- Factura 6: Contraentrega → PENDIENTE PAGO
('FAC-2025-0006', 'VT-006', 'Diego Torres', '4433221100', 'diego.torres@email.com', '3018889999',
 'Calle 85 #50-30', 'Bucaramanga', 'Cabecera',
 '2025-01-05', '2025-01-20', 280000, 0, 280000,
 'pendiente pago', 'contraentrega', 'INTER-2025-002', 'Interrapidisimo',
 'Contraentrega - Cobrar al entregar');

-- Crear los items de las facturas
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total) VALUES
-- Items para Factura 1
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0001'), 'Balín de Oro 18k', 2, 142500, 285000),

-- Items para Factura 2
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0002'), 'Anillo de Plata 925', 1, 125000, 125000),

-- Items para Factura 3
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0003'), 'Balín Premium', 3, 150000, 450000),

-- Items para Factura 4
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0004'), 'Aretes de Oro 18k', 1, 320000, 320000),

-- Items para Factura 5
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0005'), 'Cadena de Plata 925', 2, 95000, 190000),

-- Items para Factura 6
((SELECT id FROM public.invoices WHERE invoice_number = 'FAC-2025-0006'), 'Pulsera de Oro 18k', 1, 280000, 280000);

-- Crear las ventas asociadas a las facturas
-- Las ventas heredan automáticamente el estado de sus facturas
INSERT INTO public.sales (
  sale_id, 
  client_name, 
  client_phone, 
  client_email, 
  sale_date, 
  products, 
  total, 
  status, 
  payment_method, 
  seller_name, 
  shipping_company, 
  tracking_number,
  invoice_number
) VALUES
('VT-001', 'María González', '3001234567', 'maria.gonzalez@email.com', 
 '2025-01-07 10:30:00', 
 '[{"name": "Balín de Oro 18k", "quantity": 2, "price": 142500}]', 
 285000, 'pagado', 'transferencia', 'Juan Pérez', 
 'Servientrega', 'SERV-2025-001', 'FAC-2025-0001'),

('VT-002', 'Carlos Rodríguez', '3009876543', 'carlos.rodriguez@email.com', 
 '2025-01-07 14:20:00', 
 '[{"name": "Anillo de Plata 925", "quantity": 1, "price": 125000}]', 
 125000, 'pagado', 'efectivo', 'Ana López', 
 'Coordinadora', 'COORD-2025-001', 'FAC-2025-0002'),

('VT-003', 'Laura Martínez', '3015551234', 'laura.martinez@email.com', 
 '2025-01-06 09:15:00', 
 '[{"name": "Balín Premium", "quantity": 3, "price": 150000}]', 
 450000, 'pendiente pago', 'contraentrega', 'Juan Pérez', 
 'Interrapidisimo', 'INTER-2025-001', 'FAC-2025-0003'),

('VT-004', 'Pedro Sánchez', '3007778888', 'pedro.sanchez@email.com', 
 '2025-01-06 16:45:00', 
 '[{"name": "Aretes de Oro 18k", "quantity": 1, "price": 320000}]', 
 320000, 'entregado', 'transferencia', 'Ana López', 
 'Servientrega', 'SERV-2025-002', 'FAC-2025-0004'),

('VT-005', 'Sofía Ramírez', '3012223333', 'sofia.ramirez@email.com', 
 '2025-01-05 11:00:00', 
 '[{"name": "Cadena de Plata 925", "quantity": 2, "price": 95000}]', 
 190000, 'pagado', 'efectivo', 'Juan Pérez', 
 'Coordinadora', 'COORD-2025-002', 'FAC-2025-0005'),

('VT-006', 'Diego Torres', '3018889999', 'diego.torres@email.com', 
 '2025-01-05 13:30:00', 
 '[{"name": "Pulsera de Oro 18k", "quantity": 1, "price": 280000}]', 
 280000, 'pendiente pago', 'contraentrega', 'Ana López', 
 'Interrapidisimo', 'INTER-2025-002', 'FAC-2025-0006');
