-- Eliminando tablas existentes para recrearlas correctamente
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Tabla de facturas con invoice_number como clave primaria
CREATE TABLE public.invoices (
  invoice_number TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_nit TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 19.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'contraentrega', 'credito')),
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de factura
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL REFERENCES public.invoices(invoice_number) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_invoices_client_name ON public.invoices(client_name);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de factura automático
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  new_invoice_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'FAC-' || year_part || '-(.*)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'FAC-' || year_part || '-%';
  
  new_invoice_number := 'FAC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Datos de ejemplo con manejo correcto de conflictos
INSERT INTO public.invoices (invoice_number, client_name, client_nit, client_email, client_phone, issue_date, due_date, subtotal, tax_amount, total, status, payment_method)
VALUES 
  ('FAC-2025-0001', 'María González', '900123456-7', 'maria@example.com', '3001234567', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 250000, 47500, 297500, 'paid', 'transferencia'),
  ('FAC-2025-0002', 'Carlos Rodríguez', '900234567-8', 'carlos@example.com', '3002345678', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 180000, 34200, 214200, 'pending', 'credito'),
  ('FAC-2025-0003', 'Laura Martínez', '900345678-9', 'laura@example.com', '3003456789', NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', 420000, 79800, 499800, 'overdue', 'credito')
ON CONFLICT (invoice_number) DO NOTHING;

-- Items de ejemplo sin ON CONFLICT ya que id es UUID autogenerado
INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
SELECT 'FAC-2025-0001', 'Anillo de Plata', 2, 125000, 250000
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_items WHERE invoice_id = 'FAC-2025-0001');

INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
SELECT 'FAC-2025-0002', 'Cadena de Oro 18k', 1, 180000, 180000
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_items WHERE invoice_id = 'FAC-2025-0002');

INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total)
SELECT 'FAC-2025-0003', 'Aretes de Oro', 1, 420000, 420000
WHERE NOT EXISTS (SELECT 1 FROM public.invoice_items WHERE invoice_id = 'FAC-2025-0003');
