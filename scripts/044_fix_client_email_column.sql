-- Script de migración 044: Asegurar que la columna client_email existe y es opcional
-- Este script verifica y agrega la columna client_email si no existe

-- Agregar columna client_email si no existe (nullable para que sea opcional)
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

-- Asegurarse de que la columna sea nullable (opcional)
ALTER TABLE public.invoices
ALTER COLUMN client_email DROP NOT NULL;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.invoices.client_email IS 'Email del cliente (opcional)';

-- Crear índice para búsquedas por email si no existe
CREATE INDEX IF NOT EXISTS idx_invoices_client_email
ON public.invoices(client_email)
WHERE client_email IS NOT NULL;

-- Mostrar información de la columna
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoices'
  AND column_name = 'client_email';

