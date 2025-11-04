-- ============================================================================
-- FIX INMEDIATO: Actualizar manualmente el envío con novedad
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase
-- Este script actualiza directamente el estado a NOVEDAD
-- ============================================================================

-- 1. Ver estado actual
SELECT
  shipment_code,
  tracking_number,
  status,
  mipaquete_status,
  progress,
  updated_at
FROM shipments
WHERE tracking_number = '58048080554';

-- 2. Actualizar a estado con NOVEDAD
UPDATE shipments
SET
  status = 'delayed',
  mipaquete_status = 'Usuario cancela pedido',
  progress = 50,
  updated_at = NOW()
WHERE tracking_number = '58048080554';

-- 3. Verificar actualización
SELECT
  shipment_code,
  tracking_number,
  status,
  mipaquete_status,
  progress,
  updated_at
FROM shipments
WHERE tracking_number = '58048080554';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- status: 'delayed'
-- mipaquete_status: 'Usuario cancela pedido'
-- progress: 50
-- updated_at: [timestamp actual]

