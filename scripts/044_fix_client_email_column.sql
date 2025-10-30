-- Script de migración 044: Asegurar que las columnas necesarias existen en invoices
-- Este script verifica y agrega las columnas client_email y tax_rate si no existen

-- 1. Agregar columna client_email si no existe (nullable para que sea opcional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND column_name = 'client_email'
    ) THEN
        ALTER TABLE public.invoices
        ADD COLUMN client_email TEXT;

        RAISE NOTICE 'Columna client_email agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna client_email ya existe';
    END IF;
END $$;

-- 2. Agregar columna tax_rate si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'invoices'
        AND column_name = 'tax_rate'
    ) THEN
        ALTER TABLE public.invoices
        ADD COLUMN tax_rate NUMERIC(5, 2) DEFAULT 19.00;

        RAISE NOTICE 'Columna tax_rate agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna tax_rate ya existe';
    END IF;
END $$;

-- Asegurarse de que las columnas sean nullable (opcionales)
ALTER TABLE public.invoices
ALTER COLUMN client_email DROP NOT NULL;

-- Asegurarse de que tax_rate tenga un valor por defecto
ALTER TABLE public.invoices
ALTER COLUMN tax_rate SET DEFAULT 19.00;

-- Agregar comentarios descriptivos
COMMENT ON COLUMN public.invoices.client_email IS 'Email del cliente (opcional)';
COMMENT ON COLUMN public.invoices.tax_rate IS 'Tasa de impuesto (IVA) en porcentaje (por defecto 19%)';

-- Crear índice para búsquedas por email si no existe
CREATE INDEX IF NOT EXISTS idx_invoices_client_email
ON public.invoices(client_email)
WHERE client_email IS NOT NULL;

-- Mostrar información de las columnas
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
  AND column_name IN ('client_email', 'tax_rate')
ORDER BY column_name;

