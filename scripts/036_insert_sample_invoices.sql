-- =====================================================
-- SCRIPT 036: Insertar facturas de ejemplo
-- =====================================================
-- Descripción: Crea 5 facturas de ejemplo para pruebas
--              basadas en la interfaz mostrada
-- =====================================================

-- Insertar facturas de ejemplo
INSERT INTO public.invoices (
  invoice_number,
  client_name,
  client_nit,
  client_phone,
  client_address,
  city,
  issue_date,
  due_date,
  subtotal,
  tax_amount,
  total,
  status,
  payment_method,
  mipaquete_code,
  carrier,
  products
) VALUES
  (
    'FAC-2025-001',
    'Distribuidora El Sol S.A.S',
    '900123456-7',
    '3001234567',
    'Calle 123 #45-67',
    'Bogotá',
    '2025-10-14',
    '2025-11-14',
    2500000,
    475000,
    2975000,
    'Pagado',
    'Transferencia',
    'MP-SB048078309',
    'Servientrega',
    '[{"name": "Producto A", "quantity": 10, "price": 250000}]'::jsonb
  ),
  (
    'FAC-2025-002',
    'Comercializadora Norte Ltda',
    '800987654-3',
    '3009876543',
    'Carrera 50 #25-30',
    'Medellín',
    '2025-10-17',
    '2025-11-17',
    1800000,
    342000,
    2142000,
    'Pendiente Pago',
    'Efectivo',
    'MP-SB048078310',
    'Coordinadora',
    '[{"name": "Producto B", "quantity": 5, "price": 360000}]'::jsonb
  ),
  (
    'FAC-2025-003',
    'Supermercado La Economía',
    '890765432-1',
    '3201234567',
    'Avenida 6 #15-20',
    'Cali',
    '2025-10-19',
    '2025-11-19',
    3200000,
    608000,
    3808000,
    'Entregado',
    'Credito',
    'MP-SB048078311',
    'Deprisa',
    '[{"name": "Producto C", "quantity": 20, "price": 160000}]'::jsonb
  ),
  (
    'FAC-2025-004',
    'Almacenes Unidos S.A',
    '900555444-9',
    '3159876543',
    'Transversal 30 #40-50',
    'Barranquilla',
    '2025-10-21',
    '2025-11-21',
    4500000,
    855000,
    5355000,
    'Pagado',
    'Transferencia',
    'MP-SB048078312',
    'Servientrega',
    '[{"name": "Producto D", "quantity": 15, "price": 300000}]'::jsonb
  ),
  (
    'FAC-2025-005',
    'Tiendas Express Colombia',
    '890333222-5',
    '3187654321',
    'Diagonal 45 #20-15',
    'Cartagena',
    '2025-10-24',
    '2025-11-24',
    1500000,
    285000,
    1785000,
    'Pendiente Pago',
    'Efectivo',
    'MP-SB048078313',
    'Coordinadora',
    '[{"name": "Producto E", "quantity": 8, "price": 187500}]'::jsonb
  )
ON CONFLICT (invoice_number) DO NOTHING;

-- Verificar que se crearon las facturas
SELECT
  invoice_number,
  client_name,
  city,
  total,
  status,
  mipaquete_code
FROM public.invoices
ORDER BY invoice_number;

