-- Solución definitiva: Crear tabla public.sales
-- Basado en la estructura recomendada para el dashboard

-- 1. Limpiar cualquier versión anterior
DROP VIEW IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;

-- 2. Crear tabla sales con todos los campos necesarios
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Información del cliente
  client_name TEXT,
  client_phone TEXT,
  client_address TEXT,
  city TEXT,
  
  -- Información de productos
  products JSONB DEFAULT '[]'::jsonb,
  
  -- Información financiera
  payment_method TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue_no_shipping NUMERIC(12,2) GENERATED ALWAYS AS 
    (COALESCE(total_amount, 0) - COALESCE(shipping_amount, 0)) STORED,
  
  -- Estado de la venta
  status TEXT DEFAULT 'pendiente',
  is_return BOOLEAN NOT NULL DEFAULT false,
  
  -- Información de envío (MiPaquete)
  mipaquete_code TEXT,
  mipaquete_status TEXT,
  paid_by_mipaquete BOOLEAN DEFAULT false,
  carrier TEXT,
  
  -- Facturación
  invoice_number TEXT,
  
  -- Marketing y atribución
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Evidencia
  evidence_url TEXT,
  
  -- Auditoría
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX idx_sales_city ON public.sales(city);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX idx_sales_mipaquete_code ON public.sales(mipaquete_code);
CREATE INDEX idx_sales_campaign_id ON public.sales(campaign_id);
CREATE INDEX idx_sales_is_return ON public.sales(is_return);

-- 4. Habilitar Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de acceso (permisivas para desarrollo)
CREATE POLICY "Permitir lectura a todos" ON public.sales
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción a todos" ON public.sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización a todos" ON public.sales
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación a todos" ON public.sales
  FOR DELETE USING (true);

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualizar updated_at
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Insertar datos de ejemplo para pruebas
INSERT INTO public.sales (
  client_name, client_phone, city, payment_method, 
  total_amount, shipping_amount, status, products
) VALUES
  ('Juan Pérez', '3001234567', 'Bogotá', 'contraentrega', 150000, 15000, 'entregado', '[{"name":"Producto A","quantity":2,"price":67500}]'::jsonb),
  ('María García', '3009876543', 'Medellín', 'transferencia', 200000, 20000, 'pendiente', '[{"name":"Producto B","quantity":1,"price":200000}]'::jsonb),
  ('Carlos López', '3005551234', 'Cali', 'contraentrega', 180000, 18000, 'en_transito', '[{"name":"Producto C","quantity":3,"price":60000}]'::jsonb),
  ('Ana Martínez', '3007778888', 'Barranquilla', 'transferencia', 250000, 25000, 'entregado', '[{"name":"Producto D","quantity":1,"price":250000}]'::jsonb),
  ('Luis Rodríguez', '3002223333', 'Cartagena', 'contraentrega', 120000, 12000, 'pendiente', '[{"name":"Producto E","quantity":2,"price":60000}]'::jsonb);

COMMENT ON TABLE public.sales IS 'Tabla principal de ventas del dashboard';
