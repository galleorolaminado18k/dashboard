-- Script de migración 045: Verificar y agregar TODAS las columnas faltantes en invoices
-- Este script asegura que la tabla invoices tenga TODAS las columnas necesarias

-- 1. Verificar y agregar columnas básicas de cliente
DO $$
BEGIN
    -- client_email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'client_email'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN client_email TEXT;
        RAISE NOTICE '✅ Columna client_email agregada';
    END IF;

    -- client_nit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'client_nit'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN client_nit TEXT;
        RAISE NOTICE '✅ Columna client_nit agregada';
    END IF;

    -- client_phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'client_phone'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN client_phone TEXT;
        RAISE NOTICE '✅ Columna client_phone agregada';
    END IF;

    -- client_address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'client_address'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN client_address TEXT;
        RAISE NOTICE '✅ Columna client_address agregada';
    END IF;
END $$;

-- 2. Verificar y agregar columnas de impuestos y totales
DO $$
BEGIN
    -- tax_rate
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'tax_rate'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN tax_rate NUMERIC(5, 2) DEFAULT 19.00;
        RAISE NOTICE '✅ Columna tax_rate agregada';
    END IF;

    -- tax_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'tax_amount'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN tax_amount NUMERIC(12, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna tax_amount agregada';
    END IF;

    -- subtotal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN subtotal NUMERIC(12, 2) DEFAULT 0;
        RAISE NOTICE '✅ Columna subtotal agregada';
    END IF;
END $$;

-- 3. Verificar y agregar columnas de fechas
DO $$
BEGIN
    -- issue_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'issue_date'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Columna issue_date agregada';
    END IF;

    -- due_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'due_date'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Columna due_date agregada';
    END IF;

    -- payment_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'payment_date'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Columna payment_date agregada';
    END IF;
END $$;

-- 4. Verificar y agregar columnas de pago y notas
DO $$
BEGIN
    -- payment_method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN payment_method TEXT;
        RAISE NOTICE '✅ Columna payment_method agregada';
    END IF;

    -- notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'invoices'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Columna notes agregada';
    END IF;
END $$;

-- 5. Asegurar valores por defecto correctos
ALTER TABLE public.invoices
ALTER COLUMN tax_rate SET DEFAULT 19.00;

ALTER TABLE public.invoices
ALTER COLUMN issue_date SET DEFAULT NOW();

-- 6. Asegurar que columnas opcionales sean nullable
ALTER TABLE public.invoices
ALTER COLUMN client_email DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN client_nit DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN client_phone DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN client_address DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN due_date DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN payment_date DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN payment_method DROP NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN notes DROP NOT NULL;

-- 7. Agregar comentarios descriptivos
COMMENT ON COLUMN public.invoices.client_email IS 'Email del cliente (opcional)';
COMMENT ON COLUMN public.invoices.client_nit IS 'NIT del cliente (opcional)';
COMMENT ON COLUMN public.invoices.client_phone IS 'Teléfono del cliente (opcional)';
COMMENT ON COLUMN public.invoices.client_address IS 'Dirección del cliente (opcional)';
COMMENT ON COLUMN public.invoices.tax_rate IS 'Tasa de impuesto IVA en % (por defecto 19%)';
COMMENT ON COLUMN public.invoices.tax_amount IS 'Monto del impuesto calculado';
COMMENT ON COLUMN public.invoices.subtotal IS 'Subtotal sin IVA';
COMMENT ON COLUMN public.invoices.payment_method IS 'Método de pago (efectivo, transferencia, tarjeta, contraentrega, credito)';
COMMENT ON COLUMN public.invoices.notes IS 'Notas adicionales (opcional)';

-- 8. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_invoices_client_email
ON public.invoices(client_email)
WHERE client_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_issue_date
ON public.invoices(issue_date);

CREATE INDEX IF NOT EXISTS idx_invoices_status
ON public.invoices(status);

-- 9. Configurar políticas de seguridad RLS (Row Level Security)
-- IMPORTANTE: Habilitar RLS pero permitir todas las operaciones

-- Habilitar RLS en la tabla
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.invoices;

-- Crear políticas permisivas para todas las operaciones
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

-- 10. Mostrar resumen de columnas
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
ORDER BY ordinal_position;

