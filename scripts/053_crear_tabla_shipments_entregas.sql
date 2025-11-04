-- ============================================================================
-- Migration 053: Crear tabla de envíos (shipments) y sincronización automática
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 2025-11-03
-- ============================================================================

-- ============================================================================
-- 1. CREAR TABLA DE ENVÍOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  invoice_number TEXT NOT NULL REFERENCES public.invoices(invoice_number) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,

  -- Información del envío
  shipment_code TEXT UNIQUE NOT NULL, -- ENV-2025-XXX
  tracking_number TEXT, -- Guía de la transportadora (MiPaquete)
  carrier TEXT, -- COORDINADORA, SERVIENTREGA, DEPRISA, etc.

  -- Cliente y destino
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  city TEXT,
  neighborhood TEXT, -- Barrio

  -- Estado y progreso
  status TEXT NOT NULL DEFAULT 'pending', -- pending, dispatched, in_transit, delivered, returned, delayed
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  mipaquete_status TEXT, -- Estado crudo de MiPaquete

  -- Fechas
  dispatch_date TIMESTAMP WITH TIME ZONE, -- Fecha de despacho
  estimated_delivery TIMESTAMP WITH TIME ZONE, -- ETA
  actual_delivery TIMESTAMP WITH TIME ZONE, -- Fecha real de entrega

  -- Notas y evidencias
  notes TEXT,
  delivery_evidence TEXT, -- URL de foto de entrega

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para mejorar rendimiento
  CONSTRAINT unique_invoice_shipment UNIQUE(invoice_number)
);

-- ============================================================================
-- 2. CREAR ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_shipments_invoice ON public.shipments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON public.shipments(carrier);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_city ON public.shipments(city);

-- ============================================================================
-- 3. FUNCIÓN PARA GENERAR CÓDIGO DE ENVÍO
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_shipment_code()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  next_number INTEGER;
  new_code TEXT;
BEGIN
  -- Formato: ENV-YYYY-MM-NNN
  year_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Obtener el siguiente número secuencial del mes actual
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(shipment_code FROM 'ENV-[0-9]{4}-[0-9]{2}-([0-9]+)')
      AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM public.shipments
  WHERE shipment_code LIKE 'ENV-' || year_month || '-%';

  -- Formatear con padding de 3 dígitos
  new_code := 'ENV-' || year_month || '-' || LPAD(next_number::TEXT, 3, '0');

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FUNCIÓN PARA CREAR ENVÍO AUTOMÁTICAMENTE DESDE FACTURA
-- ============================================================================
CREATE OR REPLACE FUNCTION create_shipment_from_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_shipment_code TEXT;
  v_sale_id UUID;
BEGIN
  -- Solo crear envío si el método de pago es CONTRAENTREGA
  IF LOWER(NEW.payment_method) != 'contraentrega' THEN
    RETURN NEW;
  END IF;

  -- Verificar si ya existe un envío para esta factura
  IF EXISTS (SELECT 1 FROM public.shipments WHERE invoice_number = NEW.invoice_number) THEN
    RAISE NOTICE 'Shipment already exists for invoice %', NEW.invoice_number;
    RETURN NEW;
  END IF;

  -- Generar código de envío
  v_shipment_code := generate_shipment_code();

  -- Obtener sale_id si existe
  SELECT id INTO v_sale_id
  FROM public.sales
  WHERE invoice_number = NEW.invoice_number
  LIMIT 1;

  -- Crear registro de envío
  INSERT INTO public.shipments (
    shipment_code,
    invoice_number,
    sale_id,
    tracking_number,
    carrier,
    client_name,
    client_phone,
    client_address,
    city,
    neighborhood,
    status,
    progress,
    dispatch_date,
    estimated_delivery,
    created_at
  )
  VALUES (
    v_shipment_code,
    NEW.invoice_number,
    v_sale_id,
    NEW.guia, -- Número de guía de MiPaquete
    NEW.transportadora, -- Transportadora
    NEW.client_name,
    NEW.client_phone,
    NEW.client_address,
    NEW.ciudad,
    NEW.barrio,
    CASE
      WHEN NEW.guia IS NOT NULL THEN 'dispatched'
      ELSE 'pending'
    END,
    CASE
      WHEN NEW.guia IS NOT NULL THEN 35 -- Si tiene guía, está despachado (35%)
      ELSE 0
    END,
    CASE
      WHEN NEW.guia IS NOT NULL THEN NOW()
      ELSE NULL
    END,
    CASE
      WHEN NEW.guia IS NOT NULL THEN NOW() + INTERVAL '3 days' -- ETA: 3 días después del despacho
      ELSE NULL
    END,
    NOW()
  );

  RAISE NOTICE 'Shipment % created for invoice %', v_shipment_code, NEW.invoice_number;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating shipment for invoice %: %', NEW.invoice_number, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGER PARA CREAR ENVÍO AUTOMÁTICAMENTE
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_create_shipment_from_invoice ON public.invoices;

CREATE TRIGGER trigger_create_shipment_from_invoice
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  WHEN (LOWER(NEW.payment_method) = 'contraentrega')
  EXECUTE FUNCTION create_shipment_from_invoice();

-- ============================================================================
-- 6. FUNCIÓN PARA ACTUALIZAR ESTADO DE ENVÍO DESDE MIPAQUETE
-- ============================================================================
CREATE OR REPLACE FUNCTION update_shipment_status(
  p_tracking_number TEXT,
  p_mipaquete_status TEXT,
  p_progress INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_mapped_status TEXT;
  v_progress INTEGER;
BEGIN
  -- Mapear estado de MiPaquete a nuestro sistema
  v_mapped_status := CASE
    WHEN UPPER(p_mipaquete_status) LIKE '%ENTREGADO%' THEN 'delivered'
    WHEN UPPER(p_mipaquete_status) LIKE '%DEVOL%' THEN 'returned'
    WHEN UPPER(p_mipaquete_status) LIKE '%RETRAS%' THEN 'delayed'
    WHEN UPPER(p_mipaquete_status) LIKE '%TRANSIT%' THEN 'in_transit'
    WHEN UPPER(p_mipaquete_status) LIKE '%DESPACHA%' THEN 'dispatched'
    ELSE 'in_transit'
  END;

  -- Calcular progreso si no se proporciona
  v_progress := COALESCE(p_progress, CASE v_mapped_status
    WHEN 'pending' THEN 0
    WHEN 'dispatched' THEN 35
    WHEN 'in_transit' THEN 70
    WHEN 'delivered' THEN 100
    WHEN 'returned' THEN 100
    WHEN 'delayed' THEN 55
    ELSE 50
  END);

  -- Actualizar envío
  UPDATE public.shipments
  SET
    status = v_mapped_status,
    mipaquete_status = p_mipaquete_status,
    progress = v_progress,
    actual_delivery = CASE
      WHEN v_mapped_status IN ('delivered', 'returned') THEN COALESCE(actual_delivery, NOW())
      ELSE actual_delivery
    END,
    updated_at = NOW()
  WHERE tracking_number = p_tracking_number;

END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGER PARA ACTUALIZAR TIMESTAMP
-- ============================================================================
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shipments_timestamp ON public.shipments;

CREATE TRIGGER trigger_update_shipments_timestamp
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- ============================================================================
-- 8. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================
COMMENT ON TABLE public.shipments IS 'Tabla de envíos - seguimiento de entregas';
COMMENT ON COLUMN public.shipments.shipment_code IS 'Código único de envío formato ENV-YYYY-MM-NNN';
COMMENT ON COLUMN public.shipments.tracking_number IS 'Número de guía de la transportadora (MiPaquete)';
COMMENT ON COLUMN public.shipments.status IS 'Estado: pending, dispatched, in_transit, delivered, returned, delayed';
COMMENT ON COLUMN public.shipments.progress IS 'Progreso del envío de 0 a 100';
COMMENT ON COLUMN public.shipments.mipaquete_status IS 'Estado crudo de MiPaquete';

-- ============================================================================
-- 9. MIGRAR FACTURAS EXISTENTES CON CONTRAENTREGA
-- ============================================================================
-- Crear envíos para facturas existentes que tengan contraentrega
INSERT INTO public.shipments (
  shipment_code,
  invoice_number,
  sale_id,
  tracking_number,
  carrier,
  client_name,
  client_phone,
  client_address,
  city,
  neighborhood,
  status,
  progress,
  dispatch_date,
  estimated_delivery,
  created_at
)
SELECT
  'ENV-' || TO_CHAR(i.issue_date, 'YYYY-MM') || '-' || LPAD(ROW_NUMBER() OVER (
    PARTITION BY TO_CHAR(i.issue_date, 'YYYY-MM')
    ORDER BY i.issue_date
  )::TEXT, 3, '0'),
  i.invoice_number,
  s.id,
  i.guia,
  i.transportadora,
  i.client_name,
  i.client_phone,
  i.client_address,
  i.ciudad,
  i.barrio,
  CASE
    WHEN i.guia IS NOT NULL THEN 'dispatched'
    ELSE 'pending'
  END,
  CASE
    WHEN i.guia IS NOT NULL THEN 35
    ELSE 0
  END,
  CASE
    WHEN i.guia IS NOT NULL THEN i.issue_date
    ELSE NULL
  END,
  CASE
    WHEN i.guia IS NOT NULL THEN i.issue_date + INTERVAL '3 days'
    ELSE NULL
  END,
  i.created_at
FROM public.invoices i
LEFT JOIN public.sales s ON s.invoice_number = i.invoice_number
WHERE LOWER(i.payment_method) = 'contraentrega'
AND NOT EXISTS (
  SELECT 1 FROM public.shipments sh WHERE sh.invoice_number = i.invoice_number
)
ORDER BY i.issue_date;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ver envíos creados
SELECT
  shipment_code,
  invoice_number,
  tracking_number,
  carrier,
  client_name,
  city,
  status,
  progress,
  dispatch_date,
  estimated_delivery
FROM public.shipments
ORDER BY created_at DESC
LIMIT 10;

-- Contar envíos por estado
SELECT status, COUNT(*) as total
FROM public.shipments
GROUP BY status
ORDER BY total DESC;

