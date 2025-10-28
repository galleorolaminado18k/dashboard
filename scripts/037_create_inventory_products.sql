-- =====================================================
-- SCRIPT 037: Crear productos en inventario
-- =====================================================
-- Descripción: Inserta productos de ejemplo en inventory
-- que se usarán en las facturas
-- =====================================================

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
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  stock = EXCLUDED.stock;

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

