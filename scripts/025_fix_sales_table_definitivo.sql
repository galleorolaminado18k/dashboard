-- ==========================================================
--  SOLUCIÓN DEFINITIVA: Crear tabla public.sales
--  Esto elimina el error 404 de PostgREST y hace que
--  /rest/v1/sales funcione inmediatamente
-- ==========================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Eliminar tabla existente si hay conflictos
DROP TABLE IF EXISTS public.sales CASCADE;

-- ==========================================================
--  1. Crear tabla public.sales con todas las columnas
-- ==========================================================
CREATE TABLE public.sales (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Información de la venta
  city                 TEXT,                         -- Ciudad (usado por Geografía)
  payment_method       TEXT,                         -- contraentrega, transferencia, etc.
  is_return            BOOLEAN NOT NULL DEFAULT false,
  mipaquete_code       TEXT,                         -- Código de guía logística
  
  -- Montos
  total_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,   -- Total con envío
  shipping_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,   -- Costo de envío
  
  -- Marketing
  campaign_id          TEXT,                         -- ID/Nombre de campaña
  
  -- 💡 Columna calculada: Ingresos SIN envío (dato real para reportes)
  revenue_no_shipping  NUMERIC(12,2) GENERATED ALWAYS AS
      (COALESCE(total_amount, 0) - COALESCE(shipping_amount, 0)) STORED,
  
  -- Campos adicionales de la aplicación
  client_name          TEXT,
  client_phone         TEXT,
  client_address       TEXT,
  products             JSONB,                        -- Array de productos
  status               TEXT DEFAULT 'pendiente',     -- pendiente, pagada, devolucion
  invoice_number       TEXT,                         -- Número de factura
  notes                TEXT,                         -- Notas adicionales
  
  -- Campos de MiPaquete
  paid_by_mipaquete    BOOLEAN DEFAULT false,
  mipaquete_status     TEXT,
  
  -- Auditoría
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
--  2. Crear índices para mejorar rendimiento
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_sales_created_at 
  ON public.sales(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_city 
  ON public.sales(city);

CREATE INDEX IF NOT EXISTS idx_sales_payment_method 
  ON public.sales(payment_method);

CREATE INDEX IF NOT EXISTS idx_sales_is_return 
  ON public.sales(is_return);

CREATE INDEX IF NOT EXISTS idx_sales_mipaquete 
  ON public.sales(mipaquete_code);

CREATE INDEX IF NOT EXISTS idx_sales_campaign 
  ON public.sales(campaign_id);

CREATE INDEX IF NOT EXISTS idx_sales_status 
  ON public.sales(status);

-- ==========================================================
--  3. Otorgar permisos para REST (PostgREST)
-- ==========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.sales TO anon, authenticated;

-- Permitir INSERT, UPDATE, DELETE para service_role (backend)
GRANT INSERT, UPDATE, DELETE ON public.sales TO service_role;

-- ==========================================================
--  4. Habilitar Row Level Security (RLS) con políticas
-- ==========================================================
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT a todos (anon y authenticated)
DROP POLICY IF EXISTS sales_select_anyone ON public.sales;
CREATE POLICY sales_select_anyone
  ON public.sales
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política: Permitir todas las operaciones a service_role
DROP POLICY IF EXISTS sales_write_service_role ON public.sales;
CREATE POLICY sales_write_service_role
  ON public.sales
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==========================================================
--  5. 🔑 CLAVE: Forzar recarga del schema cache de PostgREST
--     Esto hace que el endpoint /rest/v1/sales sea visible
--     inmediatamente sin necesidad de reiniciar
-- ==========================================================
SELECT pg_notify('pgrst', 'reload schema');

-- ==========================================================
--  6. (OPCIONAL) Insertar datos de prueba
--     Descomenta estas líneas si quieres ver datos inmediatamente
-- ==========================================================
/*
INSERT INTO public.sales (
  city, payment_method, is_return, mipaquete_code, 
  total_amount, shipping_amount, campaign_id,
  client_name, client_phone, status
)
VALUES
  ('Bogotá', 'contraentrega', false, 'MP-TEST-001', 
   180000, 10000, 'cmp_whatsapp_mayor',
   'Juan Pérez', '3001234567', 'pagada'),
  
  ('Medellín', 'transferencia', false, 'MP-TEST-002', 
   250000, 15000, 'cmp_balines_aug',
   'María García', '3109876543', 'pagada'),
  
  ('Cali', 'contraentrega', false, 'MP-TEST-003', 
   120000, 8000, 'cmp_whatsapp_mayor',
   'Carlos López', '3201112233', 'pendiente'),
  
  ('Barranquilla', 'transferencia', false, 'MP-TEST-004', 
   300000, 12000, 'cmp_balines_aug',
   'Ana Martínez', '3154445566', 'pagada');
*/

-- ==========================================================
--  ✅ LISTO: El endpoint /rest/v1/sales ahora existe y funciona
--  Tu página de Geografía cargará correctamente
-- ==========================================================
