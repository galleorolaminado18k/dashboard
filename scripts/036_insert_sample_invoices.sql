-- =====================================================
-- SCRIPT 036: Insertar facturas de ejemplo
-- =====================================================
-- Descripción: Crea 3 facturas de ejemplo para pruebas
-- =====================================================

-- Insertar facturas de ejemplo
INSERT INTO public.invoices (
  invoice_number,
  client_name,
  client_nit,
  client_phone,
  client_address,
  issue_date,
  due_date,
  subtotal,
  tax_amount,
  total,
  status,
  payment_method,
  guia,
  transportadora
) VALUES
  (
    'FAC-2025-001',
    'Distribuidora El Sol S.A.S',
    '900123456-7',
    '3001234567',
    'Calle 123 #45-67, Bogotá',
    '2025-10-14',
    '2025-11-14',
    2500000,
    475000,
    2975000,
    'paid',
    'transferencia',
    'MP-SB048078309',
    'Servientrega'
  ),
  (
    'FAC-2025-002',
    'Comercializadora Norte Ltda',
    '800987654-3',
    '3009876543',
    'Carrera 50 #25-30, Medellín',
    '2025-10-17',
    '2025-11-17',
    1800000,
    342000,
    2142000,
    'pending',
    'efectivo',
    'MP-SB048078310',
    'Coordinadora'
  ),
  (
    'FAC-2025-003',
    'Supermercado La Economía',
    '890765432-1',
    '3201234567',
    'Avenida 6 #15-20, Cali',
    '2025-10-19',
    '2025-11-19',
    3200000,
    608000,
    3808000,
    'paid',
    'credito',
    'MP-SB048078311',
    'Deprisa'
  )
ON CONFLICT (invoice_number) DO NOTHING;

-- Verificar que se crearon las facturas
SELECT
  invoice_number,
  client_name,
  client_address,
  total,
  status,
  guia,
  transportadora
FROM public.invoices
WHERE invoice_number LIKE 'FAC-2025-0%'
ORDER BY invoice_number;

