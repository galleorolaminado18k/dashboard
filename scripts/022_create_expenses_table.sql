-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  receipt_number TEXT,
  provider TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FIJOS', 'VARIABLES', 'MARKETING', 'LOGISTICA', 'OTROS')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('EFECTIVO', 'TRANSFERENCIA', 'CONTRAENTREGA')),
  status TEXT NOT NULL CHECK (status IN ('PAGADO', 'PENDIENTE PAGO', 'DEVOLUCION')),
  amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Insertar datos de ejemplo
INSERT INTO expenses (expense_date, receipt_number, provider, category, payment_method, status, amount, notes) VALUES
  (NOW() - INTERVAL '5 days', 'REC-001', 'Proveedor ABC', 'FIJOS', 'TRANSFERENCIA', 'PAGADO', 500000, 'Arriendo local'),
  (NOW() - INTERVAL '3 days', 'REC-002', 'Proveedor XYZ', 'VARIABLES', 'EFECTIVO', 'PAGADO', 150000, 'Materiales'),
  (NOW() - INTERVAL '2 days', 'REC-003', 'Marketing Digital', 'MARKETING', 'TRANSFERENCIA', 'PAGADO', 300000, 'Publicidad Facebook'),
  (NOW() - INTERVAL '1 day', 'REC-004', 'Coordinadora', 'LOGISTICA', 'TRANSFERENCIA', 'PAGADO', 80000, 'Envíos'),
  (NOW(), 'REC-005', 'Proveedor 123', 'OTROS', 'EFECTIVO', 'PENDIENTE PAGO', 120000, 'Varios');
