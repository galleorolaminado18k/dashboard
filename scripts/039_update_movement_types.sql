-- =====================================================
-- SCRIPT 039: Actualizar triggers para nuevos tipos de movimiento
-- =====================================================

-- Actualizar función del trigger para manejar 'transferencia' en lugar de 'garantia'
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
  ELSIF NEW.movement_type = 'transferencia' THEN
    -- Transferencia por Garantía: Mover de cantidad a garantía
    UPDATE public.inventory
    SET stock = stock - NEW.quantity,
        stock_warranty = stock_warranty + NEW.quantity
    WHERE id = NEW.inventory_id;
  ELSIF NEW.movement_type = 'ajuste' THEN
    -- Ajuste directo del stock (por conteo de inventario)
    IF NEW.warehouse_type = 'cantidad' THEN
      UPDATE public.inventory SET stock = NEW.quantity WHERE id = NEW.inventory_id;
    ELSIF NEW.warehouse_type = 'garantia' THEN
      UPDATE public.inventory SET stock_warranty = NEW.quantity WHERE id = NEW.inventory_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que el trigger existe (no es necesario recrearlo si ya existe)
SELECT
  tgname as trigger_name,
  tgtype as trigger_type
FROM pg_trigger
WHERE tgname = 'trigger_update_inventory_stock';

-- Comentario: El trigger 'trigger_update_inventory_stock' ya debe existir
-- Solo se actualizó la función para manejar 'transferencia' en lugar de 'garantia'

