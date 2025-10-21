-- Temporary test script: creates test conversation and purchase records, runs devolucion tests, then cleans up.
-- Use in Supabase SQL Editor on a development project only.

-- 1) Create test conversation in pedido-completo
WITH ins AS (
  INSERT INTO conversations(id, client_id, status, created_at, updated_at)
  VALUES (gen_random_uuid(), gen_random_uuid(), 'pedido-completo', NOW(), NOW())
  RETURNING id
)
SELECT id FROM ins;

-- Remember the inserted id manually from the result above and use it in the following block.
-- 2) Run a safe transition to devolucion (should succeed) and then clean up
DO $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM conversations WHERE status = 'pedido-completo' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE conversations SET status = 'devolucion', devolucion_razon = 'temp test' WHERE id = v_id;
    RAISE NOTICE 'Temp test updated conversation % to devolucion', v_id;
    -- Restore
    UPDATE conversations SET status = 'pedido-completo', devolucion_razon = NULL, devolucion_fecha = NULL WHERE id = v_id;
    RAISE NOTICE 'Temp test restored conversation % to pedido-completo', v_id;
    -- Delete it to clean up
    DELETE FROM conversations WHERE id = v_id;
    RAISE NOTICE 'Temp test deleted conversation %', v_id;
  ELSE
    RAISE NOTICE 'No conversation to test (pedido-completo)';
  END IF;
END$$;
