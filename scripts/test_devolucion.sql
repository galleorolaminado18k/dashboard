-- Test script for devolucion workflow
-- Run this in Supabase SQL Editor (or with psql) to validate the trigger, enum and functions.
-- The script is defensive: it skips tests when required rows/tables do not exist and attempts
-- to restore any conversation it updates back to its original state.

DO $$
DECLARE
  v_id_not_pedido UUID;
  v_id_pedido UUID;
  v_purchase_id UUID;
  v_product_name TEXT;
  v_prev_status TEXT;
  v_prev_razon TEXT;
  v_prev_fecha TIMESTAMPTZ;
BEGIN
  -- TEST 1: Attempt invalid transition (should be rejected)
  SELECT id INTO v_id_not_pedido FROM conversations WHERE status IS DISTINCT FROM 'pedido-completo' LIMIT 1;
  IF v_id_not_pedido IS NOT NULL THEN
    BEGIN
      -- We expect this UPDATE to raise an exception due to trigger
      UPDATE conversations SET status = 'devolucion', devolucion_razon = 'test invalid transition' WHERE id = v_id_not_pedido;
      -- If we reach here, the trigger did NOT block the transition
      RAISE NOTICE 'TEST 1 FAILED: unexpected success updating conversation % to devolucion', v_id_not_pedido;
      -- Try to undo (best-effort)
      UPDATE conversations SET status = 'por-contestar' WHERE id = v_id_not_pedido;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 1 PASSED: invalid transition correctly blocked for conversation % — error: %', v_id_not_pedido, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'TEST 1 SKIPPED: no conversation with status <> pedido-completo found';
  END IF;

  -- TEST 2: Valid transition (pedido-completo -> devolucion) and restore
  SELECT id INTO v_id_pedido FROM conversations WHERE status = 'pedido-completo' LIMIT 1;
  IF v_id_pedido IS NOT NULL THEN
    -- capture previous values to restore later
    SELECT status, devolucion_razon, devolucion_fecha INTO v_prev_status, v_prev_razon, v_prev_fecha
    FROM conversations WHERE id = v_id_pedido;

    BEGIN
      UPDATE conversations SET status = 'devolucion', devolucion_razon = 'test valid transition' WHERE id = v_id_pedido;
      -- verify devolucion_fecha was set
      PERFORM 1;
      SELECT devolucion_fecha INTO v_prev_fecha FROM conversations WHERE id = v_id_pedido;
      IF v_prev_fecha IS NOT NULL THEN
        RAISE NOTICE 'TEST 2 PASSED: conversation % moved to devolucion; devolucion_fecha=%', v_id_pedido, v_prev_fecha;
      ELSE
        RAISE NOTICE 'TEST 2 FAILED: conversation % moved but devolucion_fecha is NULL', v_id_pedido;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 2 FAILED: error while updating conversation %: %', v_id_pedido, SQLERRM;
    END;

    -- Restore original values (best-effort)
    BEGIN
      UPDATE conversations SET status = 'pedido-completo', devolucion_razon = NULL, devolucion_fecha = NULL WHERE id = v_id_pedido;
      RAISE NOTICE 'TEST 2: restored conversation % to pedido-completo', v_id_pedido;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'TEST 2: WARNING restoring conversation %: %', v_id_pedido, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'TEST 2 SKIPPED: no conversation with status = pedido-completo found';
  END IF;

  -- TEST 3: mark_product_as_returned behavior (if purchases table and producto exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    -- find a purchase with at least one producto
    SELECT id INTO v_purchase_id FROM purchases WHERE jsonb_typeof(productos) = 'array' AND jsonb_array_length(productos) > 0 LIMIT 1;
    IF v_purchase_id IS NOT NULL THEN
      SELECT item->> 'nombre' INTO v_product_name
      FROM purchases p, jsonb_array_elements(p.productos) AS item
      WHERE p.id = v_purchase_id
      LIMIT 1;

      IF v_product_name IS NOT NULL THEN
        BEGIN
          PERFORM mark_product_as_returned(v_purchase_id, v_product_name);
          -- verify
          IF EXISTS (
            SELECT 1 FROM purchases p, jsonb_array_elements(p.productos) AS it
            WHERE p.id = v_purchase_id AND (it->> 'nombre') = v_product_name AND (it->> 'devuelto') = 'true'
          ) THEN
            RAISE NOTICE 'TEST 3 PASSED: product % in purchase % marked as devuelto', v_product_name, v_purchase_id;
          ELSE
            RAISE NOTICE 'TEST 3 FAILED: product % in purchase % NOT marked as devuelto', v_product_name, v_purchase_id;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'TEST 3 FAILED: error calling mark_product_as_returned: %', SQLERRM;
        END;
      ELSE
        RAISE NOTICE 'TEST 3 SKIPPED: purchase % has no product nombre', v_purchase_id;
      END IF;
    ELSE
      RAISE NOTICE 'TEST 3 SKIPPED: no purchases with non-empty productos found';
    END IF;
  ELSE
    RAISE NOTICE 'TEST 3 SKIPPED: purchases table does not exist';
  END IF;

  RAISE NOTICE 'All tests finished (see notices above)';
END$$;
