-- ============================================================================
-- SOLUCIÓN DEFINITIVA: Crear tabla sales y recargar caché de PostgREST
-- ============================================================================
-- Este script soluciona el error "Could not find the table 'public.sales' in the schema cache"
-- creando la tabla y forzando a PostgREST a recargar su caché de esquema.

-- 1) Limpia cualquier resto previo
DROP VIEW IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;

-- 2) Crea la tabla sales con todos los campos necesarios
CREATE TABLE public.sales (
  -- Identificación y timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  city TEXT NOT NULL,
  department TEXT,
  
  -- Productos y montos
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Cálculo de ingresos sin envío (para métricas)
  revenue_no_shipping NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - shipping_amount) STORED,
  
  -- Información de pago
  payment_method TEXT NOT NULL CHECK (payment_method IN ('contraentrega', 'efectivo', 'transferencia')),
  payment_date TIMESTAMPTZ,
  paid_by_mipaquete BOOLEAN DEFAULT false,
  
  -- Información de envío y logística
  mipaquete_code TEXT,
  mipaquete_status TEXT,
  transportadora TEXT,
  guia TEXT,
  
  -- Estado y devoluciones
  estado TEXT DEFAULT 'pendiente',
  is_return BOOLEAN DEFAULT false,
  return_date TIMESTAMPTZ,
  return_reason TEXT,
  
  -- Facturación y campaña
  invoice_number TEXT,
  campaign_id TEXT,
  evidencia TEXT
);

-- 3) Crear índices para mejorar rendimiento
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date DESC);
CREATE INDEX idx_sales_city ON public.sales(city);
CREATE INDEX idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX idx_sales_is_return ON public.sales(is_return);
CREATE INDEX idx_sales_mipaquete_code ON public.sales(mipaquete_code) WHERE mipaquete_code IS NOT NULL;
CREATE INDEX idx_sales_estado ON public.sales(estado);
CREATE INDEX idx_sales_campaign_id ON public.sales(campaign_id) WHERE campaign_id IS NOT NULL;

-- 4) Asegurar exposición del esquema y permisos para REST API
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.sales TO anon, authenticated;

-- 5) Habilitar Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 6) Crear políticas RLS permisivas (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir lectura pública de ventas"
  ON public.sales FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir inserción pública de ventas"
  ON public.sales FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de ventas"
  ON public.sales FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de ventas"
  ON public.sales FOR DELETE
  TO anon, authenticated
  USING (true);

-- 7) 🔥 CRÍTICO: Forzar a PostgREST a recargar el schema cache
-- Esto soluciona el error "Could not find the table 'public.sales' in the schema cache"
SELECT pg_notify('pgrst', 'reload schema');

-- 8) Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9) Crear trigger para actualizar updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICACIÓN: Después de ejecutar este script, prueba con:
-- ============================================================================
-- SELECT COUNT(*) FROM public.sales;
-- 
-- O desde tu aplicación, el endpoint /api/sales debería funcionar sin errores.
