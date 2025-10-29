-- ========================================
-- SCRIPT 040: FIX INVENTORY AND INVOICES
-- ========================================
-- Este script corrige todos los errores actuales del sistema
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-10-29

-- ========================================
-- PARTE 1: CREAR/ACTUALIZAR TABLA INVENTORY
-- ========================================

-- Crear tabla inventory si no existe
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) DEFAULT 0, -- Legacy, mantener para compatibilidad
  price_retail NUMERIC(12,2) DEFAULT 0, -- Precio al detal
  price_wholesale NUMERIC(12,2) DEFAULT 0, -- Precio al por mayor
  stock INTEGER DEFAULT 0,
  stock_warranty INTEGER DEFAULT 0, -- Stock en garantías
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  -- Campos de medidas según categoría
  tamano TEXT, -- Para CADENAS, PULSERAS, TOBILLERAS
  grosor TEXT, -- Para CADENAS, PULSERAS, TOBILLERAS
  medida_mm TEXT, -- Para ARETES, DIJES, MANILLAS, BALINES, ANILLOS, CANDONGAS, HERRAJES
  -- Columnas calculadas automáticamente
  profit_retail NUMERIC(12,2) GENERATED ALWAYS AS (price_retail - cost) STORED,
  profit_wholesale NUMERIC(12,2) GENERATED ALWAYS AS (price_wholesale - cost) STORED,
  margin_retail_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN price_retail > 0 THEN ((price_retail - cost) / price_retail * 100) ELSE 0 END
  ) STORED,
  margin_wholesale_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN price_wholesale > 0 THEN ((price_wholesale - cost) / price_wholesale * 100) ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas si no existen (para actualizar tablas existentes)
DO $$
BEGIN
  -- Verificar y agregar price_retail
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'price_retail'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN price_retail NUMERIC(12,2) DEFAULT 0;
  END IF;

  -- Verificar y agregar price_wholesale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'price_wholesale'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN price_wholesale NUMERIC(12,2) DEFAULT 0;
  END IF;

  -- Verificar y agregar stock_warranty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'stock_warranty'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN stock_warranty INTEGER DEFAULT 0;
  END IF;

  -- Verificar y agregar tamano
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'tamano'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN tamano TEXT;
  END IF;

  -- Verificar y agregar grosor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'grosor'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN grosor TEXT;
  END IF;

  -- Verificar y agregar medida_mm
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'medida_mm'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN medida_mm TEXT;
  END IF;
END $$;

-- Eliminar columnas calculadas antiguas si existen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'profit_retail'
  ) THEN
    ALTER TABLE public.inventory DROP COLUMN profit_retail;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'profit_wholesale'
  ) THEN
    ALTER TABLE public.inventory DROP COLUMN profit_wholesale;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'margin_retail_pct'
  ) THEN
    ALTER TABLE public.inventory DROP COLUMN margin_retail_pct;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'inventory'
    AND column_name = 'margin_wholesale_pct'
  ) THEN
    ALTER TABLE public.inventory DROP COLUMN margin_wholesale_pct;
  END IF;
END $$;

-- Agregar columnas calculadas con GENERATED ALWAYS
ALTER TABLE public.inventory
  ADD COLUMN profit_retail NUMERIC(12,2) GENERATED ALWAYS AS (price_retail - cost) STORED,
  ADD COLUMN profit_wholesale NUMERIC(12,2) GENERATED ALWAYS AS (price_wholesale - cost) STORED,
  ADD COLUMN margin_retail_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN price_retail > 0 THEN ((price_retail - cost) / price_retail * 100) ELSE 0 END
  ) STORED,
  ADD COLUMN margin_wholesale_pct NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN price_wholesale > 0 THEN ((price_wholesale - cost) / price_wholesale * 100) ELSE 0 END
  ) STORED;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON public.inventory(stock);

-- ========================================
-- PARTE 2: TABLA DE MOVIMIENTOS
-- ========================================

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste_especial', 'transferencia_garantia')),
  warehouse_type TEXT DEFAULT 'cantidad' CHECK (warehouse_type IN ('cantidad', 'garantia')),
  quantity INTEGER NOT NULL,
  notes TEXT,
  special_exit_type TEXT, -- bono, obsequios, canje, puntos, otros
  special_action TEXT, -- agregar, descontar (para ajuste_especial)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON public.inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at);

-- ========================================
-- PARTE 3: TRIGGER PARA ACTUALIZAR STOCK
-- ========================================

-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Entrada: agregar a cantidad
  IF NEW.movement_type = 'entrada' AND NEW.warehouse_type = 'cantidad' THEN
    UPDATE public.inventory
    SET stock = stock + NEW.quantity
    WHERE id = NEW.inventory_id;

  -- Salida especial: descontar de cantidad
  ELSIF NEW.movement_type = 'salida' AND NEW.warehouse_type = 'cantidad' THEN
    UPDATE public.inventory
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id = NEW.inventory_id;

  -- Ajuste especial: cantidad puede ser absoluta o relativa según special_action
  ELSIF NEW.movement_type = 'ajuste_especial' THEN
    -- La quantity ya viene procesada desde el frontend como valor absoluto
    UPDATE public.inventory
    SET stock = NEW.quantity
    WHERE id = NEW.inventory_id;

  -- Transferencia por garantía: sale de cantidad, entra a garantía
  ELSIF NEW.movement_type = 'transferencia_garantia' THEN
    UPDATE public.inventory
    SET
      stock = GREATEST(0, stock - NEW.quantity),
      stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.inventory_movements;

-- Crear trigger
CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- ========================================
-- PARTE 4: FIX INVOICE_ITEMS (Errores SQL)
-- ========================================

-- Verificar si la columna 'reference' existe en invoice_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoice_items'
    AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.invoice_items ADD COLUMN reference TEXT;
  END IF;
END $$;

-- Cambiar el tipo de invoice_id de TEXT a UUID si es necesario
DO $$
BEGIN
  -- Verificar el tipo actual de invoice_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'invoice_items'
    AND column_name = 'invoice_id'
    AND data_type = 'text'
  ) THEN
    -- Si existe una FK, eliminarla primero
    ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;

    -- Cambiar el tipo a UUID
    -- Nota: Esto puede fallar si hay datos incompatibles. En ese caso, limpiar datos primero.
    ALTER TABLE public.invoice_items
      ALTER COLUMN invoice_id TYPE UUID USING invoice_id::UUID;

    -- Recrear la FK si la tabla invoices tiene id UUID
    -- ALTER TABLE public.invoice_items
    --   ADD CONSTRAINT invoice_items_invoice_id_fkey
    --   FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ========================================
-- PARTE 5: ACTUALIZAR TRIGGER UPDATED_AT
-- ========================================

-- Trigger para actualizar updated_at en inventory
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PARTE 6: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ========================================

-- Habilitar RLS en inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todo (ajustar según necesidades de seguridad)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.inventory;
CREATE POLICY "Enable all for authenticated users" ON public.inventory
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar RLS en inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Política: Permitir todo
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.inventory_movements;
CREATE POLICY "Enable all for authenticated users" ON public.inventory_movements
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- PARTE 7: MIGRAR DATOS ANTIGUOS
-- ========================================

-- Migrar price antiguo a price_retail si price_retail es 0
UPDATE public.inventory
SET price_retail = price
WHERE price_retail = 0 AND price > 0;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Script ejecutado exitosamente. Inventario y movimientos listos.';
END $$;

