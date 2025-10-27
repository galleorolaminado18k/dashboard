-- =====================================================
-- SCRIPT 036: Insertar facturas de ejemplo
-- =====================================================
-- Descripción: Crea 3 facturas de ejemplo para pruebas
-- Primero elimina el CHECK constraint y agrega columnas
-- =====================================================

-- PASO 1: Eliminar el CHECK CONSTRAINT que está causando el error
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- PASO 2: Agregar columnas que faltan a la tabla invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_nit TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS guia TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT;

-- PASO 3: Insertar facturas de ejemplo
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
    'PAGADO',
    'Transferencia',
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
    'PENDIENTE PAGO',
    'Efectivo',
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
    'ENTREGADO',
    'Credito',
    'MP-SB048078311',
    'Deprisa'
  )
ON CONFLICT (invoice_number) DO NOTHING;

-- PASO 4: Verificar que se crearon las facturas
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

