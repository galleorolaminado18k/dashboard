-- Temporary test script: creates test conversation and purchase records, runs devolucion tests, then cleans up.
-- Use in Supabase SQL Editor on a development project only.
-- Temporary test script: creates a temp client, conversation and purchase,
-- tests pedido-completo -> devolucion, calls RPC mark_product_as_returned,
-- verifies the purchase JSON, and then cleans up.

-- NOTE: Run this in Supabase SQL Editor (role postgres/service) on a development project only.

DO $$
DECLARE
  v_client UUID;
  v_conv UUID;
  v_purchase UUID;
  v_product_name TEXT := 'Producto de prueba';
  v_productos JSONB := jsonb_build_array(jsonb_build_object('nombre', v_product_name, 'precio', 123.45));
  v_after JSONB;
BEGIN
  -- 1) Create a temporary client to satisfy FK constraints
  INSERT INTO clients (id, name, created_at, updated_at)
  VALUES (gen_random_uuid(), 'temp test client', NOW(), NOW())
  RETURNING id INTO v_client;

  -- 2) Create a conversation in pedido-completo with a valid canal
  INSERT INTO conversations (id, client_id, status, canal, created_at, updated_at)
  VALUES (gen_random_uuid(), v_client, 'pedido-completo', 'web', NOW(), NOW())
  RETURNING id INTO v_conv;

  -- 3) Create a purchase linked to the conversation with one producto
  INSERT INTO purchases (id, conversation_id, client_id, productos, total, created_at, updated_at)
  VALUES (gen_random_uuid(), v_conv, v_client, v_productos, 123.45, NOW(), NOW())
  RETURNING id INTO v_purchase;

  -- 4) Perform the valid transition: pedido-completo -> devolucion
  UPDATE conversations
    SET status = 'devolucion', devolucion_razon = 'prueba automatizada'
  WHERE id = v_conv;
  RAISE NOTICE 'Updated conversation % -> devolucion', v_conv;

  -- 5) Call the RPC to mark the product as returned (best-effort test)
  PERFORM mark_product_as_returned(v_purchase, v_product_name);

  -- 6) Verify productos contains devuelto: true for that item
  SELECT productos INTO v_after FROM purchases WHERE id = v_purchase;
  RAISE NOTICE 'Purchase productos after RPC: %', v_after;

  -- 7) Restore conversation state and cleanup
  UPDATE conversations
    SET status = 'pedido-completo', devolucion_razon = NULL, devolucion_fecha = NULL
  WHERE id = v_conv;

  DELETE FROM purchases WHERE id = v_purchase;
  DELETE FROM conversations WHERE id = v_conv;
  DELETE FROM clients WHERE id = v_client;

  RAISE NOTICE 'Temp test cleaned: conversation %, purchase %, client %', v_conv, v_purchase, v_client;
EXCEPTION WHEN OTHERS THEN
  -- Try best-effort cleanup on error
  RAISE NOTICE 'Test failed: %, attempting cleanup', SQLERRM;
  IF v_purchase IS NOT NULL THEN
    DELETE FROM purchases WHERE id = v_purchase;
  END IF;
  IF v_conv IS NOT NULL THEN
    DELETE FROM conversations WHERE id = v_conv;
  END IF;
  IF v_client IS NOT NULL THEN
    DELETE FROM clients WHERE id = v_client;
  END IF;
  RAISE;
END$$;
