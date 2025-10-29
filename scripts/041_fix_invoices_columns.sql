-- ========================================
-- SCRIPT 041: FIX INVOICES TABLE - AGREGAR COLUMNAS FALTANTES
-- ========================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-10-29

-- Verificar y agregar columnas faltantes en la tabla invoices
DO $$
BEGIN
  -- Agregar client_email si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_email'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_email TEXT;
    RAISE NOTICE '✅ Columna client_email agregada';
  ELSE
    RAISE NOTICE '✓ Columna client_email ya existe';
  END IF;

  -- Agregar client_phone si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_phone TEXT;
    RAISE NOTICE '✅ Columna client_phone agregada';
  ELSE
    RAISE NOTICE '✓ Columna client_phone ya existe';
  END IF;

  -- Agregar client_address si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_address'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_address TEXT;
    RAISE NOTICE '✅ Columna client_address agregada';
  ELSE
    RAISE NOTICE '✓ Columna client_address ya existe';
  END IF;

  -- Agregar ciudad si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'ciudad'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN ciudad TEXT;
    RAISE NOTICE '✅ Columna ciudad agregada';
  ELSE
    RAISE NOTICE '✓ Columna ciudad ya existe';
  END IF;

  -- Agregar barrio si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'barrio'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN barrio TEXT;
    RAISE NOTICE '✅ Columna barrio agregada';
  ELSE
    RAISE NOTICE '✓ Columna barrio ya existe';
  END IF;

  -- Agregar guia si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'guia'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN guia TEXT;
    RAISE NOTICE '✅ Columna guia agregada';
  ELSE
    RAISE NOTICE '✓ Columna guia ya existe';
  END IF;

  -- Agregar transportadora si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'transportadora'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN transportadora TEXT;
    RAISE NOTICE '✅ Columna transportadora agregada';
  ELSE
    RAISE NOTICE '✓ Columna transportadora ya existe';
  END IF;

  -- Agregar vendedor si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'vendedor'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN vendedor TEXT;
    RAISE NOTICE '✅ Columna vendedor agregada';
  ELSE
    RAISE NOTICE '✓ Columna vendedor ya existe';
  END IF;

  -- Agregar evidencia si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'evidencia'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN evidencia TEXT;
    RAISE NOTICE '✅ Columna evidencia agregada';
  ELSE
    RAISE NOTICE '✓ Columna evidencia ya existe';
  END IF;

  -- Agregar client_nit si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoices'
    AND column_name = 'client_nit'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN client_nit TEXT;
    RAISE NOTICE '✅ Columna client_nit agregada';
  ELSE
    RAISE NOTICE '✓ Columna client_nit ya existe';
  END IF;

END $$;

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '✅ Script 041 ejecutado exitosamente. Tabla invoices actualizada.';
END $$;

