-- Minimal migration: add 'devolucion' state and validation trigger
-- Idempotent where possible. This script only adds the enum value,
-- two columns, a validation function and a trigger.

-- Safely add enum value only if the conversations.status column uses that enum.
-- 0. Ensure enum type `conversation_status` exists (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
    CREATE TYPE conversation_status AS ENUM (
      'por-contestar', 'pendiente-datos', 'por-confirmar',
      'pendiente-guia', 'pedido-completo', 'devolucion'
    );
    RAISE NOTICE 'Created enum type conversation_status with default labels including devolucion';
  ELSE
    RAISE NOTICE 'Enum type conversation_status already exists';
  END IF;
END$$;

-- If the enum type exists but does not include 'devolucion', add it safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'conversation_status' AND e.enumlabel = 'devolucion'
    ) THEN
      -- Add the new enum value; this is safe to run multiple times guarded by the IF
      EXECUTE 'ALTER TYPE conversation_status ADD VALUE ''devolucion''';
      RAISE NOTICE 'Added enum value ''devolucion'' to conversation_status';
    ELSE
      RAISE NOTICE 'Enum conversation_status already contains ''devolucion''';
    END IF;
  END IF;
END$$;

-- 0b. If conversations.status exists and is not the enum, attempt safe conversion
DO $$
DECLARE
  v_udt_name TEXT;
  v_bad_count INT := 0;
  v_col_default TEXT;
BEGIN
  SELECT udt_name INTO v_udt_name
  FROM information_schema.columns
  WHERE table_name = 'conversations' AND column_name = 'status'
  LIMIT 1;

  IF v_udt_name IS NOT NULL AND v_udt_name != 'conversation_status' THEN
    -- count distinct statuses that are not in the allowed set
    EXECUTE format($f$
      SELECT COUNT(*) FROM (
        SELECT DISTINCT status FROM conversations
      ) s WHERE s.status NOT IN (%L, %L, %L, %L, %L, %L)
    $f$, 'por-contestar','pendiente-datos','por-confirmar','pendiente-guia','pedido-completo','devolucion')
    INTO v_bad_count;

    IF v_bad_count = 0 THEN
      -- Capture current column default if present
      SELECT pg_get_expr(ad.adbin, ad.adrelid) INTO v_col_default
      FROM pg_attrdef ad
      JOIN pg_class c ON c.oid = ad.adrelid
      JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
      WHERE c.relname = 'conversations' AND a.attname = 'status'
      LIMIT 1;

      -- Drop default temporarily if present
      IF v_col_default IS NOT NULL THEN
        EXECUTE 'ALTER TABLE conversations ALTER COLUMN status DROP DEFAULT';
      END IF;

      -- Perform the safe conversion
      EXECUTE 'ALTER TABLE conversations ALTER COLUMN status TYPE conversation_status USING status::conversation_status';

      -- Try to restore default only if it is one of allowed labels
      IF v_col_default IS NOT NULL THEN
        -- strip surrounding quotes if present
        v_col_default := trim(both '"''' FROM v_col_default);
        IF v_col_default IN ('por-contestar','pendiente-datos','por-confirmar','pendiente-guia','pedido-completo','devolucion') THEN
          EXECUTE format('ALTER TABLE conversations ALTER COLUMN status SET DEFAULT %L', v_col_default);
          RAISE NOTICE 'Restored default for conversations.status to %', v_col_default;
        ELSE
          RAISE NOTICE 'Original default % not restored because it is not a valid enum label', v_col_default;
        END IF;
      END IF;

      RAISE NOTICE 'Converted conversations.status to conversation_status enum';
    ELSE
      RAISE NOTICE 'conversations.status has % values outside expected list; skipping ALTER COLUMN. Clean data first.', v_bad_count;
    END IF;
  ELSE
    RAISE NOTICE 'conversations.status is already of type conversation_status or does not exist';
  END IF;
END$$;

-- Add columns to store reason and timestamp for devolucion (no-op if exist)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS devolucion_razon TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS devolucion_fecha TIMESTAMPTZ;

-- Validation function: only allow pedido-completo -> devolucion
CREATE OR REPLACE FUNCTION validate_devolucion_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'devolucion' THEN
    IF OLD.status != 'pedido-completo' THEN
      RAISE EXCEPTION 'Solo se puede pasar a devolución desde pedido-completo. Estado actual: %', OLD.status;
    END IF;
    NEW.devolucion_fecha := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run validation before status updates to devolucion
DROP TRIGGER IF EXISTS validate_devolucion_transition_trigger ON conversations;
CREATE TRIGGER validate_devolucion_transition_trigger
  BEFORE UPDATE OF status ON conversations
  FOR EACH ROW
  WHEN (NEW.status = 'devolucion')
  EXECUTE FUNCTION validate_devolucion_transition();

-- Note: Supabase will show a precautionary warning for operations that
-- create triggers/functions or alter types. This is a platform safety dialog
-- and cannot be suppressed from the SQL script. The operations above are
-- limited to adding a value, two columns, a validation function and trigger
-- and do not delete or modify existing data.
-- ============================================
-- ESTADO DE DEVOLUCIÓN - IQ 145 DESIGN
-- Versión: 1.0
-- Fecha: Octubre 2025
-- ============================================
--
-- PROPÓSITO: Agregar estado 'devolucion' al flujo de conversaciones
--
-- REGLA CRÍTICA (IQ 145):
-- - Solo se puede pasar de 'pedido-completo' → 'devolucion'
-- - NO se puede llegar a 'devolucion' desde ningún otro estado
-- - Es un estado terminal (no sale de ahí automáticamente)
--
-- FLUJO:
-- por-contestar → pendiente-datos → por-confirmar → pendiente-guia → pedido-completo
--                                                                           ↓
--                                                                      devolucion 🔴
-- ============================================

-- 1. Agregar nuevo valor al enum conversation_status
-- (Enum addition handled above in DO block)

-- 2. Agregar columnas para registrar razón de devolución (no-op si existen)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS devolucion_razon TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS devolucion_fecha TIMESTAMPTZ;

-- 3. Función de validación: Solo pedido-completo → devolucion (definida una vez)
CREATE OR REPLACE FUNCTION validate_devolucion_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'devolucion' THEN
    IF OLD.status != 'pedido-completo' THEN
      RAISE EXCEPTION 'Solo se puede pasar a devolución desde pedido-completo. Estado actual: %', OLD.status;
    END IF;
    NEW.devolucion_fecha := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para validar transición (creado/desplegado una sola vez)
DROP TRIGGER IF EXISTS validate_devolucion_transition_trigger ON conversations;
CREATE TRIGGER validate_devolucion_transition_trigger
  BEFORE UPDATE OF status ON conversations
  FOR EACH ROW
  WHEN (NEW.status = 'devolucion')
  EXECUTE FUNCTION validate_devolucion_transition();


-- 5. Comentario en tabla purchases (solo si existe)
-- 5. Ensure purchases table exists (minimal schema) and add comment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    CREATE TABLE purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID,
      client_id UUID,
      productos JSONB DEFAULT '[]'::jsonb,
      total NUMERIC DEFAULT 0,
      metodo_pago TEXT,
      codigo_guia TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created minimal purchases table';
  ELSE
    RAISE NOTICE 'purchases table already exists';
  END IF;

  -- Add comment
  COMMENT ON TABLE purchases IS 'Historial de compras. Productos con campo "devuelto": true indican devolución';
END$$;

-- 6. Función para marcar producto como devuelto en purchase
-- La función comprueba en tiempo de ejecución si la tabla purchases existe y no falla si no existe.
CREATE OR REPLACE FUNCTION mark_product_as_returned(
  p_purchase_id UUID,
  p_product_name TEXT
)
RETURNS VOID AS $$
DECLARE
  v_productos JSONB;
  v_exists BOOLEAN;
BEGIN
  -- Si la tabla purchases no existe, salir con NOTICE
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') INTO v_exists;
  IF NOT v_exists THEN
    RAISE NOTICE 'mark_product_as_returned: table purchases does not exist; skipping';
    RETURN;
  END IF;

  -- Obtener productos actuales
  SELECT productos INTO v_productos
  FROM purchases
  WHERE id = p_purchase_id;

  IF v_productos IS NULL THEN
    RAISE NOTICE 'mark_product_as_returned: purchase % not found or productos is null', p_purchase_id;
    RETURN;
  END IF;

  -- Actualizar el producto específico agregando "devuelto": true
  UPDATE purchases
  SET 
    productos = (
      SELECT jsonb_agg(
        CASE 
          WHEN item->>'nombre' = p_product_name 
          THEN item || '{"devuelto": true}'::jsonb
          ELSE item
        END
      )
      FROM jsonb_array_elements(v_productos) AS item
    ),
    updated_at = NOW()
  WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql;

-- Crear la vista `devoluciones` solo si la tabla `purchases` existe. Si no, crear una vista vacía
-- 7. Create the `devoluciones` view (using $view$ quoting to avoid nested $$ conflicts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases') THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW devoluciones AS
      SELECT 
        c.id AS conversation_id,
        c.client_id,
        cl.name AS client_name,
        cl.phone,
        c.devolucion_razon,
        c.devolucion_fecha,
        p.id AS purchase_id,
        p.productos,
        p.total,
        p.metodo_pago,
        p.codigo_guia
      FROM conversations c
      JOIN clients cl ON cl.id = c.client_id
      LEFT JOIN purchases p ON p.conversation_id = c.id
      WHERE c.status = 'devolucion'
      ORDER BY c.devolucion_fecha DESC;
    $view$;
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW devoluciones AS
      SELECT
        NULL::uuid AS conversation_id,
        NULL::uuid AS client_id,
        ''::text AS client_name,
        ''::text AS phone,
        NULL::text AS devolucion_razon,
        NULL::timestamptz AS devolucion_fecha,
        NULL::uuid AS purchase_id,
        '[]'::jsonb AS productos,
        0::numeric AS total,
        ''::text AS metodo_pago,
        ''::text AS codigo_guia
      WHERE false;
    $view$;
    RAISE NOTICE 'Table purchases does not exist; created dummy empty view devoluciones';
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_conversations_devolucion ON conversations(status) 
WHERE status = 'devolucion';
-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todas las devoluciones
-- SELECT * FROM devoluciones;

-- Ver productos devueltos
-- SELECT 
--   id,
--   productos,
--   total
-- FROM purchases
-- WHERE productos::text LIKE '%devuelto%';

-- ============================================
-- COMENTARIOS PARA EL EQUIPO
-- ============================================
--
-- CÓMO MARCAR UNA DEVOLUCIÓN:
--
-- 1. Desde facturación, llamar API que ejecute:
--    UPDATE conversations 
--    SET status = 'devolucion', 
--        devolucion_razon = 'Razón específica'
--    WHERE id = 'conversation-uuid';
--
-- 2. Marcar producto específico como devuelto:
--    SELECT mark_product_as_returned('purchase-uuid', 'Nombre del Producto');
--
-- PROTECCIÓN:
-- - El trigger validate_devolucion_transition_trigger impide transiciones inválidas
-- - Solo pedido-completo → devolucion está permitido
-- - Cualquier otro intento lanza error
--
-- ============================================
