-- ═══════════════════════════════════════════════════════════════════════════════
-- Script de Migración 046: FIX COMPLETO DE INVOICES E INVOICE_ITEMS
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Este script resuelve TODOS los errores de columnas faltantes en:
-- 1. Tabla invoices (client_email, tax_rate, etc.)
-- 2. Tabla invoice_items (description, reference, etc.)
-- 3. Políticas RLS para ambas tablas
--
-- Fecha: 2025-01-29
-- Errores resueltos: client_email, tax_rate, RLS policy, description
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 1: TABLA INVOICES - Verificar y agregar columnas
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1.1 Columnas de Cliente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'client_email') THEN
        ALTER TABLE public.invoices ADD COLUMN client_email TEXT;
        RAISE NOTICE '✅ Columna client_email agregada';
    ELSE
        RAISE NOTICE '✓ Columna client_email ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'client_nit') THEN
        ALTER TABLE public.invoices ADD COLUMN client_nit TEXT;
        RAISE NOTICE '✅ Columna client_nit agregada';
    ELSE
        RAISE NOTICE '✓ Columna client_nit ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'client_phone') THEN
        ALTER TABLE public.invoices ADD COLUMN client_phone TEXT;
        RAISE NOTICE '✅ Columna client_phone agregada';
    ELSE
        RAISE NOTICE '✓ Columna client_phone ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'client_address') THEN
        ALTER TABLE public.invoices ADD COLUMN client_address TEXT;
        RAISE NOTICE '✅ Columna client_address agregada';
    ELSE
        RAISE NOTICE '✓ Columna client_address ya existe';
    END IF;
END $$;

-- 1.2 Columnas de Impuestos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tax_rate') THEN
        ALTER TABLE public.invoices ADD COLUMN tax_rate NUMERIC(5, 2) DEFAULT 19.00;
        RAISE NOTICE '✅ Columna tax_rate agregada';
    ELSE
        RAISE NOTICE '✓ Columna tax_rate ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.invoices ADD COLUMN tax_amount NUMERIC(12, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna tax_amount agregada';
    ELSE
        RAISE NOTICE '✓ Columna tax_amount ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'subtotal') THEN
        ALTER TABLE public.invoices ADD COLUMN subtotal NUMERIC(12, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna subtotal agregada';
    ELSE
        RAISE NOTICE '✓ Columna subtotal ya existe';
    END IF;
END $$;

-- 1.3 Columnas de Fechas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'issue_date') THEN
        ALTER TABLE public.invoices ADD COLUMN issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna issue_date agregada';
    ELSE
        RAISE NOTICE '✓ Columna issue_date ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'due_date') THEN
        ALTER TABLE public.invoices ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Columna due_date agregada';
    ELSE
        RAISE NOTICE '✓ Columna due_date ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_date') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Columna payment_date agregada';
    ELSE
        RAISE NOTICE '✓ Columna payment_date ya existe';
    END IF;
END $$;

-- 1.4 Columnas de Pago
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_method') THEN
        ALTER TABLE public.invoices ADD COLUMN payment_method TEXT;
        RAISE NOTICE '✅ Columna payment_method agregada';
    ELSE
        RAISE NOTICE '✓ Columna payment_method ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'notes') THEN
        ALTER TABLE public.invoices ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Columna notes agregada';
    ELSE
        RAISE NOTICE '✓ Columna notes ya existe';
    END IF;
END $$;

-- 1.5 Asegurar valores por defecto
ALTER TABLE public.invoices ALTER COLUMN tax_rate SET DEFAULT 19.00;
ALTER TABLE public.invoices ALTER COLUMN issue_date SET DEFAULT NOW();

-- 1.6 Asegurar que columnas opcionales sean nullable
ALTER TABLE public.invoices ALTER COLUMN client_email DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN client_nit DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN client_phone DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN client_address DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN payment_date DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN notes DROP NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 2: TABLA INVOICE_ITEMS - Verificar y agregar columnas
-- ═══════════════════════════════════════════════════════════════════════════════

-- 2.1 Columnas básicas de items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'description') THEN
        ALTER TABLE public.invoice_items ADD COLUMN description TEXT NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Columna description agregada en invoice_items';
    ELSE
        RAISE NOTICE '✓ Columna description ya existe en invoice_items';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'reference') THEN
        ALTER TABLE public.invoice_items ADD COLUMN reference TEXT;
        RAISE NOTICE '✅ Columna reference agregada en invoice_items';
    ELSE
        RAISE NOTICE '✓ Columna reference ya existe en invoice_items';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'quantity') THEN
        ALTER TABLE public.invoice_items ADD COLUMN quantity NUMERIC(10, 2) NOT NULL DEFAULT 1;
        RAISE NOTICE '✅ Columna quantity agregada en invoice_items';
    ELSE
        RAISE NOTICE '✓ Columna quantity ya existe en invoice_items';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'unit_price') THEN
        ALTER TABLE public.invoice_items ADD COLUMN unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Columna unit_price agregada en invoice_items';
    ELSE
        RAISE NOTICE '✓ Columna unit_price ya existe en invoice_items';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'total') THEN
        ALTER TABLE public.invoice_items ADD COLUMN total NUMERIC(12, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Columna total agregada en invoice_items';
    ELSE
        RAISE NOTICE '✓ Columna total ya existe en invoice_items';
    END IF;
END $$;

-- 2.2 Hacer reference nullable (es opcional)
ALTER TABLE public.invoice_items ALTER COLUMN reference DROP NOT NULL;

-- 2.3 Asegurar que description tenga un default si está vacío
UPDATE public.invoice_items SET description = 'Producto sin descripción' WHERE description IS NULL OR description = '';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 3: POLÍTICAS RLS PARA INVOICES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3.1 Habilitar RLS en invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 3.2 Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.invoices;

-- 3.3 Crear políticas permisivas para invoices
CREATE POLICY "Enable read access for all users"
ON public.invoices FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON public.invoices FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON public.invoices FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON public.invoices FOR DELETE
USING (true);



-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 4: POLÍTICAS RLS PARA INVOICE_ITEMS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 4.1 Habilitar RLS en invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 4.2 Eliminar políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.invoice_items;

-- 4.3 Crear políticas permisivas para invoice_items
CREATE POLICY "Enable read access for all users"
ON public.invoice_items FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON public.invoice_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON public.invoice_items FOR UPDATE
USING (true);

CREATE POLICY "Enable delete access for all users"
ON public.invoice_items FOR DELETE
USING (true);



-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 5: ÍNDICES Y OPTIMIZACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 5.1 Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_email ON public.invoices(client_email) WHERE client_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON public.invoices(client_name);

-- 5.2 Índices para invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_description ON public.invoice_items(description);



-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 6: COMENTARIOS Y DOCUMENTACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════

-- 6.1 Comentarios en invoices
COMMENT ON COLUMN public.invoices.client_email IS 'Email del cliente (opcional)';
COMMENT ON COLUMN public.invoices.client_nit IS 'NIT del cliente (opcional)';
COMMENT ON COLUMN public.invoices.tax_rate IS 'Tasa de impuesto IVA en % (por defecto 19%)';
COMMENT ON COLUMN public.invoices.payment_method IS 'Método de pago (efectivo, transferencia, tarjeta, contraentrega, credito)';

-- 6.2 Comentarios en invoice_items
COMMENT ON COLUMN public.invoice_items.description IS 'Descripción del producto/servicio';
COMMENT ON COLUMN public.invoice_items.reference IS 'Referencia o SKU del producto (opcional)';
COMMENT ON COLUMN public.invoice_items.quantity IS 'Cantidad de unidades';
COMMENT ON COLUMN public.invoice_items.unit_price IS 'Precio unitario';
COMMENT ON COLUMN public.invoice_items.total IS 'Total calculado (quantity * unit_price)';


-- ═══════════════════════════════════════════════════════════════════════════════
-- PARTE 7: VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

-- 7.1 Mostrar columnas de invoices
SELECT
    'INVOICES' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 7.2 Mostrar columnas de invoice_items
SELECT
    'INVOICE_ITEMS' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- 7.3 Mostrar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('invoices', 'invoice_items')
ORDER BY tablename, policyname;


-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT - Mensaje de confirmación
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SCRIPT COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas verificadas y actualizadas:';
    RAISE NOTICE '  ✅ invoices (con todas las columnas y RLS)';
    RAISE NOTICE '  ✅ invoice_items (con todas las columnas y RLS)';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso:';
    RAISE NOTICE '  1. Refrescar schema cache en Supabase';
    RAISE NOTICE '  2. Esperar despliegue de Vercel';
    RAISE NOTICE '  3. Probar crear factura';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

