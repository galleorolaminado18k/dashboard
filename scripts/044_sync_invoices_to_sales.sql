-- ============================================================================
-- Migration 044: Sincronización automática entre Facturas y Ventas
-- Versión: 2.0 - Revisión completa y corregida
-- Fecha: 2025-10-28
-- ============================================================================

-- 1. Agregar campos faltantes a la tabla invoices para mapear a sales
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS barrio TEXT,
ADD COLUMN IF NOT EXISTS guia TEXT,
ADD COLUMN IF NOT EXISTS transportadora TEXT,
ADD COLUMN IF NOT EXISTS evidencia TEXT,
ADD COLUMN IF NOT EXISTS vendedor TEXT DEFAULT 'Sistema',
ADD COLUMN IF NOT EXISTS sale_id UUID; -- Referencia a la venta creada

-- 2. Agregar índice para la relación
CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON public.invoices(sale_id);

-- 3. Actualizar tabla sales para incluir referencia a factura
-- Usar CONSTRAINT con nombre único para evitar errores en re-ejecuciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sales_invoice_id' AND table_name = 'sales'
  ) THEN
    ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS invoice_id TEXT;

    ALTER TABLE public.sales
    ADD CONSTRAINT fk_sales_invoice_id
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_number) ON DELETE SET NULL;
  ELSE
    -- Si la columna existe pero no la constraint, agregarla
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS invoice_id TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_invoice_id ON public.sales(invoice_id);

-- 4. Función para sincronizar factura a venta (VERSION CORREGIDA Y COMPLETA)
CREATE OR REPLACE FUNCTION sync_invoice_to_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_sale_id UUID;
  v_products JSONB;
  v_sale_status TEXT;
  v_items_count INTEGER;
  v_table_exists BOOLEAN;
BEGIN
  -- ========================================
  -- VALIDACIÓN 1: Verificar que invoice_number no sea NULL
  -- ========================================
  IF NEW.invoice_number IS NULL THEN
    RAISE NOTICE 'Invoice number es NULL, saltando sincronización';
    RETURN NEW;
  END IF;

  -- ========================================
  -- VALIDACIÓN 2: Verificar que la tabla invoice_items existe
  -- ========================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_items'
  ) INTO v_table_exists;

  v_items_count := 0;

  IF v_table_exists THEN
    -- Contar items para esta factura (ambos campos son TEXT)
    BEGIN
      SELECT COUNT(*) INTO v_items_count
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_number;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error contando items para factura %: %', NEW.invoice_number, SQLERRM;
        v_items_count := 0;
    END;
  END IF;

  -- ========================================
  -- CONSTRUCCIÓN DE PRODUCTOS
  -- ========================================
  IF v_items_count > 0 THEN
    BEGIN
      SELECT jsonb_agg(
        jsonb_build_object(
          'description', COALESCE(description, 'Sin descripción'),
          'quantity', COALESCE(quantity, 1),
          'unit_price', COALESCE(unit_price, 0),
          'total', COALESCE(total, 0)
        )
      )
      INTO v_products
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_number;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error construyendo productos para factura %: %', NEW.invoice_number, SQLERRM;
        v_products := NULL;
    END;
  END IF;

  -- Si no hay productos, crear uno genérico
  IF v_products IS NULL THEN
    IF COALESCE(NEW.total, 0) > 0 THEN
      v_products := jsonb_build_array(
        jsonb_build_object(
          'description', 'Productos de factura ' || NEW.invoice_number,
          'quantity', 1,
          'unit_price', NEW.total,
          'total', NEW.total
        )
      );
    ELSE
      v_products := '[]'::jsonb;
    END IF;
  END IF;

  -- ========================================
  -- MAPEO DE STATUS
  -- ========================================
  CASE
    WHEN UPPER(COALESCE(NEW.status, '')) IN ('PAID', 'PAGADO') THEN
      v_sale_status := 'pagada';
    WHEN UPPER(COALESCE(NEW.status, '')) IN ('PENDING', 'PENDIENTE', 'PENDIENTE PAGO', 'OVERDUE') THEN
      v_sale_status := 'pendiente';
    WHEN UPPER(COALESCE(NEW.status, '')) IN ('CANCELLED', 'DEVOLUCION') THEN
      v_sale_status := 'devolucion';
    ELSE
      v_sale_status := 'pendiente';
  END CASE;

  -- ========================================
  -- ACTUALIZAR O CREAR VENTA
  -- ========================================
  IF NEW.sale_id IS NOT NULL THEN
    -- Actualizar venta existente
    BEGIN
      UPDATE public.sales
      SET
        client_name = COALESCE(NEW.client_name, client_name, 'Cliente'),
        client_phone = COALESCE(NEW.client_phone, client_phone),
        client_address = COALESCE(NEW.client_address, client_address),
        city = COALESCE(NEW.ciudad, city),
        payment_method = COALESCE(LOWER(NEW.payment_method), payment_method),
        total_amount = COALESCE(NEW.total, total_amount, 0),
        products = v_products,
        status = v_sale_status,
        invoice_number = NEW.invoice_number,
        notes = NEW.notes,
        mipaquete_code = NEW.guia,
        updated_at = NOW(),
        invoice_id = NEW.invoice_number
      WHERE id = NEW.sale_id;

      v_sale_id := NEW.sale_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error actualizando venta % para factura %: %', NEW.sale_id, NEW.invoice_number, SQLERRM;
        RETURN NEW;
    END;
  ELSE
    -- Crear nueva venta
    BEGIN
      INSERT INTO public.sales (
        client_name,
        client_phone,
        client_address,
        city,
        payment_method,
        total_amount,
        shipping_amount,
        products,
        status,
        invoice_number,
        notes,
        mipaquete_code,
        created_at,
        updated_at,
        invoice_id,
        is_return
      )
      VALUES (
        COALESCE(NEW.client_name, 'Cliente'),
        COALESCE(NEW.client_phone, ''),
        COALESCE(NEW.client_address, ''),
        COALESCE(NEW.ciudad, ''),
        COALESCE(LOWER(NEW.payment_method), 'efectivo'),
        COALESCE(NEW.total, 0),
        0,
        v_products,
        v_sale_status,
        NEW.invoice_number,
        NEW.notes,
        NEW.guia,
        COALESCE(NEW.issue_date, NOW()),
        NOW(),
        NEW.invoice_number,
        CASE WHEN UPPER(COALESCE(NEW.status, '')) = 'DEVOLUCION' THEN true ELSE false END
      )
      RETURNING id INTO v_sale_id;

      -- Asignar el sale_id a la factura
      NEW.sale_id := v_sale_id;

      RAISE NOTICE 'Venta % creada para factura %', v_sale_id, NEW.invoice_number;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Venta duplicada para factura %, saltando creación', NEW.invoice_number;
        RETURN NEW;
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creando venta para factura %: %', NEW.invoice_number, SQLERRM;
        RETURN NEW;
    END;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error general en sync_invoice_to_sale para factura %: %', NEW.invoice_number, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger que se ejecuta ANTES de INSERT o UPDATE en invoices
-- Usamos BEFORE para poder modificar NEW.sale_id sin causar recursión
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_sale ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_to_sale
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_to_sale();

-- 6. Sincronizar facturas existentes con ventas (MIGRACIÓN COMPLETA Y SEGURA)
DO $$
DECLARE
  v_invoice_number TEXT;
  v_client_name TEXT;
  v_client_phone TEXT;
  v_client_address TEXT;
  v_ciudad TEXT;
  v_payment_method TEXT;
  v_total NUMERIC;
  v_status TEXT;
  v_notes TEXT;
  v_guia TEXT;
  v_issue_date TIMESTAMPTZ;
  v_sale_id UUID;
  v_products JSONB;
  v_sale_status TEXT;
  v_items_count INTEGER;
  v_table_exists BOOLEAN;
  v_processed_count INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  -- ========================================
  -- VALIDACIÓN: Verificar que invoice_items existe
  -- ========================================
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_items'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    RAISE NOTICE 'La tabla invoice_items no existe. Saltando migración de datos.';
    RETURN;
  END IF;

  RAISE NOTICE 'Iniciando migración de facturas existentes...';

  -- ========================================
  -- MIGRACIÓN: Procesar cada factura sin sale_id
  -- ========================================
  FOR v_invoice_number, v_client_name, v_client_phone, v_client_address, v_ciudad,
      v_payment_method, v_total, v_status, v_notes, v_guia, v_issue_date IN
    SELECT
      invoice_number,
      client_name,
      client_phone,
      client_address,
      ciudad,
      payment_method,
      total,
      status,
      notes,
      guia,
      issue_date
    FROM public.invoices
    WHERE sale_id IS NULL
      AND invoice_number IS NOT NULL  -- Filtrar NULLs
    ORDER BY issue_date DESC NULLS LAST
  LOOP
    BEGIN
      -- Verificar duplicados en sales
      IF EXISTS (
        SELECT 1 FROM public.sales
        WHERE invoice_id = v_invoice_number OR invoice_number = v_invoice_number
      ) THEN
        RAISE NOTICE 'Factura % ya tiene venta asociada, saltando', v_invoice_number;
        CONTINUE;
      END IF;

      -- Contar items
      SELECT COUNT(*) INTO v_items_count
      FROM public.invoice_items
      WHERE invoice_id = v_invoice_number;

      -- Construir productos
      IF v_items_count > 0 THEN
        SELECT jsonb_agg(
          jsonb_build_object(
            'description', COALESCE(description, 'Sin descripción'),
            'quantity', COALESCE(quantity, 1),
            'unit_price', COALESCE(unit_price, 0),
            'total', COALESCE(total, 0)
          )
        )
        INTO v_products
        FROM public.invoice_items
        WHERE invoice_id = v_invoice_number;
      ELSE
        v_products := jsonb_build_array(
          jsonb_build_object(
            'description', 'Productos de factura ' || v_invoice_number,
            'quantity', 1,
            'unit_price', COALESCE(v_total, 0),
            'total', COALESCE(v_total, 0)
          )
        );
      END IF;

      IF v_products IS NULL THEN
        v_products := '[]'::jsonb;
      END IF;

      -- Mapear status
      CASE
        WHEN UPPER(COALESCE(v_status, '')) IN ('PAID', 'PAGADO') THEN
          v_sale_status := 'pagada';
        WHEN UPPER(COALESCE(v_status, '')) IN ('PENDING', 'PENDIENTE', 'PENDIENTE PAGO', 'OVERDUE') THEN
          v_sale_status := 'pendiente';
        WHEN UPPER(COALESCE(v_status, '')) IN ('CANCELLED', 'DEVOLUCION') THEN
          v_sale_status := 'devolucion';
        ELSE
          v_sale_status := 'pendiente';
      END CASE;

      -- Crear venta
      INSERT INTO public.sales (
        client_name,
        client_phone,
        client_address,
        city,
        payment_method,
        total_amount,
        shipping_amount,
        products,
        status,
        invoice_number,
        notes,
        mipaquete_code,
        created_at,
        updated_at,
        invoice_id,
        is_return
      )
      VALUES (
        COALESCE(v_client_name, 'Cliente'),
        COALESCE(v_client_phone, ''),
        COALESCE(v_client_address, ''),
        COALESCE(v_ciudad, ''),
        LOWER(COALESCE(v_payment_method, 'efectivo')),
        COALESCE(v_total, 0),
        0,
        v_products,
        v_sale_status,
        v_invoice_number,
        v_notes,
        v_guia,
        COALESCE(v_issue_date, NOW()),
        NOW(),
        v_invoice_number,
        CASE WHEN UPPER(COALESCE(v_status, '')) = 'DEVOLUCION' THEN true ELSE false END
      )
      RETURNING id INTO v_sale_id;

      -- Actualizar factura con sale_id
      UPDATE public.invoices
      SET sale_id = v_sale_id
      WHERE invoice_number = v_invoice_number;

      v_processed_count := v_processed_count + 1;

      IF v_processed_count % 10 = 0 THEN
        RAISE NOTICE 'Procesadas % facturas...', v_processed_count;
      END IF;

    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Venta duplicada para factura %, saltando', v_invoice_number;
        v_error_count := v_error_count + 1;
      WHEN OTHERS THEN
        RAISE NOTICE 'Error procesando factura %: %', v_invoice_number, SQLERRM;
        v_error_count := v_error_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '===================================';
  RAISE NOTICE 'Migración completada:';
  RAISE NOTICE '  - Facturas procesadas: %', v_processed_count;
  RAISE NOTICE '  - Errores: %', v_error_count;
  RAISE NOTICE '===================================';
END $$;

-- 7. Comentarios para documentación
COMMENT ON COLUMN public.invoices.sale_id IS 'UUID de la venta asociada en la tabla sales';
COMMENT ON COLUMN public.invoices.ciudad IS 'Ciudad del cliente para sincronizar con ventas';
COMMENT ON COLUMN public.invoices.barrio IS 'Barrio del cliente';
COMMENT ON COLUMN public.invoices.guia IS 'Número de guía de envío (mipaquete_code en sales)';
COMMENT ON COLUMN public.invoices.transportadora IS 'Nombre de la transportadora';
COMMENT ON COLUMN public.invoices.evidencia IS 'URL o referencia de evidencia de entrega';
COMMENT ON COLUMN public.invoices.vendedor IS 'Nombre del vendedor que registró la factura';
COMMENT ON COLUMN public.sales.invoice_id IS 'Número de factura asociada';

COMMENT ON TRIGGER trigger_sync_invoice_to_sale ON public.invoices IS
  'Sincroniza automáticamente las facturas con la tabla de ventas. Al crear o actualizar una factura, se crea/actualiza la venta correspondiente.';

