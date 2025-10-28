-- =====================================================
-- SCRIPT 037: Crear productos en inventario
-- =====================================================
-- Descripción: Crea la tabla inventory e inserta productos de ejemplo
-- que se usarán en las facturas
-- =====================================================

-- PASO 0: Crear la tabla inventory si no existe
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(12, 2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);

-- Habilitar RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Política RLS (permitir acceso completo)
DROP POLICY IF EXISTS "Allow all operations on inventory" ON public.inventory;
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

-- PASO 1: Insertar productos en el inventario
INSERT INTO public.inventory (
  sku,
  name,
  description,
  category,
  price,
  cost,
  stock,
  min_stock,
  max_stock,
  status
) VALUES
  (
    'ORO-ANI-001',
    'Anillo de Oro 18K',
    'Anillo de oro 18 kilates con diseño clásico',
    'Joyería',
    1250000,
    800000,
    50,
    10,
    100,
    'active'
  ),
  (
    'PLA-CAD-002',
    'Cadena de Plata 925',
    'Cadena de plata ley 925 de 45cm',
    'Joyería',
    600000,
    350000,
    75,
    15,
    150,
    'active'
  ),
  (
    'ORO-ARE-003',
    'Aretes de Oro con Diamantes',
    'Aretes de oro 18K con diamantes naturales',
    'Joyería',
    3200000,
    2000000,
    30,
    5,
    50,
    'active'
  ),
  (
    'ORO-PUL-004',
    'Pulsera de Oro 18K',
    'Pulsera de oro 18 kilates con cadena gruesa',
    'Joyería',
    1800000,
    1100000,
    40,
    8,
    80,
    'active'
  ),
  (
    'PLA-ANI-005',
    'Anillo de Plata con Zirconia',
    'Anillo de plata 925 con piedra zirconia',
    'Joyería',
    280000,
    150000,
    100,
    20,
    200,
    'active'
  )
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  stock = EXCLUDED.stock,
  updated_at = NOW();

-- PASO 2: Verificar productos insertados
SELECT
  'PRODUCTO' as tipo,
  sku,
  name,
  category,
  price,
  stock,
  status
FROM public.inventory
WHERE sku LIKE 'ORO-%' OR sku LIKE 'PLA-%'
ORDER BY sku;

