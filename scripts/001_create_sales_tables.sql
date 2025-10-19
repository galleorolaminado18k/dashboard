-- Tabla de ventas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  products JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completada', 'pendiente', 'cancelada')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'contraentrega')),
  seller_name TEXT NOT NULL,
  photo_evidence TEXT,
  shipping_company TEXT,
  tracking_number TEXT,
  mipaquete_code TEXT,
  is_return BOOLEAN DEFAULT FALSE,
  return_date TIMESTAMP WITH TIME ZONE,
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
CREATE INDEX IF NOT EXISTS idx_return_tracking_mipaquete_code ON public.return_tracking(mipaquete_code);

-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir acceso completo por ahora, ajustar según necesidades de autenticación)
CREATE POLICY "Allow all operations on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
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
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
