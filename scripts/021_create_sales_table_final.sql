-- Script para crear la tabla sales con todos los campos necesarios
-- Este script incluye todas las migraciones previas en una sola tabla

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  products JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PAGADO', 'PENDIENTE PAGO', 'DEVOLUCION')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'contraentrega')),
  seller_name TEXT NOT NULL,
  photo_evidence TEXT,
  photo_uploaded_at TIMESTAMP WITH TIME ZONE,
  shipping_company TEXT,
  tracking_number TEXT,
  mipaquete_code TEXT,
  mipaquete_status TEXT,
  mipaquete_carrier TEXT,
  is_return BOOLEAN DEFAULT FALSE,
  return_date TIMESTAMP WITH TIME ZONE,
  paid_by_mipaquete BOOLEAN DEFAULT FALSE,
  payment_date TIMESTAMP WITH TIME ZONE,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para tracking de devoluciones
CREATE TABLE IF NOT EXISTS public.return_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  mipaquete_code TEXT NOT NULL,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  tracking_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_mipaquete_code ON public.sales(mipaquete_code);
CREATE INDEX IF NOT EXISTS idx_sales_paid_by_mipaquete ON public.sales(paid_by_mipaquete);
CREATE INDEX IF NOT EXISTS idx_sales_payment_date ON public.sales(payment_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_photo_uploaded_at ON public.sales(photo_uploaded_at);
CREATE INDEX IF NOT EXISTS idx_return_tracking_mipaquete_code ON public.return_tracking(mipaquete_code);

-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acceso completo por ahora)
DROP POLICY IF EXISTS "Allow all operations on sales" ON public.sales;
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on return_tracking" ON public.return_tracking;
CREATE POLICY "Allow all operations on return_tracking" ON public.return_tracking FOR ALL USING (true) WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.sales IS 'Tabla principal de ventas con todos los campos necesarios para el sistema';
COMMENT ON COLUMN public.sales.status IS 'Estados válidos: PAGADO (ya se recibió el pago), PENDIENTE PAGO (contraentrega/crédito), DEVOLUCION (producto devuelto)';
COMMENT ON COLUMN public.sales.payment_method IS 'Métodos de pago: efectivo, transferencia, contraentrega';
COMMENT ON COLUMN public.sales.invoice_number IS 'Número de factura asociado a esta venta';
