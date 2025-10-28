-- Migration 043: Fix Inventory Movements Logic
-- Simplificar movimientos: eliminar ajuste por conteo, solo ajuste especial

-- 1. Actualizar función del trigger para manejar correctamente todos los tipos
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- ENTRADA: Agrega a cantidad (warehouse_type determina dónde)
  IF NEW.movement_type = 'entrada' THEN
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = stock + NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = stock_warranty + NEW.quantity WHERE id = NEW.inventory_id;
    END IF;

  -- SALIDA: Descuenta de cantidad (salidas especiales: bono, obsequios, canje, puntos, otros)
  ELSIF NEW.movement_type = 'salida' THEN
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = GREATEST(0, stock - NEW.quantity) WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = GREATEST(0, stock_warranty - NEW.quantity) WHERE id = NEW.inventory_id;
    END IF;

  -- AJUSTE ESPECIAL: Ajusta directamente el valor absoluto
  ELSIF NEW.movement_type = 'ajuste_especial' THEN
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = NEW.quantity WHERE id = NEW.inventory_id;
    END IF;

  -- TRANSFERENCIA: Sale de cantidad e ingresa a garantía
  ELSIF NEW.movement_type = 'transferencia' THEN
    UPDATE public.inventory
    SET stock = GREATEST(0, stock - NEW.quantity),
        stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;

  -- GARANTIA (legacy, mantener compatibilidad)
  ELSIF NEW.movement_type = 'garantia' THEN
    UPDATE public.inventory
    SET stock = GREATEST(0, stock - NEW.quantity),
        stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- Verificar tipos de movimiento válidos
COMMENT ON COLUMN public.inventory_movements.movement_type IS
  'Tipos válidos: entrada (agregar), salida (descontar), ajuste_especial (ajustar valor directo), transferencia (cantidad→garantía)';

