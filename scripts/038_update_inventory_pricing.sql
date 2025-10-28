-- =====================================================
-- SCRIPT 038: Actualizar inventory con precios y utilidades
-- =====================================================

-- Agregar columnas de precios y utilidades
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS price_retail NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_wholesale NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_retail NUMERIC(12, 2) GENERATED ALWAYS AS (price_retail - cost) STORED,
ADD COLUMN IF NOT EXISTS profit_wholesale NUMERIC(12, 2) GENERATED ALWAYS AS (price_wholesale - cost) STORED,
ADD COLUMN IF NOT EXISTS margin_retail_pct NUMERIC(5, 2) GENERATED ALWAYS AS (
  CASE WHEN price_retail > 0 THEN ((price_retail - cost) / price_retail) * 100 ELSE 0 END
) STORED,
ADD COLUMN IF NOT EXISTS margin_wholesale_pct NUMERIC(5, 2) GENERATED ALWAYS AS (
  CASE WHEN price_wholesale > 0 THEN ((price_wholesale - cost) / price_wholesale) * 100 ELSE 0 END
) STORED,
ADD COLUMN IF NOT EXISTS stock_warranty INTEGER DEFAULT 0;

-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste', 'transferencia', 'garantia')),
  warehouse_type TEXT CHECK (warehouse_type IN ('cantidad', 'garantia')),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Índices para movimientos
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON public.inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);

-- RLS para movimientos
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on inventory_movements" ON public.inventory_movements;
CREATE POLICY "Allow all operations on inventory_movements"
  ON public.inventory_movements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'entrada' THEN
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = stock + NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = stock_warranty + NEW.quantity WHERE id = NEW.inventory_id;
    END IF;
  ELSIF NEW.movement_type = 'salida' THEN
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = stock - NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = stock_warranty - NEW.quantity WHERE id = NEW.inventory_id;
    END IF;
  ELSIF NEW.movement_type = 'garantia' THEN
    -- Mover de cantidad a garantía
    UPDATE public.inventory
    SET stock = stock - NEW.quantity,
        stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;
  ELSIF NEW.movement_type = 'ajuste' THEN
    -- Ajuste directo del stock
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = NEW.quantity WHERE id = NEW.inventory_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- Actualizar productos existentes con precios de ejemplo
UPDATE public.inventory
SET
  price_retail = price,
  price_wholesale = price * 0.85
WHERE price_retail IS NULL OR price_retail = 0;

-- Verificar estructura
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
  AND table_schema = 'public'
ORDER BY ordinal_position;

