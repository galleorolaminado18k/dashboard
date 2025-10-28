-- =====================================================
-- SCRIPT 036: Insertar facturas de ejemplo
-- =====================================================
-- Descripción: Crea 3 facturas de ejemplo para pruebas
-- Primero elimina el CHECK constraint y agrega columnas
-- =====================================================

-- PASO 0: Agregar columnas que faltan a la tabla SALES
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS products JSONB,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS mipaquete_code TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

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

-- PASO 2.5: Agregar columnas que faltan a la tabla invoice_items
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) DEFAULT 0;

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

-- PASO 4: Insertar productos (invoice_items) para cada factura
-- Usando el ID (UUID) de la factura, no el invoice_number
INSERT INTO public.invoice_items (invoice_id, product_name, quantity, unit_price, total)
SELECT
  i.id,
  'Anillo de Oro 18K',
  2,
  1250000,
  2500000
FROM public.invoices i
WHERE i.invoice_number = 'FAC-2025-001'
UNION ALL
SELECT
  i.id,
  'Cadena de Plata 925',
  3,
  600000,
  1800000
FROM public.invoices i
WHERE i.invoice_number = 'FAC-2025-002'
UNION ALL
SELECT
  i.id,
  'Aretes de Oro con Diamantes',
  1,
  3200000,
  3200000
FROM public.invoices i
WHERE i.invoice_number = 'FAC-2025-003';

-- PASO 5: Crear registros en la tabla SALES automáticamente
INSERT INTO public.sales (
  order_id,
  client_name,
  client_phone,
  city,
  state,
  products,
  subtotal,
  total_amount,
  shipping_amount,
  payment_method,
  status,
  mipaquete_code,
  campaign_id,
  created_at
)
SELECT
  'ORD-' || i.invoice_number as order_id,
  i.client_name,
  i.client_phone,
  SPLIT_PART(i.client_address, ', ', 2) as city,
  CASE
    WHEN SPLIT_PART(i.client_address, ', ', 2) = 'Bogotá' THEN 'Cundinamarca'
    WHEN SPLIT_PART(i.client_address, ', ', 2) = 'Medellín' THEN 'Antioquia'
    WHEN SPLIT_PART(i.client_address, ', ', 2) = 'Cali' THEN 'Valle del Cauca'
    ELSE 'Cundinamarca'
  END as state,
  jsonb_build_array(
    jsonb_build_object(
      'name', (SELECT product_name FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1),
      'quantity', (SELECT quantity FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1),
      'price', (SELECT unit_price FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1)
    )
  ) as products,
  i.subtotal,
  i.total,
  0 as shipping_amount,
  LOWER(i.payment_method) as payment_method,
  CASE
    WHEN i.status = 'PAGADO' THEN 'pagada'
    WHEN i.status = 'PENDIENTE PAGO' THEN 'pendiente'
    WHEN i.status = 'ENTREGADO' THEN 'pagada'
    ELSE 'pendiente'
  END as status,
  i.guia as mipaquete_code,
  'Campaña de Oro 18K' as campaign_id,
  i.issue_date
FROM public.invoices i
WHERE i.invoice_number LIKE 'FAC-2025-0%';

-- PASO 6: Verificar que se crearon las facturas, productos y ventas
SELECT
  'FACTURA' as tipo,
  i.invoice_number,
  i.client_name,
  i.total,
  i.status,
  COUNT(ii.id) as num_productos
FROM public.invoices i
LEFT JOIN public.invoice_items ii ON i.id = ii.invoice_id
WHERE i.invoice_number LIKE 'FAC-2025-0%'
GROUP BY i.invoice_number, i.client_name, i.total, i.status
ORDER BY i.invoice_number;

-- Verificar productos insertados
SELECT
  'PRODUCTOS' as tipo,
  i.invoice_number,
  ii.product_name,
  ii.quantity,
  ii.unit_price,
  ii.total
FROM public.invoice_items ii
INNER JOIN public.invoices i ON ii.invoice_id = i.id
WHERE i.invoice_number LIKE 'FAC-2025-0%'
ORDER BY i.invoice_number;

-- Verificar ventas creadas
SELECT
  'VENTA' as tipo,
  id,
  order_id,
  client_name,
  city,
  state,
  subtotal,
  total_amount,
  shipping_amount,
  revenue_no_shipping,
  status,
  payment_method,
  mipaquete_code,
  products
FROM public.sales
WHERE order_id LIKE 'ORD-FAC-2025-0%'
ORDER BY created_at DESC
LIMIT 10;

