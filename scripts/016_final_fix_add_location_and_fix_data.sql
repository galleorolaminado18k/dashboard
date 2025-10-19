-- Script final para corregir la base de datos y los datos de ejemplo
-- Este script:
-- 1. Agrega las columnas ciudad y barrio a invoices
-- 2. Limpia todos los datos de ejemplo
-- 3. Crea nuevos datos de ejemplo con la lógica correcta
-- 4. Crea el trigger para sincronizar estados entre facturas y ventas

-- Paso 1: Agregar columnas de ubicación a invoices si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'ciudad') THEN
        ALTER TABLE invoices ADD COLUMN ciudad TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'barrio') THEN
        ALTER TABLE invoices ADD COLUMN barrio TEXT;
    END IF;
END $$;

-- Paso 2: Eliminar todos los datos de ejemplo existentes
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM sales;

-- Paso 3: Crear trigger para sincronizar estados entre facturas y ventas
DROP TRIGGER IF EXISTS sync_invoice_status_to_sale ON invoices;
DROP FUNCTION IF EXISTS sync_invoice_status_to_sale();

CREATE OR REPLACE FUNCTION sync_invoice_status_to_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado de la venta cuando cambia el estado de la factura
    UPDATE sales 
    SET status = NEW.status,
        updated_at = NOW()
    WHERE invoice_number = NEW.invoice_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_invoice_status_to_sale
AFTER INSERT OR UPDATE OF status ON invoices
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_status_to_sale();

-- Paso 4: Crear nuevas facturas de ejemplo con datos correctos
-- Factura 1: Pago por Transferencia = Estado PAGADO
INSERT INTO invoices (
    invoice_number, client_name, client_nit, client_email, client_phone, 
    client_address, ciudad, barrio, issue_date, due_date, 
    subtotal, tax_rate, tax_amount, total, 
    status, payment_method, payment_date,
    guia, transportadora,
    notes, created_at, updated_at
) VALUES (
    'FAC-2025-0001',
    'María González',
    '1090460001',
    'maria.gonzalez@email.com',
    '3001234567',
    'Calle 45 #23-10',
    'Bogotá',
    'Chapinero',
    '2025-01-07',
    '2025-01-21',
    239495.80,
    19,
    45504.20,
    285000,
    'PAGADO',
    'transferencia',
    '2025-01-07',
    'GUIA-2025-0001',
    'Servientrega',
    'Cliente frecuente',
    NOW(),
    NOW()
);

-- Items para factura 1
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
VALUES 
    (gen_random_uuid(), 'FAC-2025-0001', 'Balín de Oro 18k', 1, 239495.80, 239495.80, NOW());

-- Factura 2: Pago por Efectivo = Estado PAGADO
INSERT INTO invoices (
    invoice_number, client_name, client_nit, client_email, client_phone, 
    client_address, ciudad, barrio, issue_date, due_date, 
    subtotal, tax_rate, tax_amount, total, 
    status, payment_method, payment_date,
    guia, transportadora,
    notes, created_at, updated_at
) VALUES (
    'FAC-2025-0002',
    'Carlos Rodríguez',
    '1090460002',
    'carlos.rodriguez@email.com',
    '3009876543',
    'Av 1 9 53 lomitas del trapiche',
    'Cúcuta',
    'Centro',
    '2025-01-07',
    '2025-01-21',
    105042,
    19,
    19958,
    125000,
    'PAGADO',
    'efectivo',
    '2025-01-07',
    'GUIA-2025-0002',
    'Coordinadora',
    'Pago en efectivo al momento de la compra',
    NOW(),
    NOW()
);

-- Items para factura 2
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
VALUES 
    (gen_random_uuid(), 'FAC-2025-0002', 'Anillo de Plata', 1, 105042, 105042, NOW());

-- Factura 3: Pago por Contraentrega = Estado PENDIENTE PAGO
INSERT INTO invoices (
    invoice_number, client_name, client_nit, client_email, client_phone, 
    client_address, ciudad, barrio, issue_date, due_date, 
    subtotal, tax_rate, tax_amount, total, 
    status, payment_method, payment_date,
    guia, transportadora,
    notes, created_at, updated_at
) VALUES (
    'FAC-2025-0003',
    'Laura Martínez',
    '1090460003',
    'laura.martinez@email.com',
    '3012345678',
    'Carrera 15 #30-45',
    'Medellín',
    'El Poblado',
    '2025-01-06',
    '2025-01-20',
    378151.26,
    19,
    71848.74,
    450000,
    'PENDIENTE PAGO',
    'contraentrega',
    NULL,
    'GUIA-2025-0003',
    'Servientrega',
    'Pago contra entrega',
    NOW(),
    NOW()
);

-- Items para factura 3
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
VALUES 
    (gen_random_uuid(), 'FAC-2025-0003', 'Balín Premium', 1, 378151.26, 378151.26, NOW());

-- Factura 4: Pago por Transferencia = Estado ENTREGADO (ya se entregó)
INSERT INTO invoices (
    invoice_number, client_name, client_nit, client_email, client_phone, 
    client_address, ciudad, barrio, issue_date, due_date, 
    subtotal, tax_rate, tax_amount, total, 
    status, payment_method, payment_date,
    guia, transportadora,
    notes, created_at, updated_at
) VALUES (
    'FAC-2025-0004',
    'Pedro Sánchez',
    '1090460004',
    'pedro.sanchez@email.com',
    '3015678901',
    'Calle 80 #12-34',
    'Cali',
    'Granada',
    '2025-01-06',
    '2025-01-20',
    268907.56,
    19,
    51092.44,
    320000,
    'ENTREGADO',
    'transferencia',
    '2025-01-06',
    'GUIA-2025-0004',
    'Servientrega',
    'Pedido entregado exitosamente',
    NOW(),
    NOW()
);

-- Items para factura 4
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
VALUES 
    (gen_random_uuid(), 'FAC-2025-0004', 'Aretes de Oro', 1, 268907.56, 268907.56, NOW());

-- Factura 5: Pago por Contraentrega = Estado PENDIENTE PAGO
INSERT INTO invoices (
    invoice_number, client_name, client_nit, client_email, client_phone, 
    client_address, ciudad, barrio, issue_date, due_date, 
    subtotal, tax_rate, tax_amount, total, 
    status, payment_method, payment_date,
    guia, transportadora,
    notes, created_at, updated_at
) VALUES (
    'FAC-2025-0005',
    'Diego Torres',
    '1090460005',
    'diego.torres@email.com',
    '3018765432',
    'Avenida 5 #20-15',
    'Barranquilla',
    'El Prado',
    '2025-01-05',
    '2025-01-19',
    235294.12,
    19,
    44705.88,
    280000,
    'PENDIENTE PAGO',
    'contraentrega',
    NULL,
    'GUIA-2025-0005',
    'Envia',
    'Pendiente de entrega',
    NOW(),
    NOW()
);

-- Items para factura 5
INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, created_at)
VALUES 
    (gen_random_uuid(), 'FAC-2025-0005', 'Pulsera de Oro', 1, 235294.12, 235294.12, NOW());

-- Paso 5: Crear ventas asociadas a las facturas
-- Las ventas se crean con el mismo estado que sus facturas
INSERT INTO sales (
    id, sale_id, client_name, client_phone, client_email,
    sale_date, products, total, status, payment_method,
    seller_name, shipping_company, tracking_number,
    invoice_number, created_at, updated_at
) VALUES
-- Venta 1: Asociada a FAC-2025-0001 (PAGADO)
(
    gen_random_uuid(),
    'VT-001',
    'María González',
    '3001234567',
    'maria.gonzalez@email.com',
    '2025-01-07',
    '[{"name": "Balín de Oro 18k", "quantity": 1, "price": 285000}]'::jsonb,
    285000,
    'PAGADO',
    'transferencia',
    'Juan Pérez',
    'Servientrega',
    '1714015',
    'FAC-2025-0001',
    NOW(),
    NOW()
),
-- Venta 2: Asociada a FAC-2025-0002 (PAGADO)
(
    gen_random_uuid(),
    'VT-002',
    'Carlos Rodríguez',
    '3009876543',
    'carlos.rodriguez@email.com',
    '2025-01-07',
    '[{"name": "Anillo de Plata", "quantity": 1, "price": 125000}]'::jsonb,
    125000,
    'PAGADO',
    'efectivo',
    'Ana López',
    'Coordinadora',
    '1714016',
    'FAC-2025-0002',
    NOW(),
    NOW()
),
-- Venta 3: Asociada a FAC-2025-0003 (PENDIENTE PAGO)
(
    gen_random_uuid(),
    'VT-003',
    'Laura Martínez',
    '3012345678',
    'laura.martinez@email.com',
    '2025-01-06',
    '[{"name": "Balín Premium", "quantity": 1, "price": 450000}]'::jsonb,
    450000,
    'PENDIENTE PAGO',
    'contraentrega',
    'Juan Pérez',
    'Servientrega',
    '1714017',
    'FAC-2025-0003',
    NOW(),
    NOW()
),
-- Venta 4: Asociada a FAC-2025-0004 (ENTREGADO)
(
    gen_random_uuid(),
    'VT-004',
    'Pedro Sánchez',
    '3015678901',
    'pedro.sanchez@email.com',
    '2025-01-06',
    '[{"name": "Aretes de Oro", "quantity": 1, "price": 320000}]'::jsonb,
    320000,
    'ENTREGADO',
    'transferencia',
    'Ana López',
    'Servientrega',
    '1714018',
    'FAC-2025-0004',
    NOW(),
    NOW()
),
-- Venta 5: Asociada a FAC-2025-0005 (PENDIENTE PAGO)
(
    gen_random_uuid(),
    'VT-005',
    'Diego Torres',
    '3018765432',
    'diego.torres@email.com',
    '2025-01-05',
    '[{"name": "Pulsera de Oro", "quantity": 1, "price": 280000}]'::jsonb,
    280000,
    'PENDIENTE PAGO',
    'contraentrega',
    'Ana López',
    'Envia',
    '1714020',
    'FAC-2025-0005',
    NOW(),
    NOW()
);
