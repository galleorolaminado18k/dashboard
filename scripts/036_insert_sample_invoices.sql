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

-- PASO 2.5: Agregar columnas que faltan a la tabla invoice_items
ALTER TABLE public.invoice_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total NUMERIC(12, 2) DEFAULT 0;

-- PASO 3: Insertar facturas de ejemplo
...existing code...

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
  invoice_number,
  client_name,
  client_phone,
  client_address,
  city,
  products,
  payment_method,
  total_amount,
  shipping_amount,
  status,
  mipaquete_code,
  carrier,
  created_at
)
SELECT
  i.invoice_number,
  i.client_name,
  i.client_phone,
  i.client_address,
  SPLIT_PART(i.client_address, ', ', 2) as city,
  jsonb_build_array(
    jsonb_build_object(
      'name', (SELECT product_name FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1),
      'quantity', (SELECT quantity FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1),
      'price', (SELECT unit_price FROM public.invoice_items WHERE invoice_id = i.id LIMIT 1)
    )
  ) as products,
  i.payment_method,
  i.total,
  0 as shipping_amount,
  CASE
    WHEN i.status = 'PAGADO' THEN 'entregado'
    WHEN i.status = 'PENDIENTE PAGO' THEN 'pendiente'
    WHEN i.status = 'ENTREGADO' THEN 'entregado'
    ELSE 'pendiente'
  END as status,
  i.guia,
  i.transportadora,
  i.issue_date
FROM public.invoices i
WHERE i.invoice_number LIKE 'FAC-2025-0%'
  AND NOT EXISTS (
    SELECT 1 FROM public.sales s WHERE s.invoice_number = i.invoice_number
  );

-- PASO 6: Verificar que se crearon las facturas, productos y ventas
...existing code...

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
  invoice_number,
  client_name,
  city,
  total_amount,
  status,
  products
FROM public.sales
WHERE invoice_number LIKE 'FAC-2025-0%'
ORDER BY invoice_number;

