-- Migration 044: Sincronización automática entre Facturas y Ventas
-- Cuando se crea o actualiza una factura, automáticamente se crea/actualiza en ventas

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
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS invoice_id TEXT REFERENCES public.invoices(invoice_number) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_invoice_id ON public.sales(invoice_id);

-- 4. Función para sincronizar factura a venta
CREATE OR REPLACE FUNCTION sync_invoice_to_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_sale_id UUID;
  v_products JSONB;
  v_sale_status TEXT;
  v_items_count INTEGER;
BEGIN
  -- Verificar si existe la tabla invoice_items y contar items
  SELECT COUNT(*) INTO v_items_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'invoice_items';

  IF v_items_count > 0 THEN
    -- Construir el JSONB de productos desde invoice_items
    SELECT jsonb_agg(
      jsonb_build_object(
        'description', COALESCE(description, ''),
        'quantity', COALESCE(quantity, 1),
        'unit_price', COALESCE(unit_price, 0),
        'total', COALESCE(total, 0)
      )
    )
    INTO v_products
    FROM public.invoice_items
    WHERE invoice_id = NEW.invoice_number;
  END IF;

  -- Si no hay productos aún, usar un array vacío o crear uno genérico
  IF v_products IS NULL THEN
    IF NEW.total > 0 THEN
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

  -- Mapear status de factura a status de venta
  -- invoices: 'paid', 'pending', 'overdue', 'cancelled', 'PENDIENTE PAGO', 'PAGADO', 'DEVOLUCION'
  -- sales: 'pendiente', 'pagada', 'devolucion'
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

  -- Si ya existe una venta asociada, actualizarla
  IF NEW.sale_id IS NOT NULL THEN
    UPDATE public.sales
    SET
      client_name = COALESCE(NEW.client_name, client_name),
      client_phone = COALESCE(NEW.client_phone, client_phone),
      client_address = COALESCE(NEW.client_address, client_address),
      city = COALESCE(NEW.ciudad, city),
      payment_method = COALESCE(LOWER(NEW.payment_method), payment_method),
      total_amount = COALESCE(NEW.total, total_amount),
      products = v_products,
      status = v_sale_status,
      invoice_number = NEW.invoice_number,
      notes = NEW.notes,
      mipaquete_code = NEW.guia,
      updated_at = NOW(),
      invoice_id = NEW.invoice_number
    WHERE id = NEW.sale_id;

    v_sale_id := NEW.sale_id;
  ELSE
    -- Crear nueva venta
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
      0, -- Por defecto
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

    -- Actualizar la factura con el sale_id
    UPDATE public.invoices
    SET sale_id = v_sale_id
    WHERE invoice_number = NEW.invoice_number;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en sync_invoice_to_sale para factura %: %', NEW.invoice_number, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger que se ejecuta después de INSERT o UPDATE en invoices
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_sale ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_to_sale
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_to_sale();

-- 6. Sincronizar facturas existentes con ventas (migración de datos)
DO $$
DECLARE
  invoice_record RECORD;
  v_sale_id UUID;
  v_products JSONB;
  v_sale_status TEXT;
  v_items_count INTEGER;
BEGIN
  -- Verificar que la tabla invoice_items existe
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoice_items'
  ) THEN
    RAISE NOTICE 'La tabla invoice_items no existe. Saltando migración de datos.';
    RETURN;
  END IF;

  FOR invoice_record IN
    SELECT * FROM public.invoices WHERE sale_id IS NULL
  LOOP
    -- Verificar si hay items para esta factura (invoice_id es TEXT)
    SELECT COUNT(*) INTO v_items_count
    FROM public.invoice_items
    WHERE invoice_id = invoice_record.invoice_number::TEXT;

    -- Construir productos solo si existen items
    IF v_items_count > 0 THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'description', COALESCE(description, ''),
          'quantity', COALESCE(quantity, 1),
          'unit_price', COALESCE(unit_price, 0),
          'total', COALESCE(total, 0)
        )
      )
      INTO v_products
      FROM public.invoice_items
      WHERE invoice_id = invoice_record.invoice_number::TEXT;
    ELSE
      -- Si no hay items, crear un producto genérico con el total
      v_products := jsonb_build_array(
        jsonb_build_object(
          'description', 'Productos de factura ' || invoice_record.invoice_number,
          'quantity', 1,
          'unit_price', COALESCE(invoice_record.total, 0),
          'total', COALESCE(invoice_record.total, 0)
        )
      );
    END IF;

    IF v_products IS NULL THEN
      v_products := '[]'::jsonb;
    END IF;

    -- Mapear status
    CASE
      WHEN UPPER(COALESCE(invoice_record.status, '')) IN ('PAID', 'PAGADO') THEN
        v_sale_status := 'pagada';
      WHEN UPPER(COALESCE(invoice_record.status, '')) IN ('PENDING', 'PENDIENTE', 'PENDIENTE PAGO', 'OVERDUE') THEN
        v_sale_status := 'pendiente';
      WHEN UPPER(COALESCE(invoice_record.status, '')) IN ('CANCELLED', 'DEVOLUCION') THEN
        v_sale_status := 'devolucion';
      ELSE
        v_sale_status := 'pendiente';
    END CASE;

    -- Crear venta con manejo de errores
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
        COALESCE(invoice_record.client_name, 'Cliente'),
        COALESCE(invoice_record.client_phone, ''),
        COALESCE(invoice_record.client_address, ''),
        COALESCE(invoice_record.ciudad, ''),
        LOWER(COALESCE(invoice_record.payment_method, 'efectivo')),
        COALESCE(invoice_record.total, 0),
        0,
        v_products,
        v_sale_status,
        invoice_record.invoice_number::TEXT,
        invoice_record.notes,
        invoice_record.guia,
        COALESCE(invoice_record.issue_date, NOW()),
        NOW(),
        invoice_record.invoice_number::TEXT,
        CASE WHEN UPPER(COALESCE(invoice_record.status, '')) = 'DEVOLUCION' THEN true ELSE false END
      )
      RETURNING id INTO v_sale_id;

      -- Actualizar factura con sale_id
      IF v_sale_id IS NOT NULL THEN
        UPDATE public.invoices
        SET sale_id = v_sale_id
        WHERE invoice_number = invoice_record.invoice_number;

        RAISE NOTICE 'Sincronizada factura % con venta %', invoice_record.invoice_number, v_sale_id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error al sincronizar factura %: %', invoice_record.invoice_number, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Migración de datos completada';
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

